"use client";

// 레시피 올리기 — 사진(0~3장, 브라우저에서 줄여 보낸다) · 제목 · 위스키(검색해서 고르거나 직접 쓰기) · 재료와 양(첫 줄 위스키) · 맛 · 한마디 · 만드는 법.
// 회원만 올린다(기기 열쇠). 비율은 위스키와 같은 단위인 재료로 바로 계산해 보여 준다(lib/board.js ratioLine).

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "./Icon";
import { getMember, authHeader } from "@/lib/member";
import { BOARD, UNITS, PART_HINTS, ratioLine } from "@/lib/board";
import { MOODS } from "@/lib/look";

/** 사진 줄이기 — 긴 변 1600px JPEG(서버가 다시 webp 로 만든다). 휴대폰 사진(5~10MB)을 그대로 보내지 않게 */
async function shrink(file) {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * k);
  c.height = Math.round(bmp.height * k);
  c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((res) => c.toBlob((b) => res(b), "image/jpeg", 0.86));
}

export default function BoardForm() {
  const router = useRouter();
  const [member, setMember] = useState(undefined);
  const [photos, setPhotos] = useState([]); // [{blob, url}]
  const [title, setTitle] = useState("");
  const [q, setQ] = useState("");
  const [found, setFound] = useState([]);
  const [whisky, setWhisky] = useState(null); // {id, name, image}
  const [parts, setParts] = useState([
    { name: "위스키", amount: "45", unit: "ml" },
    { name: "탄산수", amount: "135", unit: "ml" },
  ]);
  const [moods, setMoods] = useState([]);
  const [note, setNote] = useState("");
  const [steps, setSteps] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  useEffect(() => setMember(getMember()), []);

  // 위스키 검색 — 고른 뒤 이름을 고치면 다시 찾는다
  useEffect(() => {
    if (whisky?.name === q || q.trim().length < 1) return setFound([]);
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`).then((x) => x.json());
        setFound((r.items || []).slice(0, 6));
      } catch {}
    }, 220);
    return () => clearTimeout(t);
  }, [q, whisky]);

  async function addPhotos(e) {
    const files = [...(e.target.files || [])].slice(0, BOARD.images - photos.length);
    e.target.value = "";
    for (const f of files) {
      try {
        const blob = await shrink(f);
        setPhotos((list) => (list.length < BOARD.images ? [...list, { blob, url: URL.createObjectURL(blob) }] : list));
      } catch {
        setError("이 사진은 읽을 수 없어요. 다른 사진을 골라 주세요");
      }
    }
  }

  const setPart = (i, key, value) => setParts((list) => list.map((p, j) => (j === i ? { ...p, [key]: value } : p)));
  const numParts = parts.map((p) => ({ ...p, amount: Number(p.amount) }));
  const ratio = ratioLine(numParts);
  const ok = title.trim().length >= BOARD.title.min && (whisky?.name || q.trim()) && parts.length >= 2 && !busy;

  async function submit() {
    setBusy(true);
    setError("");
    try {
      const data = {
        title,
        whisky: whisky && whisky.name === q ? { id: whisky.id, name: whisky.name } : { name: q },
        parts: numParts,
        moods,
        note,
        steps,
      };
      const form = new FormData();
      form.append("data", JSON.stringify(data));
      photos.forEach((p, i) => form.append("images", p.blob, `photo-${i + 1}.jpg`));
      const res = await fetch("/api/board", { method: "POST", headers: authHeader(), body: form });
      const r = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(r.error || "올리지 못했어요");
      router.replace(`/board/${r.post.id}`);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  if (member === undefined) return <main className="page page-detail page-narrow" />;
  if (!member)
    return (
      <main className="page page-detail page-narrow">
        <Link href="/board" className="back" aria-label="뒤로"><Icon name="back" size={22} /></Link>
        <h1 className="display">레시피 올리기</h1>
        <div className="panel board-empty">
          <strong>회원만 올릴 수 있어요</strong>
          <p className="note">만 19세 확인을 거친 회원만 레시피를 올리고 좋아요를 누를 수 있어요.</p>
          <Link href="/login" className="btn-primary">시작하기</Link>
        </div>
      </main>
    );

  return (
    <main className="page page-detail page-narrow board-form">
      <Link href="/board" className="back" aria-label="뒤로"><Icon name="back" size={22} /></Link>
      <h1 className="display">레시피 올리기</h1>
      <p className="lead">{member.nickname}님만의 한 잔을 나눠 주세요.</p>

      <span className="chips-cap">사진 (최대 {BOARD.images}장)</span>
      <div className="bf-photos">
        {photos.map((p, i) => (
          <span key={p.url} className="bf-photo">
            <img src={p.url} alt="" />
            <button type="button" onClick={() => setPhotos((l) => l.filter((_, j) => j !== i))} aria-label="사진 빼기"><Icon name="close" size={14} /></button>
          </span>
        ))}
        {photos.length < BOARD.images && (
          <button type="button" className="bf-add" onClick={() => fileRef.current?.click()}>
            <Icon name="image" size={24} />
            <small>사진 더하기</small>
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={addPhotos} />
      </div>

      <label className="field">
        <span>제목</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={BOARD.title.max} placeholder="예: 꿀 한 스푼 넣은 상큼 하이볼" />
      </label>

      <label className="field bf-whisky">
        <span>어떤 위스키로 만들었나요?</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="위스키 이름으로 찾기 (목록에 없으면 그대로 써도 돼요)" />
        {whisky && whisky.name === q && <small className="bf-picked"><Icon name="check" size={14} /> 목록에서 골랐어요</small>}
        {found.length > 0 && (
          <span className="bf-found">
            {found.map((w) => (
              <button key={w.id} type="button" onClick={() => { setWhisky({ id: w.id, name: w.name }); setQ(w.name); setFound([]); }}>
                {(w.cut || w.image) && <img src={w.cut || w.image} alt="" />}
                <span>{w.name}</span>
              </button>
            ))}
          </span>
        )}
      </label>

      <span className="chips-cap">재료와 양</span>
      <div className="panel bf-parts">
        {parts.map((p, i) => (
          <div key={i} className="bf-part">
            {i === 0 ? <b className="bf-part-name">위스키</b> : (
              <input className="bf-part-name" value={p.name} onChange={(e) => setPart(i, "name", e.target.value)} list="part-hints" maxLength={BOARD.partName} placeholder="재료" />
            )}
            <input className="bf-amount" value={p.unit === "조금" ? "" : p.amount} disabled={p.unit === "조금"} onChange={(e) => setPart(i, "amount", e.target.value.replace(/[^\d.]/g, "").slice(0, 6))} inputMode="decimal" placeholder="양" />
            <select value={p.unit} onChange={(e) => setPart(i, "unit", e.target.value)} aria-label="단위">
              {UNITS.map((u) => <option key={u}>{u}</option>)}
            </select>
            {i > 0 && parts.length > 2 ? (
              <button type="button" className="bf-del" onClick={() => setParts((l) => l.filter((_, j) => j !== i))} aria-label="재료 빼기"><Icon name="close" size={16} /></button>
            ) : <span className="bf-del" />}
          </div>
        ))}
        <datalist id="part-hints">{PART_HINTS.map((h) => <option key={h} value={h} />)}</datalist>
        {parts.length < BOARD.parts && (
          <button type="button" className="btn-ghost bf-more" onClick={() => setParts((l) => [...l, { name: "", amount: "", unit: l[0].unit }])}>
            <Icon name="plus" size={16} /> 재료 더하기
          </button>
        )}
        <p className="bf-ratio">{ratio ? <>비율 <b>{ratio}</b></> : "위스키와 같은 단위(ml · 비율)로 적으면 비율을 계산해 보여 드려요"}</p>
      </div>

      <span className="chips-cap">어떤 맛인가요? (여럿 골라도 돼요)</span>
      <div className="chips">
        {MOODS.map((m) => (
          <button key={m} type="button" className={`chip ${moods.includes(m) ? "is-on" : ""}`} aria-pressed={moods.includes(m)} onClick={() => setMoods((l) => (l.includes(m) ? l.filter((x) => x !== m) : [...l, m]))}>
            {m}
          </button>
        ))}
      </div>

      <label className="field">
        <span>한마디</span>
        <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={BOARD.note} placeholder="예: 꿀이 위스키의 바닐라 향을 살려 줘요" />
      </label>
      <label className="field">
        <span>만드는 법</span>
        <textarea rows={6} value={steps} onChange={(e) => setSteps(e.target.value)} maxLength={BOARD.steps} placeholder={"한 줄에 한 단계씩 적어 주세요\n예: 잔에 얼음을 가득 채워요\n위스키를 붓고 탄산수를 천천히 따라요"} />
      </label>

      {error && <p className="note warn">{error}</p>}
      <div className="flow-next">
        <button className="btn-primary" disabled={!ok} onClick={submit}>{busy ? "올리는 중…" : "레시피 올리기"}</button>
      </div>
    </main>
  );
}
