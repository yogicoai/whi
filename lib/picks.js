// 실제 제품으로 만드는 레시피 — 실제 위스키 한 병마다 잘 맞는 레시피를 짝지어 추천한다.
//
// 제품 정보는 data/whiskies.json(보틀 렌즈 DB 에서 읽어 온 것)을 그대로 끌어 쓴다 — 이름·병 사진·종류·도수·
// 가격대·데일리샷 별점과 후기 수·처음 마시기 좋은 정도(beginner)·마시는 법 메모(servingNote).
// 짝은 규칙으로 고른다(하이볼류 lib/mixes.js, 칵테일 lib/cocktails.js) — 분석 비용 없음.
// 고르는 법: 묶음마다 조건에 맞는 위스키를 인기순(후기 수)으로 돌며, 그 위스키에 잘 맞는(2점 이상) 레시피 가운데
// 그 묶음에서 아직 덜 쓴 것을 고른다 — 한 레시피만 줄줄이 나오지 않게. 한 제품은 모든 묶음을 통틀어 한 번만 나온다.
// 가격은 "N만원대"(가격대)로만 말한다 — 매장·시기마다 달라 숫자 하나로 말하면 틀린 말이 된다.

import { allWhiskies, getWhisky, precious, flavored } from "./whiskies.js";
import { amountsOf } from "./mixes.js";
import { cocktailPlan, cocktailAmounts, recipeOf, isCocktail } from "./cocktails.js";
import { PRICE_BANDS } from "./look.js";

const MIN_REVIEWS = 30; // 후기가 이보다 적으면 "실제로 많이 마시는 제품"이라 하기 어렵다
// 귀한 위스키(10만원 이상 · 18년 이상)와 맛을 더한 위스키를 가르는 기준은 lib/whiskies.js 에 있다(홈 · 레시피별 목록과 같이 쓴다)

/** 위스키 한 병 + 레시피 하나 → 카드에 쓸 모양 */
function combo(w, recipe, cocktail) {
  const abv = parseFloat(w.alcohol) || 40;
  let spec;
  if (cocktail) {
    const a = cocktailAmounts(recipe, { shot: recipe.shot, variant: "base", abv });
    const parts = a.parts.filter((p) => !p.optional).map((p) => `${p.short} ${p.amount}${p.unit === "대시" ? "대시" : ""}`);
    spec = `${[`위스키 ${a.whisky}`, ...parts].join(" · ")} · ${a.abv}%`;
  } else {
    const a = amountsOf(recipe, { shot: 45, ratio: w.plan.ratio, abv });
    spec = `위스키 45 : ${a.mixer.name.replace("차가운 ", "")} ${a.mixer.ml}${a.addin ? ` + ${a.addin.name}` : ""} · ${a.abv}%`;
  }
  return {
    id: `${w.id}-${recipe.key}`,
    href: `/recipes/${recipe.key}?w=${w.id}`,
    recipe: { key: recipe.key, name: recipe.name },
    whisky: {
      id: w.id,
      name: w.name,
      image: w.image,
      liquidColor: w.liquidColor || null,
      type: w.type?.replace(/\s*\(.*\)$/, ""),
      rating: w.dailyshot?.rating ?? null,
      reviews: w.dailyshot?.reviews ?? 0,
      price: w.priceBand ? PRICE_BANDS[w.priceBand] : null,
    },
    spec,
    note: w.servingNote || null,
  };
}

// 이 위스키에 잘 맞는(2점 이상) 레시피 후보 — 잘 맞는 순서
const mixes = (w) => w.plan.recipes.filter((r) => r.score >= 2).map((recipe) => ({ recipe, cocktail: false, score: recipe.score }));
const cocktails = (w) =>
  flavored(w) ? [] : cocktailPlan(w).list.filter((c) => c.score >= 2).map((recipe) => ({ recipe, cocktail: true, score: recipe.score }));
const both = (w) => [...mixes(w), ...cocktails(w)].sort((a, b) => b.score - a.score);

function collect(seen, { filter = () => true, candidates, limit, perRecipe }) {
  const used = new Map();
  const out = [];
  for (const w of allWhiskies()) {
    if (out.length >= limit) break;
    if (seen.has(w.id) || (w.dailyshot?.reviews ?? 0) < MIN_REVIEWS || !w.plan.recipes.length || precious(w) || !filter(w)) continue;
    const pick = candidates(w).find(({ recipe }) => (used.get(recipe.key) || 0) < perRecipe);
    if (!pick) continue;
    used.set(pick.recipe.key, (used.get(pick.recipe.key) || 0) + 1);
    seen.add(w.id);
    out.push(combo(w, pick.recipe, pick.cocktail));
  }
  return out;
}

/** 어드민이 맨 앞에 고정한 짝("위스키id-레시피") → 카드. 없는 위스키·레시피나 뺀 제품이면 건너뛴다 */
function pinnedCombos(pinned, seen) {
  const out = [];
  for (const id of pinned) {
    const cut = id.lastIndexOf("-");
    const w = getWhisky(id.slice(0, cut));
    const recipe = recipeOf(id.slice(cut + 1));
    if (!w || !recipe || seen.has(w.id)) continue;
    seen.add(w.id);
    out.push({ ...combo(w, recipe, isCocktail(recipe)), pinned: true });
  }
  return out;
}

/**
 * 묶음들 — 홈은 첫 묶음만, /picks 는 전부 보여 준다.
 * 어드민 설정(lib/server/settings.js getPickSettings): pinned 는 첫 묶음 맨 앞에, excluded 위스키는 어디에도 안 나온다.
 * @returns {{id: string, title: string, note: string, list: object[]}[]}
 */
export function productPicks({ pinned = [], excluded = [] } = {}) {
  const seen = new Set(excluded);
  const top = pinnedCombos(pinned, seen);
  return [
    {
      id: "popular",
      title: "후기 많은 위스키로 만드는 한 잔",
      note: "데일리샷 후기가 많은 제품마다 잘 맞는 레시피를 짝지었어요.",
      list: [...top, ...collect(seen, { candidates: both, limit: Math.max(0, 10 - top.length), perRecipe: 2 })],
    },
    {
      id: "budget",
      title: "5만원 이하 위스키로",
      note: "섞어 마시기 부담 없는 가격대예요.",
      list: collect(seen, { filter: (w) => w.priceBand && w.priceBand <= 2, candidates: mixes, limit: 8, perRecipe: 2 }),
    },
    {
      id: "beginner",
      title: "처음이라면 부드러운 위스키로",
      note: "처음 마시는 사람에게 편한 제품을 골랐어요.",
      list: collect(seen, { filter: (w) => (w.beginner ?? 0) >= 70, candidates: mixes, limit: 8, perRecipe: 2 }),
    },
    {
      id: "cocktail",
      title: "칵테일로 빛나는 제품",
      note: "올드패션드 · 위스키 사워 · 갓파더 · 핫 토디로 만들면 좋은 제품이에요.",
      list: collect(seen, { candidates: cocktails, limit: 8, perRecipe: 2 }),
    },
  ];
}
