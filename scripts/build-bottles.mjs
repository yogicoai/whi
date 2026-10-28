// 병 사진 배경 지우기 — data/whiskies.json 의 병 사진(흰 배경 상품 사진)에서 흰 배경을 지워 public/bottles/<id>.webp 로 둔다.
//
//   npm run bottles            (이미 만든 것은 건너뛴다 · --all 이면 다시)
//
// 2026-10-28 디자인 A "컬러 보틀"(docs/design/mockups-2026-10-28) — 병을 술 색 카드 위에 그림자와 함께 크게 올리려고 만들었다.
// 방법: 가장자리에서 이어진 거의 흰 픽셀만 투명으로(병 안 흰 라벨은 병 테두리로 막혀 남는다). sharp 만 쓰고 크레딧 · 외부 서비스는 없다.
// 가장자리가 흰색이 아닌 사진(배경이 있는 사진)은 지우지 않고 목록에서 뺀다 — 화면은 원래 사진을 그대로 쓴다.
// 결과 목록 data/bottles.json = { id: [가로, 세로] } — lib/whiskies.js 가 읽어 brief().cut 을 붙인다.

import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.join(ROOT, "public", "bottles");
const LIST = path.join(ROOT, "data", "bottles.json");
const ALL = process.argv.includes("--all");
const MAX_H = 560; // 원본이 560px 안팎 — 폰에서 병 높이 280px 까지 선명

fs.mkdirSync(OUT, { recursive: true });
const whiskies = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "whiskies.json"), "utf8")).filter((w) => w.image && (w.type || w.alcohol));
const done = ALL || !fs.existsSync(LIST) ? {} : JSON.parse(fs.readFileSync(LIST, "utf8"));

async function cut(buf) {
  const { data, info } = await sharp(buf).resize({ height: MAX_H, withoutEnlargement: true }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const white = (p) => {
    const i = p * 4, r = data[i], g = data[i + 1], b = data[i + 2];
    const mn = Math.min(r, g, b);
    return mn > 234 && Math.max(r, g, b) - mn < 22;
  };
  // 가장자리의 90% 이상이 흰색이어야 흰 배경 사진으로 본다
  let edge = 0, edgeWhite = 0;
  for (let x = 0; x < W; x++) for (const y of [0, H - 1]) { edge++; if (white(y * W + x)) edgeWhite++; }
  for (let y = 0; y < H; y++) for (const x of [0, W - 1]) { edge++; if (white(y * W + x)) edgeWhite++; }
  if (edgeWhite / edge < 0.9) return null;

  const bg = new Uint8Array(W * H);
  const q = [];
  const push = (x, y) => { const p = y * W + x; if (bg[p] || !white(p)) return; bg[p] = 1; q.push(p); };
  for (let x = 0; x < W; x++) { push(x, 0); push(x, H - 1); }
  for (let y = 0; y < H; y++) { push(0, y); push(W - 1, y); }
  while (q.length) {
    const p = q.pop(), x = p % W, y = (p / W) | 0;
    if (x > 0) push(x - 1, y);
    if (x < W - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < H - 1) push(x, y + 1);
  }
  for (let p = 0; p < W * H; p++) {
    const i = p * 4;
    if (bg[p]) { data[i + 3] = 0; continue; }
    // 배경과 맞닿은 한 줄은 흰 정도만큼 반투명 — 가장자리 계단을 줄인다
    const x = p % W, y = (p / W) | 0;
    if ((x > 0 && bg[p - 1]) || (x < W - 1 && bg[p + 1]) || (y > 0 && bg[p - W]) || (y < H - 1 && bg[p + W])) {
      const mn = Math.min(data[i], data[i + 1], data[i + 2]);
      data[i + 3] = Math.max(0, Math.min(255, Math.round(((255 - mn) / 60) * 255)));
    }
  }
  const { data: out, info: o } = await sharp(data, { raw: { width: W, height: H, channels: 4 } })
    .trim({ threshold: 0 })
    .webp({ quality: 82, alphaQuality: 85, effort: 5 })
    .toBuffer({ resolveWithObject: true });
  return { out, size: [o.width, o.height] };
}

let made = 0, skipped = 0, failed = 0, i = 0;
async function worker() {
  while (i < whiskies.length) {
    const w = whiskies[i++];
    if (done[w.id] && fs.existsSync(path.join(OUT, w.id + ".webp"))) continue;
    try {
      const res = await fetch(w.image);
      if (!res.ok) throw new Error(res.status);
      const r = await cut(Buffer.from(await res.arrayBuffer()));
      if (!r) { skipped++; delete done[w.id]; continue; }
      fs.writeFileSync(path.join(OUT, w.id + ".webp"), r.out);
      done[w.id] = r.size;
      made++;
    } catch (e) {
      failed++;
      console.log("실패", w.id, w.name, e.message);
    }
  }
}
await Promise.all(Array.from({ length: 10 }, worker));
fs.writeFileSync(LIST, JSON.stringify(done));
console.log(`만듦 ${made} · 배경 있어 건너뜀 ${skipped} · 실패 ${failed} · 목록 ${Object.keys(done).length}`);
