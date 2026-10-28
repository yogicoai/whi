// 위스키 카드 — 유리 판 안에 병 사진(그 술 색이 은은히 번지는 바탕 위에), 아래에 이름 · 갈래 · 가격대 · 별점.
// 위스키가 주인공인 화면(홈 · 위스키 탭)에 쓴다 — 2026-10-27 저녁 사용자 결정(주는 위스키 정보, 섞어 마시는 법은 부).
// w 는 lib/whiskies.js brief() 모양이다.

import Link from "next/link";
import { KINDS } from "@/lib/whiskies";
import { PRICE_BANDS } from "@/lib/look";

export default function WhiskyCard({ w, priority = false, badge = null }) {
  const kind = KINDS.find((k) => k.key === w.kind);
  return (
    <Link href={`/whisky/${w.id}`} className="wcard">
      <span className="wcard-shot" style={{ "--liquid": w.liquidColor || "#c8862a" }}>
        {w.image && (
          <img
            src={w.image}
            alt=""
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : undefined}
            decoding="async"
          />
        )}
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
