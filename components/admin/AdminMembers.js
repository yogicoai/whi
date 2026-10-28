"use client";

// 어드민 회원 — 닉네임 찾기 · 상태 거르기 · 목록 · 한 명 자세히(가입 방법, 19세 확인, 동의 내역, 취향, 이용 기록) ·
// 이용 정지/해제 · 탈퇴 처리(회원정보를 지운다). 목록은 app/api/admin/members.

import { useEffect, useState } from "react";
import { adminApi, stamp } from "./api";
import { AVATARS, PROVIDERS, STRENGTHS } from "@/lib/member";

const STATUS = { active: "이용 중", suspended: "이용 정지" };
const FILTERS = [
  { value: "", label: "전체" },
  { value: "active", label: "이용 중" },
  { value: "suspended", label: "이용 정지" },
];

export default function AdminMembers() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(null); // 자세히 보는 회원
  const [busy, setBusy] = useState(false);

  const load = () => {
    setError("");
    adminApi("GET", `/api/admin/members?q=${encodeURIComponent(q.trim())}&status=${status}`)
      .then((d) => {
        setData(d);
        setOpen((o) => (o ? d.items.find((m) => m.id === o.id) || null : null));
      })
      .catch((e) => setError(e.message));
  };

  // 글자를 멈추고 잠시 뒤에 찾는다
  useEffect(() => {
    const id = setTimeout(load, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status]);

  async function act(fn) {
    setBusy(true);
    try {
      await fn();
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const toggleStatus = (m) =>
    act(() => adminApi("PATCH", `/api/admin/members/${m.id}`, { status: m.status === "suspended" ? "active" : "suspended" }));
  const remove = (m) => {
    if (!window.confirm(`${m.nickname} 회원을 탈퇴 처리할까요? 회원정보가 지워지고 되돌릴 수 없어요.`)) return;
    act(async () => {
      await adminApi("DELETE", `/api/admin/members/${m.id}`);
      setOpen(null);
    });
  };

  return (
    <>
      <h1 className="admin-title">회원</h1>
      <p className="admin-sub">지금은 시연용 가입이라 실제 소셜 계정·본인인증 정보는 없어요. 탈퇴 처리하면 회원정보를 지워요.</p>

      <div className="admin-tools">
        <label className="search-field admin-search">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="닉네임으로 찾기" aria-label="닉네임으로 찾기" />
        </label>
        <div className="chips">
          {FILTERS.map((f) => (
            <button key={f.value} className={`chip ${status === f.value ? "is-on" : ""}`} aria-pressed={status === f.value} onClick={() => setStatus(f.value)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="note warn">{error}</p>}

      <div className={`admin-split ${open ? "has-open" : ""}`}>
        <section className="acard">
          <h2>{data ? `${data.total.toLocaleString()}명` : "불러오는 중"}</h2>
          {data && !data.items.length && <p className="note dim">맞는 회원이 없어요.</p>}
          {data?.items.length > 0 && (
            <div className="atable-wrap">
              <table className="atable">
                <thead>
                  <tr>
                    <th>닉네임</th>
                    <th>가입</th>
                    <th>19세</th>
                    <th>알림</th>
                    <th className="num">저장·보냄·만듦</th>
                    <th>상태</th>
                    <th>마지막 접속</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((m) => (
                    <tr key={m.id} className={open?.id === m.id ? "is-on" : ""} onClick={() => setOpen(m)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setOpen(m)}>
                      <td>
                        <span className="who">
                          <span className="avatar s" style={{ "--av": AVATARS[m.avatar] }}>{m.nickname.slice(0, 1)}</span>
                          {m.nickname}
                        </span>
                      </td>
                      <td>{PROVIDERS[m.provider]?.name} · {stamp(m.createdAt).slice(0, 10)}</td>
                      <td>{m.adultVerified ? "확인" : "-"}</td>
                      <td>{m.agreements?.marketing ? "동의" : "-"}</td>
                      <td className="num">{m.activity.save || 0} · {m.activity.send || 0} · {m.activity.made || 0}</td>
                      <td><span className={`badge ${m.status === "suspended" ? "stop" : "ok"}`}>{STATUS[m.status] || m.status}</span></td>
                      <td>{stamp(m.lastSeenAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {open && (
          <aside className="acard member-detail" aria-label={`${open.nickname} 자세히`}>
            <div className="who big">
              <span className="avatar" style={{ "--av": AVATARS[open.avatar] }}>{open.nickname.slice(0, 1)}</span>
              <span>
                <strong>{open.nickname}</strong>
                <small>{open.id}</small>
              </span>
              <button className="icon-btn" onClick={() => setOpen(null)} aria-label="닫기">✕</button>
            </div>
            <dl className="facts-list">
              <dt>상태</dt><dd><span className={`badge ${open.status === "suspended" ? "stop" : "ok"}`}>{STATUS[open.status]}</span></dd>
              <dt>가입 방법</dt><dd>{PROVIDERS[open.provider]?.name}</dd>
              <dt>가입일</dt><dd>{stamp(open.createdAt)}</dd>
              <dt>태어난 해</dt><dd>{open.birthYear}</dd>
              <dt>19세 확인</dt><dd>{open.adultVerified ? `확인 (${open.verifiedBy === "demo" ? "시연용" : "본인인증"}) · ${stamp(open.verifiedAt)}` : "안 됨"}</dd>
              <dt>약관·개인정보</dt><dd>{stamp(open.agreements?.terms)}</dd>
              <dt>이벤트 알림</dt><dd>{open.agreements?.marketing ? `동의 · ${stamp(open.agreements.marketing)}` : "받지 않음"}</dd>
              <dt>좋아하는 맛</dt><dd>{open.taste?.moods?.join(" · ") || "-"}</dd>
              <dt>좋아하는 농도</dt><dd>{STRENGTHS.find((s) => s.ratio === open.taste?.strength)?.label || "-"}</dd>
              <dt>이용 기록</dt><dd>저장 {open.activity.save || 0} · 보냄 {open.activity.send || 0} · 만들어 봄 {open.activity.made || 0}</dd>
              <dt>마지막 접속</dt><dd>{stamp(open.lastSeenAt)}</dd>
            </dl>
            <div className="detail-actions">
              <button className="btn-ghost" disabled={busy} onClick={() => toggleStatus(open)}>
                {open.status === "suspended" ? "이용 정지 풀기" : "이용 정지"}
              </button>
              <button className="btn-danger" disabled={busy} onClick={() => remove(open)}>탈퇴 처리</button>
            </div>
          </aside>
        )}
      </div>
    </>
  );
}
