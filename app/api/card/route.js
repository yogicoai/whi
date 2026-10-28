// 레시피 카드 이미지 — 카톡 미리보기(size=og, 1200×630)와 인스타 스토리용(size=story, 1080×1920).
//
// 주소에 담긴 것(lib/share.js — k 레시피 · w 위스키 · r 비율 · s 양 · n 이름 · m 메모 · by 보낸 사람)만으로 그린다.
// 서버에 저장된 것이 없어서, 같은 주소면 언제나 같은 그림이다 — 그래서 오래 캐시해도 된다.
// 디자인 C 를 그대로 옮겼다: 미색 바탕 · 아주 큰 이름 · 가는 검은 선 · 주황 하나 · 오른쪽에 완성 사진.
// next/og 기본 글꼴엔 한글이 없어서 Pretendard 를 jsDelivr 에서 받아 쓴다(처음 한 번 받고 메모리에 둔다).

import { ImageResponse } from "next/og";
import fs from "node:fs/promises";
import path from "node:path";
import { RATIOS, SHOTS, mixPlan, amountsOf } from "@/lib/mixes";
import { recipeOf, isCocktail, cocktailPlan, cocktailAmounts, variantOf } from "@/lib/cocktails";
import { readShared } from "@/lib/share";
import { drinkCrop } from "@/lib/photos";
import { getWhisky } from "@/lib/whiskies";

const C = { bg: "#f2eee8", ink: "#15120e", ink2: "#4b463e", ink3: "#8b8479", accent: "#f4511e", panel: "#ece6de" };
const FONT_URL = "https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/public/static/Pretendard-";

let fontsPromise = null;
function fonts() {
  if (!fontsPromise) {
    fontsPromise = Promise.all(
      [["Bold", 700], ["Black", 900]].map(async ([file, weight]) => {
        const res = await fetch(`${FONT_URL}${file}.otf`);
        if (!res.ok) throw new Error(`글꼴을 받지 못했어요 (${res.status})`);
        return { name: "Pretendard", weight, style: "normal", data: await res.arrayBuffer() };
      })
    ).catch((e) => {
      fontsPromise = null; // 다음 요청에서 다시 받는다
      throw e;
    });
  }
  return fontsPromise;
}

/** 완성 사진을 그림 안에 넣을 수 있게 — 파일에서 읽고, 안 되면(배포 환경) 같은 서버에서 받는다 */
async function photoData(key, origin) {
  const rel = drinkCrop(key);
  if (!rel) return null;
  try {
    const buf = await fs.readFile(path.join(process.cwd(), "public", rel));
    return `data:image/jpeg;base64,${buf.toString("base64")}`;
  } catch {
    try {
      const res = await fetch(new URL(rel, origin));
      if (!res.ok) return null;
      return `data:image/jpeg;base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
    } catch {
      return null;
    }
  }
}

/** 카드에 적을 양 — [이름, 수, 단위] 와 완성 도수, 비율(또는 맛 조절) */
function measure(recipe, whisky, r, s) {
  if (isCocktail(recipe)) {
    const plan = whisky ? cocktailPlan(whisky) : null;
    const v = variantOf(recipe, r);
    const shot = SHOTS.some((o) => o.ml === s) ? s : recipe.shot;
    const a = cocktailAmounts(recipe, { shot, variant: v.key, abv: plan?.abv ?? 40 });
    const rows = [["위스키", a.whisky, "ml"], ...a.parts.filter((p) => !p.optional).map((p) => [p.name, p.amount, p.unit])];
    return { rows, abv: a.abv, tag: v.label };
  }
  const plan = whisky ? mixPlan({ ...whisky, category: "whisky" }) : null;
  const ratio = RATIOS.some((o) => o.ratio === Number(r)) ? Number(r) : plan?.ratio || 3;
  const shot = SHOTS.some((o) => o.ml === s) ? s : 45;
  const a = amountsOf(recipe, { shot, ratio, abv: plan?.abv ?? 40 });
  const rows = [["위스키", a.whisky, "ml"], ...(a.addin ? [[a.addin.name, a.addin.ml, "ml"]] : []), [a.mixer.name, a.mixer.ml, "ml"]];
  return { rows, abv: a.abv, tag: `1 : ${ratio}` };
}

export async function GET(request) {
  const url = new URL(request.url);
  const sp = url.searchParams;
  const recipe = recipeOf(sp.get("k") || "");
  if (!recipe) return new Response("레시피를 찾지 못했어요", { status: 404 });

  const story = sp.get("size") === "story";
  const shared = readShared(sp);
  const whisky = sp.get("w") ? getWhisky(sp.get("w")) : null;
  const { rows, abv, tag } = measure(recipe, whisky, sp.get("r"), Number(sp.get("s")));
  const title = shared?.name || recipe.name;
  const sub = [shared?.name && recipe.name, whisky?.name].filter(Boolean).join(" · ");
  const label = shared?.by ? `${shared.by}님의 레시피` : "나만의 레시피";

  let fontData;
  try {
    fontData = await fonts();
  } catch {
    return new Response("카드를 그릴 글꼴을 받지 못했어요", { status: 503 });
  }
  const photo = await photoData(recipe.key, url.origin);
  const cols = [...rows, ["완성 도수", abv, "%"]];

  const node = story ? (
    <div style={{ width: 1080, height: 1920, display: "flex", flexDirection: "column", position: "relative", background: C.bg, color: C.ink, fontFamily: "Pretendard", padding: "96px 84px 90px" }}>
      {photo && (
        <div style={{ position: "absolute", right: 0, top: 420, width: 470, height: 860, display: "flex", background: C.panel, borderLeft: `10px solid ${C.accent}` }}>
          <img src={photo} width={460} height={860} style={{ objectFit: "cover" }} />
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 40, fontWeight: 900, letterSpacing: -1 }}>
        <span>Whisky Lens</span>
        <span style={{ color: C.accent, fontSize: 36, fontWeight: 700 }}>{label}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", marginTop: 110, maxWidth: photo ? 560 : 900 }}>
        <div style={{ fontSize: title.length > 6 ? 116 : 150, fontWeight: 900, letterSpacing: -7, lineHeight: 1.02, wordBreak: "keep-all" }}>{title}</div>
        {sub && <div style={{ marginTop: 26, fontSize: 40, fontWeight: 700, color: C.ink2, lineHeight: 1.35 }}>{sub}</div>}
        <div style={{ display: "flex", marginTop: 40 }}>
          <span style={{ background: C.accent, color: "#fff", fontSize: 40, fontWeight: 900, padding: "12px 30px", borderRadius: 999 }}>{tag}</span>
        </div>
      </div>
      <div style={{ flex: 1, display: "flex" }} />
      {shared?.memo && (
        <div style={{ display: "flex", borderLeft: `10px solid ${C.accent}`, paddingLeft: 28, fontSize: 46, fontWeight: 700, lineHeight: 1.4, maxWidth: 900, marginBottom: 54 }}>
          {`“${shared.memo}”`}
        </div>
      )}
      <div style={{ display: "flex", borderTop: `5px solid ${C.ink}`, paddingTop: 26 }}>
        {cols.map(([name, n, unit], i) => (
          <div key={name} style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div style={{ display: "flex", alignItems: "baseline" }}>
              <span style={{ fontSize: cols.length > 4 ? 72 : 88, fontWeight: 900, letterSpacing: -3, color: i === cols.length - 1 ? C.accent : C.ink }}>{String(n)}</span>
              <span style={{ fontSize: 32, fontWeight: 700, color: C.ink3, marginLeft: 4 }}>{unit}</span>
            </div>
            <span style={{ fontSize: 30, fontWeight: 700, color: C.ink3 }}>{name}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", marginTop: 46, fontSize: 32, fontWeight: 700, color: C.ink2 }}>Whisky Lens에서 이 비율 그대로 따라 만들어 보세요</div>
    </div>
  ) : (
    <div style={{ width: 1200, height: 630, display: "flex", background: C.bg, color: C.ink, fontFamily: "Pretendard" }}>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "52px 40px 46px 64px" }}>
        <div style={{ display: "flex", alignItems: "center", fontSize: 28, fontWeight: 900 }}>
          <span>Whisky Lens</span>
          <span style={{ marginLeft: 18, color: C.accent, fontSize: 26, fontWeight: 700 }}>{label}</span>
        </div>
        <div style={{ marginTop: 30, fontSize: title.length > 7 ? 84 : 108, fontWeight: 900, letterSpacing: -5, lineHeight: 1.02, maxWidth: 700, wordBreak: "keep-all" }}>{title}</div>
        {sub && <div style={{ marginTop: 14, fontSize: 30, fontWeight: 700, color: C.ink2 }}>{sub}</div>}
        <div style={{ display: "flex", marginTop: 20 }}>
          <span style={{ background: C.accent, color: "#fff", fontSize: 26, fontWeight: 900, padding: "8px 20px", borderRadius: 999 }}>{tag}</span>
        </div>
        <div style={{ flex: 1, display: "flex" }} />
        <div style={{ display: "flex", borderTop: `4px solid ${C.ink}`, paddingTop: 16 }}>
          {cols.map(([name, n, unit], i) => (
            <div key={name} style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <div style={{ display: "flex", alignItems: "baseline" }}>
                <span style={{ fontSize: 52, fontWeight: 900, letterSpacing: -2, color: i === cols.length - 1 ? C.accent : C.ink }}>{String(n)}</span>
                <span style={{ fontSize: 22, fontWeight: 700, color: C.ink3, marginLeft: 3 }}>{unit}</span>
              </div>
              <span style={{ fontSize: 20, fontWeight: 700, color: C.ink3 }}>{name}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", width: 360, height: 630, background: photo ? C.panel : C.accent, borderLeft: `10px solid ${C.accent}`, alignItems: "center", justifyContent: "center" }}>
        {photo ? (
          <img src={photo} width={350} height={630} style={{ objectFit: "cover" }} />
        ) : (
          <span style={{ color: "#fff", fontSize: 88, fontWeight: 900, letterSpacing: -3 }}>{tag}</span>
        )}
      </div>
    </div>
  );

  return new ImageResponse(node, {
    width: story ? 1080 : 1200,
    height: story ? 1920 : 630,
    fonts: fontData,
    headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800" },
  });
}
