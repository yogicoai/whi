// 실제 제품 레시피 카드 — 위스키 병 사진과 완성된 한 잔을 나란히, 아래에 제품 정보(별점 · 후기 · 가격대)와 양.
// 누르면 그 위스키가 골라진 채로 레시피가 열린다. 짝 고르는 규칙은 lib/picks.js.

import Link from "next/link";
import { LOOK } from "@/lib/look";
import { drinkPhoto } from "@/lib/photos";

export default function ProductPickCard({ pick }) {
  const { whisky, recipe } = pick;
  // 한 잔 — 실사 사진(잔 쪽으로 자른 것)
  const drink = drinkPhoto(recipe.key);
  return (
    <Link href={pick.href} className="pcard" style={{ "--card": LOOK[recipe.key]?.color }}>
      <div className="pcard-media">
        <span className="pcard-bottle">{whisky.image ? <img src={whisky.image} alt="" loading="lazy" decoding="async" /> : null}</span>
        {drink && <img className="pcard-drink" src={drink} alt="" loading="lazy" decoding="async" />}
        <span className="pcard-tag">{recipe.name}</span>
      </div>
      <div className="pcard-body">
        <strong className="pcard-title">{whisky.name}</strong>
        <span className="pcard-meta">
          {[whisky.rating && `★ ${whisky.rating}`, whisky.reviews > 0 && `후기 ${whisky.reviews.toLocaleString()}`, whisky.price].filter(Boolean).join(" · ")}
        </span>
        <span className="pcard-spec">{pick.spec}</span>
      </div>
    </Link>
  );
}
