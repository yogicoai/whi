// 레시피 공유방 글 하나 — 사진 · 제목 · 쓴 사람 · 위스키 · 재료와 비율 · 맛 · 한마디 · 만드는 법 · 좋아요(회원).
import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/Icon";
import PostActions from "@/components/PostActions";
import { getPost, publicPost } from "@/lib/server/board";
import { AVATARS } from "@/lib/member";
import { ratioLine, partText, ago } from "@/lib/board";

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const p = await getPost((await params).id).catch(() => null);
  return { title: p && p.status === "public" ? `${p.title} — 레시피 공유방` : "레시피 공유방 — Whisky Lens" };
}

export default async function PostPage({ params }) {
  const raw = await getPost((await params).id).catch(() => null);
  if (!raw || raw.status !== "public") notFound();
  const p = publicPost(raw);
  const ratio = ratioLine(p.parts);
  const steps = (p.steps || "").split("\n").map((s) => s.trim()).filter(Boolean);
  return (
    <main className="page page-detail page-narrow post">
      <Link href="/board" className="back" aria-label="레시피 공유방으로"><Icon name="back" size={22} /></Link>
      {p.images.length > 0 && (
        <div className="post-photos">
          {p.images.map((im, i) => <img key={im.l} src={im.l} alt={`${p.title} 사진 ${i + 1}`} fetchPriority={i === 0 ? "high" : undefined} />)}
        </div>
      )}
      <h1 className="post-title">{p.title}</h1>
      <p className="post-who">
        <i style={{ "--av": AVATARS[p.author.avatar] || "#c8862a" }}>{p.author.nickname.slice(0, 1)}</i>
        <b>{p.author.nickname}</b> · {ago(p.createdAt)}
      </p>
      {p.note && <p className="post-note">{p.note}</p>}

      {p.whisky.id ? (
        <Link href={`/whisky/${p.whisky.id}`} className="post-whisky">
          {p.whisky.image && <img src={p.whisky.image} alt="" />}
          <span><small>이 위스키로 만들었어요</small><b>{p.whisky.name}</b></span>
          <Icon name="chevron" size={18} />
        </Link>
      ) : (
        <p className="post-whisky"><span><small>이 위스키로 만들었어요</small><b>{p.whisky.name}</b></span></p>
      )}

      <section className="panel">
        <h2 className="h2">재료와 양</h2>
        {ratio && <p className="post-ratio">{ratio}</p>}
        <ul className="post-parts">{p.parts.map((x, i) => <li key={i}>{partText(x)}</li>)}</ul>
        {p.moods.length > 0 && <div className="chips">{p.moods.map((m) => <span key={m} className="chip chip-plain">{m}</span>)}</div>}
      </section>

      {steps.length > 0 && (
        <section className="panel">
          <h2 className="h2">만드는 법</h2>
          <ol className="post-steps">{steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
        </section>
      )}

      <PostActions id={p.id} likes={p.likes} />
    </main>
  );
}
