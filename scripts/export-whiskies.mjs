// 보틀 렌즈(wine 저장소) DB 에서 위스키만 뽑아 data/whiskies.json 으로 쓴다.
//
//   node scripts/export-whiskies.mjs ../wine/.env.local
//
// 읽기만 한다 — 기존 DB 에는 아무것도 쓰지 않는다.
// 이야기·검증·판매처 짝 맞추기 같은 데이터 작업은 당분간 wine 저장소에서 하고,
// 여기서는 그 결과를 다시 뽑아 온다. 그래서 몇 번을 돌려도 같은 결과가 나오게 짰다.
//
// 앱이 쓰는 칸만 남긴다. 번역(i18n)·검증 기록·이미지 원본 주소 같은 관리용 칸은 버린다.
// 인기는 데일리샷 후기 수로 센다 — 실제로 사서 마신 사람 수에 가장 가까운 숫자다.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MongoClient } from "mongodb";

const here = path.dirname(fileURLToPath(import.meta.url));
const envPath = process.argv[2];
if (!envPath) {
  console.error("사용법: node scripts/export-whiskies.mjs <wine 저장소의 .env.local 경로>");
  process.exit(1);
}

const env = Object.fromEntries(
  fs.readFileSync(envPath, "utf8").split(/\r?\n/)
    .map((l) => l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2].replace(/^["']|["']$/g, "")])
);

const clip = (list, n) => (Array.isArray(list) ? list.slice(0, n) : []);
const text = (s) => (typeof s === "string" && s.trim() ? s.trim() : null);

const client = new MongoClient(env.MONGODB_URI);
await client.connect();
try {
  const db = client.db(env.MONGODB_DB);
  const docs = await db.collection("catalog").find({ category: "whisky", hidden: { $ne: true } }).toArray();

  // 데일리샷 색인 — 판매처 상품 번호(id)로 잇는다
  const dsIds = docs.map((d) => d.sourceFacts?.dailyshot?.id).filter(Boolean);
  const dsDocs = await db.collection("dailyshot").find({ id: { $in: dsIds } }, { projection: { history: 0 } }).toArray();
  const dsById = new Map(dsDocs.map((d) => [d.id, d]));

  const out = docs.map((d) => {
    const r = d.result || {};
    const link = d.sourceFacts?.dailyshot;
    const ds = link ? dsById.get(link.id) : null;
    return {
      id: String(d._id),
      name: r.name || d.name,
      nameEn: d.i18n?.en?.name || link?.enName || null,
      type: text(r.type),
      country: text(r.country),
      region: text(r.region),
      alcohol: text(r.alcohol),
      liquidColor: /^#[0-9a-f]{6}$/i.test(r.liquidColor || "") ? r.liquidColor : null,
      image: d.image || ds?.image || null,
      priceBand: d.priceBand ?? r.priceBand ?? null,
      tags: clip(d.tags || r.tags, 4),
      beginner: d.beginner ?? r.beginner ?? null,
      tasteProfile: clip(r.tasteProfile, 6),
      tastingNotes: text(r.tastingNotes),
      story: text(r.story),
      specs: clip(r.specs, 4),
      foodPairing: clip(r.foodPairing, 4).map(({ emoji, food, why }) => ({ emoji, food, why })),
      servingNote: text(r.servingNote),
      aging: text(r.aging)?.length <= 20 ? text(r.aging) : null,
      similar: clip(r.similar, 6),
      dailyshot: ds
        ? {
            id: ds.id,
            url: ds.url,
            reviews: ds.reviews ?? 0,
            rating: ds.rating ?? null,
            sellers: ds.sellers ?? null,
            price: ds.price ?? null,
            low: ds.low ?? null,
            lowAt: ds.lowAt ?? null,
          }
        : null,
      popularity: ds?.reviews ?? 0,
    };
  });

  // 같은 판매처 상품에 붙은 두 문서는 같은 술이다 — 원본 DB 에 이름만 다르게 두 번 들어간 것들이다
  //   페이머스 그라우스 = 더 페이머스 그라우스 40도 · 조니워커 그린 15년 = 그린 레이블 43도
  // 하나만 남기고 나머지 이름은 별칭(aliases)으로 붙여 그 이름으로도 찾히게 한다.
  // 남길 것: 이야기가 있는 것 → 사진이 있는 것 → 이름 끝에 도수("40도")가 붙지 않은 것 → 이름이 긴 것
  const rank = (w) =>
    (w.story ? 8 : 0) + (w.image ? 4 : 0) + (/\d+(\.\d+)?\s*도$/.test(w.name) ? 0 : 2) + Math.min(w.name.length, 30) / 100;
  const byDs = new Map();
  const merged = [];
  for (const w of out) {
    const key = w.dailyshot?.id;
    if (!key) { merged.push(w); continue; }
    const kept = byDs.get(key);
    if (!kept) { byDs.set(key, w); merged.push(w); continue; }
    const [keep, drop] = rank(w) > rank(kept) ? [w, kept] : [kept, w];
    keep.aliases = [...new Set([...(keep.aliases || []), drop.name, ...(drop.aliases || [])])];
    if (keep !== kept) merged[merged.indexOf(kept)] = keep;
    byDs.set(key, keep);
  }
  const dropped = out.length - merged.length;
  out.length = 0;
  out.push(...merged);

  // 인기순 — 같은 인기면 이름순으로 고정해 돌릴 때마다 순서가 바뀌지 않게 한다
  out.sort((a, b) => b.popularity - a.popularity || a.name.localeCompare(b.name, "ko"));
  console.log(`같은 판매처 상품으로 합친 것 ${dropped}건 (별칭으로 남김)`);

  const file = path.join(here, "..", "data", "whiskies.json");
  fs.writeFileSync(file, JSON.stringify(out));
  const kb = Math.round(fs.statSync(file).size / 1024);
  console.log(`위스키 ${out.length}종 → data/whiskies.json (${kb}KB)`);
  console.log(
    `  사진 ${out.filter((w) => w.image).length} · 이야기 ${out.filter((w) => w.story).length} · ` +
      `데일리샷 ${out.filter((w) => w.dailyshot).length} · 후기 1개 이상 ${out.filter((w) => w.popularity > 0).length}`
  );
  console.log("  인기 상위:", out.slice(0, 8).map((w) => `${w.name}(${w.popularity})`).join(" · "));
} finally {
  await client.close();
}
