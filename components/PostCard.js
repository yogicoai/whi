// 레시피 공유방 카드 — 사진(없으면 위스키 병) · 제목 · 위스키 · 비율 · 쓴 사람 · 좋아요
import Link from "next/link";
import { AVATARS } from "@/lib/member";
import { ratioLine, ago } from "@/lib/board";

export default function PostCard({ p }) {
  return (
    <Link href={`/board/${p.id}`} className="pcard-b">
      <span className="pcard-b-shot">
        {p.images?.[0] ? <img src={p.images[0].s} alt="" loading="lazy" decoding="async" /> : p.whisky?.image ? <img className="is-bottle" src={p.whisky.image} alt="" loading="lazy" /> : null}
        {p.likes > 0 && <span className="pcard-b-like">♥ {p.likes}</span>}
      </span>
      <strong className="pcard-b-title">{p.title}</strong>
      <span className="pcard-b-whisky">{p.whisky?.name}</span>
      {ratioLine(p.parts) && <span className="pcard-b-ratio">{ratioLine(p.parts)}</span>}
      <span className="pcard-b-who">
        <i style={{ "--av": AVATARS[p.author?.avatar] || "#c8862a" }}>{(p.author?.nickname || "?").slice(0, 1)}</i>
        {p.author?.nickname} · {ago(p.createdAt)}
      </span>
    </Link>
  );
}
