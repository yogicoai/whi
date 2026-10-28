// 레시피 카드 — 리퀴드 글래스(2026-10-27 저녁~, 시안 docs/design/mockups-2026-10-27c/1-liquid-glass.png):
// 유리 판 안에 실사 사진(잔 쪽으로 자른 것), 아래에 "하이볼 1 : 3"과 재료 한 줄. 사진이 없는 레시피만 잔 그림.
// href 를 받는 이유: 위스키 화면에서 누르면 그 위스키가 골라진 채로 열려야 한다.
// 하이볼류는 "1 : 3", 칵테일은 만드는 법("저어서" · "흔들어서" · "따뜻하게")을 이름 옆에 단다.
// priority — 첫 화면에 바로 보이는 카드(줄의 앞 한두 장)는 늦게 받지 않고 먼저 받는다. 나머지는 내려 볼 때 받는다.
// title · parts · ratioLabel — 황금레시피(GoldenCard)처럼 레시피 이름 대신 별명("잭콕")과 제품 조합을 보일 때.

import Link from "next/link";
import DrinkGlass from "./DrinkGlass";
import { MIXERS, ADDINS } from "@/lib/mixes";
import { partsLine } from "@/lib/look";
import { drinkPhoto } from "@/lib/photos";

export default function RecipeCard({
  recipe, href, whiskyColor, size = "m", badge = null, priority = false, title = null, parts = null, ratioLabel = null,
}) {
  const photo = drinkPhoto(recipe.key);
  return (
    <Link href={href || `/recipes/${recipe.key}`} className={`rcard rcard-${size}`}>
      <span className="rcard-photo">
        {photo ? (
          <img
            src={photo}
            alt=""
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : undefined}
            decoding="async"
          />
        ) : (
          <DrinkGlass recipe={recipe} whiskyColor={whiskyColor} id={`c-${recipe.key}-${size}`} />
        )}
        {badge && <span className="rcard-badge">{badge}</span>}
      </span>
      <span className="rcard-label">
        <strong className="rcard-title">{title || recipe.name}</strong>
        <span className="rcard-ratio">{ratioLabel || recipe.tag || "1 : 3"}</span>
      </span>
      <span className="rcard-parts">{parts || partsLine(recipe, MIXERS, ADDINS)}</span>
    </Link>
  );
}
