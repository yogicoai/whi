// 위스키 한 줄 — 병 사진, 이름, 종류, 이 위스키에 가장 잘 맞는 섞는 법.

import Link from "next/link";
import { PRICE_BANDS } from "@/lib/look";

export default function WhiskyRow({ w, href, rank = null, note = null }) {
  return (
    <Link href={href || `/whisky/${w.id}`} className="wrow">
      {rank != null && <span className="wrow-rank">{rank}</span>}
      <span className="wrow-shot">
        {w.image ? <img src={w.image} alt="" loading="lazy" decoding="async" /> : <span className="wrow-blank" style={{ background: w.liquidColor || undefined }} />}
      </span>
      <span className="wrow-body">
        <strong>{w.name}</strong>
        <span className="wrow-meta">
          {[w.type?.replace(/\s*\(.*\)$/, ""), w.priceBand && PRICE_BANDS[w.priceBand]].filter(Boolean).join(" · ")}
        </span>
        {(note || w.top?.[0]) && <span className="wrow-mix">{note || `${w.top[0].name} 추천`}</span>}
      </span>
    </Link>
  );
}
