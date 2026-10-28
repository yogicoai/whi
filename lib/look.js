// 화면에 쓰는 정보 — 레시피 색·분위기, 가격대 이름.
//
// lib/mixes.js 는 wine 저장소와 똑같이 맞춰 두는 규칙 파일이라, 화면에만 쓰는 것은 여기 둔다.
// 레시피마다 제 색을 갖는다(레시피 카드를 한 장씩 꽂아 둔 상자처럼). 색은 그 술의 믹서에서 왔다 —
// 탄산수는 맑은 하늘색, 콜라는 캐러멜 갈색, 유자는 노란 주황.

export const LOOK = {
  highball: { color: "#9cc3d5", moods: ["깔끔"] },
  lemon: { color: "#ecd97a", moods: ["상큼"] },
  ginger: { color: "#e8a95b", moods: ["알싸", "달콤"] },
  cola: { color: "#a4513e", moods: ["달콤"] },
  earlgrey: { color: "#b3a7d1", moods: ["향긋"] },
  tonic: { color: "#97d0bf", moods: ["쌉쌀", "깔끔"] },
  yuja: { color: "#f2b84f", moods: ["상큼", "달콤"] },
  maesil: { color: "#a9c27a", moods: ["상큼", "달콤"] },
  cider: { color: "#c7e39a", moods: ["달콤"] },
  greentea: { color: "#86ad73", moods: ["깔끔"] },
  // 칵테일(lib/cocktails.js) — 오렌지 껍질 · 거품 낸 레몬 · 아몬드 · 꿀물 색
  oldfashioned: { color: "#c4733f", moods: ["쌉쌀", "달콤"] },
  sour: { color: "#efe3b8", moods: ["상큼", "달콤"] },
  godfather: { color: "#9c7b62", moods: ["달콤", "향긋"] },
  hottoddy: { color: "#e0866a", moods: ["따뜻", "향긋"] },
};

export const MOODS = ["깔끔", "상큼", "달콤", "향긋", "알싸", "쌉쌀"];

// 많이 만드는 순서 — 카페·블로그 글에서 그 레시피를 가르는 재료가 나온 횟수(2026-10-27)
export const POPULAR_ORDER = ["highball", "lemon", "cola", "tonic", "ginger", "earlgrey", "yuja", "maesil", "cider", "greentea"];

export const PRICE_BANDS = {
  1: "2만원 이하",
  2: "2~5만원",
  3: "5~10만원",
  4: "10~30만원",
  5: "30만원 이상",
};

/** 배경색 위에 올릴 글자색 — 밝은 카드엔 검은 글자, 어두운 카드엔 흰 글자 */
export function inkOn(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return "#15130f";
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.32 ? "#15130f" : "#fbf8f2";
}

/** 레시피에 들어가는 것을 한 줄로 — "위스키 · 탄산수 · 레몬즙" */
export function partsLine(recipe, MIXERS, ADDINS) {
  // 칵테일은 재료를 직접 들고 있다 — (선택) 재료는 뺀다
  if (recipe.parts) return ["위스키", ...recipe.parts.filter((p) => !p.optional).map((p) => p.name)].join(" · ");
  return ["위스키", MIXERS[recipe.mixer].name.replace("차가운 ", ""), recipe.addin && ADDINS[recipe.addin].name]
    .filter(Boolean)
    .join(" · ");
}

/** "하이볼" → "하이볼로", "위스키 토닉" → "위스키 토닉으로" — 받침이 없거나 ㄹ 받침이면 "로", 그 밖의 받침이면 "으로" */
export function withRo(word) {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  if (code < 0 || code > 11171) return `${word}로`;
  const jong = code % 28;
  return `${word}${jong === 0 || jong === 8 ? "로" : "으로"}`;
}
