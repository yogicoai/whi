"use client";

// 글 아래 버튼 줄 — 좋아요(회원, 다시 누르면 취소) · 내 글이면 지우기. 내가 눌렀는지 · 내 글인지는 열쇠로 다시 읽어 안다.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "./Icon";
import { authHeader, getMember } from "@/lib/member";

export default function PostActions({ id, likes: initial }) {
  const router = useRouter();
  const [likes, setLikes] = useState(initial);
  const [liked, setLiked] = useState(false);
  const [mine, setMine] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!getMember()) return;
    fetch(`/api/board/${id}`, { headers: authHeader() })
      .then((r) => r.json())
      .then((r) => { if (r.post) { setLiked(r.post.liked); setMine(r.post.mine); setLikes(r.post.likes); } })
      .catch(() => {});
  }, [id]);

  async function like() {
    if (!getMember()) return setMsg("좋아요는 회원만 누를 수 있어요");
    const r = await fetch(`/api/board/${id}/like`, { method: "POST", headers: authHeader() }).then((x) => x.json()).catch(() => ({}));
    if (r.likes !== undefined) { setLiked(r.liked); setLikes(r.likes); } else setMsg(r.error || "잠시 뒤 다시 해 주세요");
  }

  async function remove() {
    if (!confirm("이 레시피를 지울까요? 사진도 함께 지워져요.")) return;
    const res = await fetch(`/api/board/${id}`, { method: "DELETE", headers: authHeader() });
    if (res.ok) router.replace("/board");
    else setMsg((await res.json().catch(() => ({}))).error || "지우지 못했어요");
  }

  return (
    <div className="post-actions">
      <button type="button" className={`btn-ghost post-like ${liked ? "is-on" : ""}`} onClick={like} aria-pressed={liked}>
        <span aria-hidden="true">{liked ? "♥" : "♡"}</span> 좋아요 {likes > 0 ? likes : ""}
      </button>
      {mine && <button type="button" className="btn-ghost" onClick={remove}><Icon name="close" size={16} /> 지우기</button>}
      {msg && <p className="note warn">{msg}</p>}
    </div>
  );
}
