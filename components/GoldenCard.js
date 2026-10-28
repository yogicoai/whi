// 황금레시피 카드 — 레시피 카드 모양 그대로, 이름 자리에 별명("잭콕"), 재료 자리에 제품 조합, 위 띠에 글 수.
// 누르면 그 위스키 · 그 비율로 레시피가 열린다(lib/golden.js 가 주소를 만든다).

import RecipeCard from "./RecipeCard";
import { recipeOf } from "@/lib/cocktails";

export default function GoldenCard({ g, priority = false }) {
  return (
    <RecipeCard
      recipe={recipeOf(g.recipeKey)}
      href={g.href}
      title={g.name}
      parts={g.partsText}
      ratioLabel={g.ratioLabel}
      badge={g.countLabel}
      priority={priority}
    />
  );
}
