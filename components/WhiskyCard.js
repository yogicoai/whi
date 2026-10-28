// 위스키 카드 — 그 술 색이 옅게 깔린 판 위에 병, 아래에 이름 · 갈래 · 가격대 · 별점.
// 위스키가 주인공인 화면(홈 · 위스키 탭)에 쓴다 — 2026-10-27 저녁 사용자 결정(주는 위스키 정보, 섞어 마시는 법은 부).
// 배경을 지운 병(w.cut, npm run bottles)이 있으면 그림자와 함께 세우고(디자인 A, 2026-10-28), 없으면 원래 사진의 흰 바탕을 곱하기로 지운다.
// w 는 lib/whiskies.js brief() 모양이다. rank 를 주면 왼쪽 위에 순위.

import Link from "next/link";
import { KINDS } from "@/lib/whiskies";
import { PRICE_BANDS } from "@/lib/look";

export default function WhiskyCard({ w, priority = false, badge = null, rank = null }) {
  const kind = KINDS.find((k) => k.key === w.kind);
  return (
    <Link href={`/whisky/${w.id}`} className="wcard">
      <span className={`wcard-shot ${w.cut ? "is-cut" : ""}`} style={{ "--liquid": w.liquidColor || "#c8862a" }}>
        {(w.cut || w.image) && (
          <img
            src={w.cut || w.image}
            alt=""
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : undefined}
            decoding="async"
          />
        )}
        {rank && <span className="wcard-rank">{rank}</span>}
        {badge && <span className="rcard-badge">{badge}</span>}
      </span>
      <strong className="wcard-name">{w.name}</strong>
      <span className="wcard-meta">{[kind?.name, w.priceBand && PRICE_BANDS[w.priceBand]].filter(Boolean).join(" · ")}</span>
      {w.rating ? (
        <span className="wcard-rate">
          ★ {w.rating}
          <small> · 후기 {w.reviews.toLocaleString()}</small>
        </span>
      ) : null}
    </Link>
  );
}
