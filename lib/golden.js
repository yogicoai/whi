// 황금레시피 — 잭콕 · 가쿠 하이볼처럼 사람들이 이름을 붙여 부르는 조합과 그 비율.
//
// 네이버 블로그·카페 글을 모아 센 것이다(2026-10-27, 네이버 검색 API — 무료). 거른 기준과 셈법은 data/golden.json 머리에 있다.
// 글 수는 추정치라 "약"을 붙여 말한다. 비율은 앱 선택지(1:2 · 1:3 · 1:4)에 맞춰 레시피를 연다 — 범위(1:2~3)는 앞 숫자로.
// 서버에서만 읽는다(카드는 서버 컴포넌트) — 손님 폰으로 내려가는 자바스크립트에 넣지 않는다.

import DATA from "@/data/golden.json";
import { RATIOS, MIXERS, ADDINS } from "./mixes.js";
import { recipeOf, isCocktail } from "./cocktails.js";

export const GOLDEN_META = { collectedAt: DATA.collectedAt, source: DATA.source };

/** 18,000 → "1.8만", 650,000 → "65만", 750 → "750" */
function countLabel(n) {
  if (n >= 100000) return `${Math.round(n / 10000)}만`;
  if (n >= 10000) return `${(n / 10000).toFixed(1).replace(/\.0$/, "")}만`;
  if (n >= 1000) return (Math.round(n / 100) * 100).toLocaleString();
  return String(n);
}

const spaced = (r) => r.replace(/:/g, " : ");

// 칵테일은 글에 적힌 비율에 가장 가까운 앱의 맛 조절로 연다. 비율이 앱 레시피와 맞을 때만 카드에 그 비율을 적는다 —
// 위스키 사워 4:2:1 ≈ "새콤하게"(45:20:10), 갓파더 3:1 = "기본"(45:15). 핫 토디는 글 1:2(3건뿐) · 앱 1:3~1:7 이라
// 비율 대신 만드는 법("따뜻하게")을 적고 가장 진한 쪽으로 연다(2026-10-27 점검)
const COCKTAIL_OPEN = {
  sour: { variant: "tart", showRatio: true },
  godfather: { variant: "base", showRatio: true },
  hottoddy: { variant: "strong", showRatio: false },
};

function shape(g, rank) {
  const recipe = recipeOf(g.recipeKey);
  // 재료는 앱 레시피에서 — 글에서 셈한 "위스키:탄산수"에는 얼그레이 시럽 · 유자청 같은 맛 더하기가 빠져 있다
  const whisky = g.whiskyName || "위스키";
  const parts = isCocktail(recipe)
    ? [whisky, ...recipe.parts.filter((p) => !p.optional).map((p) => p.name)]
    : [whisky, MIXERS[recipe.mixer].name.replace("차가운 ", ""), recipe.addin && ADDINS[recipe.addin].name].filter(Boolean);
  const qs = new URLSearchParams();
  if (g.whiskyId) qs.set("w", g.whiskyId);
  let ratioLabel = g.ratio ? spaced(g.ratio) : null;
  if (isCocktail(recipe)) {
    const open = COCKTAIL_OPEN[g.recipeKey];
    if (open) qs.set("r", open.variant);
    if (!open?.showRatio) ratioLabel = null; // 카드는 만드는 법(recipe.tag)을 대신 적는다
  } else {
    // 하이볼류는 앱 선택지(1:2 · 1:3 · 1:4)로 연다 — 범위(1:2~3)는 앞 숫자로
    const first = Number(g.ratio?.match(/^1:(\d+)/)?.[1]);
    if (RATIOS.some((o) => o.ratio === first)) qs.set("r", String(first));
  }
  return {
    ...g,
    rank,
    href: `/recipes/${g.recipeKey}${qs.size ? `?${qs}` : ""}`,
    partsText: parts.join(" + "),
    ratioLabel,
    countLabel: `글 약 ${countLabel(g.mentions)}`,
    votesText: g.ratioVotes.map(([r, n]) => `${spaced(r)} ${n}건`).join(" · "),
  };
}

const ALL = DATA.items.map((g, i) => shape(g, i + 1));

/** 글 많은 순 전체 */
export const goldenList = () => ALL;

/** 이 레시피 · 이 위스키로 유명한 조합 */
export function goldenFor({ recipeKey, whiskyId } = {}) {
  return ALL.filter((g) => (!recipeKey || g.recipeKey === recipeKey) && (!whiskyId || g.whiskyId === whiskyId));
}
