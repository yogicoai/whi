// 내 바 — 가진 재료와 위스키로 지금 만들 수 있는 레시피를 고른다.
//
// "추천 엔진"이 아니라 거르고 줄 세운 목록이다. 재료가 다 있는 레시피만 남기고,
// 가진 위스키 가운데 그 레시피가 가장 잘 맞는 것을 짝지어 준다.
// 하이볼류는 믹서(와 맛 더하기)가, 칵테일은 그 칵테일의 재료(설탕·비터스… 레몬즙은 맛 더하기 것)가 있어야 한다.

import { RECIPES, MIXERS, ADDINS, mixPlan } from "./mixes.js";
import { COCKTAILS, EXTRAS, cocktailFit, needsOf } from "./cocktails.js";
import { POPULAR_ORDER } from "./look.js";

export const BAR_MIXERS = Object.keys(MIXERS);
export const BAR_ADDINS = Object.keys(ADDINS);
export const BAR_EXTRAS = Object.keys(EXTRAS);

/** @returns {{recipe: object, whisky: object|null, score: number}[]} 많이 만드는 순서, 칵테일은 그 뒤 */
export function makeable(bar) {
  const mixers = new Set(bar.mixers);
  const addins = new Set(bar.addins);
  const have = new Set([...bar.mixers, ...bar.addins, ...(bar.extras || [])]);
  const plans = bar.whiskies.map((w) => ({ w, plan: mixPlan({ ...w, category: "whisky" }) }));

  // 가진 위스키 가운데 이 레시피와 가장 잘 맞는 것
  const pair = (recipe, scoreOf) => {
    let best = null;
    for (const { w, plan } of plans) {
      const score = scoreOf(plan);
      if (score > 0 && (!best || score > best.score)) best = { whisky: w, score };
    }
    return { recipe, whisky: best?.whisky || null, score: best?.score || 0 };
  };

  const mixes = POPULAR_ORDER.map((key) => RECIPES[key])
    .filter((r) => mixers.has(r.mixer) && (!r.addin || addins.has(r.addin)))
    .map((r) => pair(r, (plan) => plan.recipes.find((x) => x.key === r.key)?.score ?? 0));
  const cocktails = Object.values(COCKTAILS)
    .filter((c) => needsOf(c).every((n) => have.has(n)))
    .map((c) => pair(c, (plan) => cocktailFit(c.key, plan.style)));

  // 가진 위스키와 잘 맞는 것을 앞으로 — 위스키가 하나도 없으면 위 순서 그대로
  return [...mixes, ...cocktails].sort((a, b) => b.score - a.score);
}
