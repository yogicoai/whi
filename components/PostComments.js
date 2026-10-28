"use client";

// 댓글 — 목록 · 달기(회원) · 내 댓글 지우기. 글 화면 아래.
import { useEffect, useState } from "react";
import Link from "next/link";
import { AVATARS, authHeader, getMember } from "@/lib/member";
import { ago } from "@/lib/board";

export default function PostComments({ id, initial = [] }) {
  const [items, setItems] = useState(initial);
  const [text, setText] = useState("");
  const [member, setMember] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const m = getMember();
    setMember(m);
    if (m) fetch(`/api/board/${id}/comments`, { headers: authHeader() }).then((r) => r.json()).then((r) => r.items && setItems(r.items)).catch(() => {});
  }, [id]);

  async function send() {
    setBusy(true);
    setMsg("");
    const res = await fetch(`/api/board/${id}/comments`, { method: "POST", headers: { "content-type": "application/json", ...authHeader() }, body: JSON.stringify({ text }) });
    const r = await res.json().catch(() => ({}));
    if (res.ok) {
      setItems((l) => [...l, r.comment]);
      setText("");
    } else setMsg(r.error || "잠시 뒤 다시 해 주세요");
    setBusy(false);
  }

  async function remove(cid) {
    if (!confirm("이 댓글을 지울까요?")) return;
    const res = await fetch(`/api/board/${id}/comments?cid=${cid}`, { method: "DELETE", headers: authHeader() });
    if (res.ok) setItems((l) => l.filter((c) => c.id !== cid));
  }

  return (
    <section className="panel post-comments">
      <h2 className="h2">댓글 {items.length > 0 && <small>{items.length}</small>}</h2>
      {items.length === 0 && <p className="note dim">첫 댓글을 남겨 보세요.</p>}
      <ul>
        {items.map((c) => (
          <li key={c.id}>
            <i style={{ "--av": AVATARS[c.author?.avatar] || "#c8862a" }}>{(c.author?.nickname || "?").slice(0, 1)}</i>
            <div>
              <p className="cm-who">
                <b>{c.author?.nickname}</b> · {ago(c.createdAt)}
                {c.mine && <button type="button" onClick={() => remove(c.id)}>지우기</button>}
              </p>
              <p className="cm-text">{c.text}</p>
            </div>
          </li>
        ))}
      </ul>
      {member ? (
        <div className="cm-write">
          <input value={text} onChange={(e) => setText(e.target.value)} maxLength={300} placeholder="댓글 달기" enterKeyHint="send" onKeyDown={(e) => e.key === "Enter" && text.trim() && !busy && send()} />
          <button type="button" className="btn-primary" disabled={!text.trim() || busy} onClick={send}>등록</button>
        </div>
      ) : (
        <p className="note"><Link href="/login">시작하기</Link>를 하면 댓글을 달 수 있어요.</p>
      )}
      {msg && <p className="note warn">{msg}</p>}
    </section>
  );
}
