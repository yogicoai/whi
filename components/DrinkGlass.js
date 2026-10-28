// 완성된 한 잔 — 레시피 카드와 내 레시피 목록에 쓰는 그림. 하이볼류는 Glass, 칵테일은 CocktailGlass.
// shot·ratio 를 주면 그 양으로(내 레시피), 안 주면 레시피 기본값으로 그린다.

import Glass, { DEFAULT_WHISKY } from "./Glass";
import CocktailGlass from "./CocktailGlass";
import { stepsOf, amountsOf } from "@/lib/mixes";
import { isCocktail, cocktailAmounts } from "@/lib/cocktails";

export default function DrinkGlass({ recipe, whiskyColor = DEFAULT_WHISKY, shot = null, ratio = null, id }) {
  if (isCocktail(recipe)) {
    const amounts = cocktailAmounts(recipe, { shot: shot || recipe.shot, variant: ratio });
    return <CocktailGlass cocktail={recipe} stage={recipe.steps.length} amounts={amounts} whiskyColor={whiskyColor} id={id} />;
  }
  const steps = stepsOf(recipe);
  const amounts = amountsOf(recipe, { shot: shot || 45, ratio: ratio || 3, abv: 40 });
  return <Glass recipe={recipe} steps={steps} stage={steps.length} amounts={amounts} whiskyColor={whiskyColor} id={id} />;
}
