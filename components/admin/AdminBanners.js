"use client";

// 어드민 공지·배너 — 홈 인사말 아래에 띄울 배너를 만들고(제목·내용·링크·색·기간), 켜고 끄고, 고치고, 지운다.
// 켜져 있고 기간 안인 것만 홈에 나온다(최신 3개). 만드는 동안 홈에서 보일 모양을 바로 보여 준다.

import { useEffect, useState } from "react";
import { adminApi, stamp } from "./api";
import HomeBanner from "../HomeBanner";

const TONES = { orange: "귤색", sky: "하늘색", cream: "크림색" };
const EMPTY = { title: "", body: "", link: "", tone: "orange", active: true, startAt: "", endAt: "" };
const dateOnly = (iso) => (iso ? new Date(new Date(iso).getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10) : "");

export default function AdminBanners() {
  const [list, setList] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null); // 고치는 배너 id
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => adminApi("GET", "/api/admin/banners").then((d) => setList(d.banners)).catch((e) => setMsg(e.message));
  useEffect(() => {
    load();
  }, []);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const reset = () => {
    setForm(EMPTY);
    setEditing(null);
  };

  async function run(fn, done) {
    setBusy(true);
    setMsg("");
    try {
      await fn();
      await load();
      if (done) setMsg(done);
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  }

  const submit = (e) => {
    e.preventDefault();
    run(async () => {
      if (editing) await adminApi("PATCH", `/api/admin/banners/${editing}`, form);
      else await adminApi("POST", "/api/admin/banners", form);
      reset();
    }, editing ? "고쳤어요" : "만들었어요. 켜 두면 홈에 바로 나와요");
  };
  const edit = (b) => {
    setEditing(b.id);
    setForm({ title: b.title, body: b.body || "", link: b.link || "", tone: b.tone, active: b.active, startAt: dateOnly(b.startAt), endAt: dateOnly(b.endAt) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const toggle = (b) => run(() => adminApi("PATCH", `/api/admin/banners/${b.id}`, { ...b, startAt: dateOnly(b.startAt), endAt: dateOnly(b.endAt), active: !b.active }));
  const remove = (b) => window.confirm(`"${b.title}" 배너를 지울까요?`) && run(() => adminApi("DELETE", `/api/admin/banners/${b.id}`), "지웠어요");

  const now = Date.now();
  const live = (b) => b.active && (!b.startAt || new Date(b.startAt) <= now) && (!b.endAt || new Date(b.endAt) >= now);

  return (
    <>
      <h1 className="admin-title">공지·배너</h1>
      <p className="admin-sub">홈 인사말 아래에 나와요. 켜져 있고 기간 안인 것만, 최신 3개까지.</p>

      <div className="agrid2">
        <form className="acard" onSubmit={submit}>
          <h2>{editing ? "배너 고치기" : "새 배너"}</h2>
          <label className="field">
            <span>제목 (40자)</span>
            <input value={form.title} onChange={(e) => set({ title: e.target.value })} maxLength={40} placeholder="예: 가을엔 핫 토디 한 잔" required />
          </label>
          <label className="field">
            <span>내용 (120자, 선택)</span>
            <input value={form.body} onChange={(e) => set({ body: e.target.value })} maxLength={120} placeholder="예: 꿀과 레몬을 탄 따뜻한 위스키 레시피를 소개해요" />
          </label>
          <label className="field">
            <span>누르면 갈 곳 (선택)</span>
            <input value={form.link} onChange={(e) => set({ link: e.target.value })} placeholder="/recipes/hottoddy 또는 https://…" />
          </label>
          <span className="chips-cap">색</span>
          <div className="chips">
            {Object.entries(TONES).map(([k, label]) => (
              <button type="button" key={k} className={`chip ${form.tone === k ? "is-on" : ""}`} aria-pressed={form.tone === k} onClick={() => set({ tone: k })}>
                {label}
              </button>
            ))}
          </div>
          <div className="date-row">
            <label className="field">
              <span>시작일 (선택)</span>
              <input type="date" value={form.startAt} onChange={(e) => set({ startAt: e.target.value })} />
            </label>
            <label className="field">
              <span>종료일 (선택)</span>
              <input type="date" value={form.endAt} onChange={(e) => set({ endAt: e.target.value })} />
            </label>
          </div>
          <div className="row">
            <span>바로 켜기</span>
            <button type="button" className={`switch ${form.active ? "is-on" : ""}`} role="switch" aria-checked={form.active} aria-label="바로 켜기" onClick={() => set({ active: !form.active })} />
          </div>
          {msg && <p className="note">{msg}</p>}
          <div className="detail-actions">
            {editing && <button type="button" className="btn-ghost" onClick={reset}>그만 고치기</button>}
            <button className="btn-primary" disabled={!form.title.trim() || busy}>{editing ? "고친 것 저장" : "만들기"}</button>
          </div>
        </form>

        <section className="acard">
          <h2>홈에서 이렇게 보여요</h2>
          <div className="banner-preview">
            {form.title.trim() ? <HomeBanner banners={[{ id: "preview", ...form, title: form.title.trim(), link: form.link || null }]} /> : <p className="note dim">제목을 적으면 여기에 보여요.</p>}
          </div>
        </section>
      </div>

      <section className="acard">
        <h2>배너 {list ? list.length : ""}개</h2>
        {list && !list.length && <p className="note dim">아직 없어요.</p>}
        <ul className="banner-rows">
          {list?.map((b) => (
            <li key={b.id}>
              <span className={`tone-dot tone-${b.tone}`} aria-hidden="true" />
              <span className="pick-text">
                <strong>{b.title}</strong>
                <small>
                  {[b.body, b.link, b.startAt || b.endAt ? `${b.startAt ? stamp(b.startAt).slice(0, 10) : "언제든"} ~ ${b.endAt ? stamp(b.endAt).slice(0, 10) : "계속"}` : "기간 없음"].filter(Boolean).join(" · ")}
                </small>
              </span>
              <span className={`badge ${live(b) ? "ok" : "muted"}`}>{live(b) ? "홈에 나옴" : b.active ? "기간 밖" : "꺼짐"}</span>
              <button className={`switch ${b.active ? "is-on" : ""}`} role="switch" aria-checked={b.active} aria-label={`${b.title} 켜기`} disabled={busy} onClick={() => toggle(b)} />
              <button className="btn-ghost s" onClick={() => edit(b)}>고치기</button>
              <button className="btn-danger" disabled={busy} onClick={() => remove(b)}>지우기</button>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
