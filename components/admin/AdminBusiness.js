"use client";

// 어드민 '사업자 정보·약관' — 보이스 동화(Dong) /admin/business 를 옮겼다(2026-10-28).
//   탭: 사업자 정보 | 이용약관 | 개인정보처리방침 | 청소년보호정책 (시행 중인 판이 없는 문서는 "준비 중" 배지)
//   사업자 정보: 칸 고치기 → 푸터 미리보기가 바로 바뀌고, 저장하면 바꾼 칸이 이력에 남는다(사유는 선택).
//   약관: 제목 · 시행일 · 본문 → 미리보기. [준비된 초안 넣기]는 지금 사업자 정보 · 시행일을 채운 초안을 넣는다(lib/legal-drafts.js).
//         게시하면 새 판이 쌓인다(고치지 않는다). 쓰던 글은 이 브라우저에 1초마다 저장해 두었다가 다시 열면 이어 쓴다.

import { useEffect, useMemo, useState } from "react";
import { adminApi, stamp } from "./api";
import LegalDocView from "../LegalDocView";
import SiteFooterView from "../SiteFooterView";
import { BUSINESS_FIELDS, LEGAL_KINDS, LEGAL_LIMITS, addDays, dotDate, fillDraft, infoText, kstToday, validateBusiness } from "@/lib/legal";
import { LEGAL_DRAFTS } from "@/lib/legal-drafts";

const TABS = [{ key: "business", label: "사업자 정보" }, ...Object.entries(LEGAL_KINDS).map(([key, d]) => ({ key, label: d.title }))];

export default function AdminBusiness() {
  const [tab, setTab] = useState("business");
  const [info, setInfo] = useState(null); // 저장된 사업자 정보
  const [live, setLive] = useState({}); // 문서마다 시행 중인 판 번호
  const [msg, setMsg] = useState("");

  const loadInfo = () =>
    adminApi("GET", "/api/admin/business")
      .then((d) => setInfo(d))
      .catch((e) => setMsg(e.message));
  const loadLive = () =>
    Promise.all(Object.keys(LEGAL_KINDS).map((k) => adminApi("GET", `/api/admin/legal?kind=${k}`).then((d) => [k, d.current])))
      .then((rows) => setLive(Object.fromEntries(rows)))
      .catch((e) => setMsg(e.message));

  useEffect(() => {
    // 주소 끝(#privacy 등)으로 탭을 연다 — 같은 화면에서 주소만 바뀌어도
    const fromHash = () => {
      const h = window.location.hash.slice(1);
      if (TABS.some((t) => t.key === h)) setTab(h);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    loadInfo();
    loadLive();
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  const pick = (key) => {
    setTab(key);
    history.replaceState(null, "", `#${key}`);
  };

  return (
    <>
      <h1 className="admin-title">사업자 정보·약관</h1>
      <p className="admin-sub">웹 출시에 필요한 회사 표시 사항과 약관이에요. 손님 화면 맨 아래 줄(푸터)과 약관 화면에 바로 나와요.</p>
      {msg && <p className="note warn">{msg}</p>}

      <div className="adm-tabs" role="tablist" aria-label="사업자 정보·약관">
        {TABS.map((t) => (
          <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} className={tab === t.key ? "is-on" : ""} onClick={() => pick(t.key)}>
            {t.label}
            {t.key !== "business" && !live[t.key] && <span className="adm-badge amber">준비 중</span>}
          </button>
        ))}
      </div>

      {!info ? (
        <div className="acard skeleton" />
      ) : tab === "business" ? (
        <BusinessForm data={info} live={live} onSaved={loadInfo} />
      ) : (
        <LegalEditor key={tab} kind={tab} info={info.info} onPublished={loadLive} />
      )}
    </>
  );
}

// ── 사업자 정보

function BusinessForm({ data, live, onSaved }) {
  const [form, setForm] = useState(() => Object.fromEntries(BUSINESS_FIELDS.map((f) => [f.key, data.info[f.key] ?? ""])));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const { value, errors } = useMemo(() => validateBusiness(form), [form]);
  const dirty = BUSINESS_FIELDS.some((f) => (data.info[f.key] ?? null) !== value[f.key]);

  async function save(e) {
    e.preventDefault();
    if (Object.keys(errors).length) return setMsg("빨간 칸을 먼저 고쳐 주세요");
    setBusy(true);
    setMsg("");
    try {
      const out = await adminApi("POST", "/api/admin/business", { info: form, note });
      setNote("");
      setMsg(out.changed.length ? `${out.changed.length}칸을 저장했어요. 푸터에 바로 나와요` : "바뀐 칸이 없어요");
      await onSaved();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="adm-two">
      <form className="acard" onSubmit={save}>
        <h2>회사 표시 사항</h2>
        <p className="note dim">빈 칸은 푸터에 "(등록 예정)"으로 나와요. 사업자등록번호는 숫자만 넣으면 모양을 맞춰요.</p>
        <div className="adm-fields">
          {BUSINESS_FIELDS.map((f) => (
            <label key={f.key} className={`field ${errors[f.key] ? "is-bad" : ""}`}>
              <span>
                {f.label}
                {f.required && <em className="adm-req"> 필수</em>}
              </span>
              <input
                value={form[f.key]}
                maxLength={f.max + 4}
                onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                onBlur={() => f.key === "bizNo" && value.bizNo && setForm((s) => ({ ...s, bizNo: value.bizNo }))}
                aria-invalid={!!errors[f.key]}
              />
              {errors[f.key] ? <small className="adm-err">{errors[f.key]}</small> : f.hint ? <small>{f.hint}</small> : null}
            </label>
          ))}
        </div>
        <label className="field">
          <span>바꾸는 이유(선택)</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={LEGAL_LIMITS.note} placeholder="예: 사업자등록증 받아서 번호 넣음" />
        </label>
        <div className="adm-actions">
          {msg && <p className="note">{msg}</p>}
          <button className="btn-primary" disabled={!dirty || busy}>{busy ? "저장하는 중…" : "저장하기"}</button>
        </div>
      </form>

      <div>
        <section className="acard">
          <h2>푸터 미리보기</h2>
          <p className="note dim">손님 화면 맨 아래에 이렇게 나와요(고치는 대로 바로 바뀌어요).</p>
          <div className="adm-preview">
            <SiteFooterView info={value} live={live} preview />
          </div>
        </section>
        <section className="acard">
          <h2>바꾼 이력</h2>
          {data.history.length ? (
            <div className="atable-wrap">
              <table className="atable">
                <thead>
                  <tr><th>때</th><th>칸</th><th>전 → 후</th><th>이유</th></tr>
                </thead>
                <tbody>
                  {data.history.map((h) => (
                    <tr key={h.id}>
                      <td>{stamp(h.at)}</td>
                      <td>{h.label}</td>
                      <td className="adm-wrap">{infoText(h.before)} → {infoText(h.after)}</td>
                      <td className="adm-wrap">{h.note || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="note dim">아직 바꾼 적이 없어요. 지금 값은 기본값(보이스 동화 약관에 적힌 요기코퍼레이션 정보)이에요.</p>
          )}
        </section>
      </div>
    </div>
  );
}

// ── 약관 한 문서

const draftKey = (kind) => `wl-admin-legal:${kind}`;

function LegalEditor({ kind, info, onPublished }) {
  const doc = LEGAL_KINDS[kind];
  const [data, setData] = useState(null); // { versions, current, upcoming, today }
  const [title, setTitle] = useState(doc.title);
  const [effectiveDate, setEffectiveDate] = useState(kstToday());
  const [body, setBody] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [restored, setRestored] = useState(false);

  const load = () =>
    adminApi("GET", `/api/admin/legal?kind=${kind}`)
      .then((d) => {
        setData(d);
        // 처음 게시는 오늘, 고치는 판은 7일 뒤가 기본(약관은 7일 전에 알려야 한다)
        setEffectiveDate(d.current ? addDays(d.today, 7) : d.today);
        return d;
      })
      .catch((e) => setMsg(e.message));

  useEffect(() => {
    load().then(() => {
      try {
        const saved = JSON.parse(localStorage.getItem(draftKey(kind)));
        if (saved?.body) {
          setTitle(saved.title || doc.title);
          setBody(saved.body);
          setRestored(true);
        }
      } catch {}
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  // 쓰던 글을 이 브라우저에 1초마다 저장해 둔다(게시하면 지운다)
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        if (body.trim()) localStorage.setItem(draftKey(kind), JSON.stringify({ title, body }));
        else localStorage.removeItem(draftKey(kind));
      } catch {}
    }, 1000);
    return () => clearTimeout(id);
  }, [kind, title, body]);

  if (!data) return <div className="acard skeleton" />;
  const next = (data.versions[0]?.version || 0) + 1;
  const current = data.versions.find((v) => v.version === data.current);
  const statusOf = (v) => (v.version === data.current ? ["시행 중", "green"] : v.version === data.upcoming ? ["예정", "blue"] : v.effectiveDate > data.today ? ["예정", "blue"] : ["지난 판", "gray"]);
  const shortNotice = data.current && effectiveDate < addDays(data.today, 7);

  const replaceBody = (text, t = doc.title) => {
    if (body.trim() && !window.confirm("지금 쓰던 본문을 지우고 바꿀까요?")) return;
    setTitle(t);
    setBody(text);
    setRestored(false);
  };

  async function publish() {
    if (!window.confirm(`${doc.title} 제${next}판을 ${dotDate(effectiveDate)}부터 시행하도록 게시할까요? 게시한 판은 고칠 수 없어요.`)) return;
    setBusy(true);
    setMsg("");
    try {
      await adminApi("POST", "/api/admin/legal", { kind, title, body, effectiveDate, note });
      try {
        localStorage.removeItem(draftKey(kind));
      } catch {}
      setNote("");
      setBody("");
      setRestored(false);
      setMsg(`제${next}판을 게시했어요. ${effectiveDate <= data.today ? "손님 화면에 바로 나와요" : `${dotDate(effectiveDate)}부터 손님 화면에 나와요`}`);
      await load();
      await onPublished();
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="acard">
        <div className="acard-head">
          <h2>
            {doc.title}{" "}
            {current ? <span className="adm-badge green">제{current.version}판 시행 중 · {dotDate(current.effectiveDate)}~</span> : <span className="adm-badge amber">준비 중</span>}
          </h2>
          <a href={doc.path} target="_blank" rel="noreferrer" className="link-more">손님 화면 보기</a>
        </div>
        <div className="adm-tools">
          <button type="button" className="btn-ghost s" onClick={() => replaceBody(fillDraft(LEGAL_DRAFTS[kind].body, info, effectiveDate), LEGAL_DRAFTS[kind].title)}>
            준비된 초안 넣기
          </button>
          {current && (
            <button type="button" className="btn-ghost s" onClick={() => replaceBody(current.body, current.title)}>
              지금 판 불러오기
            </button>
          )}
          {restored && <span className="note dim">쓰던 글을 이어서 열었어요(이 브라우저에 저장된 것)</span>}
        </div>
        <p className="note dim">
          초안은 지금 사업자 정보와 시행일로 빈칸을 채워 넣어요. 〔 〕 표시는 게시 전에 사실을 확인해 고칠 곳이에요. 법률 검토를 거친 문서가 아니니 게시 전에 꼭 읽어 주세요.
        </p>
      </section>

      <div className="adm-two">
        <section className="acard">
          <h2>쓰기</h2>
          <div className="adm-fields one">
            <label className="field">
              <span>제목</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={LEGAL_LIMITS.title} />
            </label>
            <label className="field">
              <span>시행일</span>
              <input type="date" value={effectiveDate} min={data.today} max={addDays(data.today, 366)} onChange={(e) => setEffectiveDate(e.target.value)} />
              {shortNotice ? (
                <small className="adm-err">약관을 바꿀 때는 시행 7일 전(이용자에게 불리하면 30일 전)부터 알려야 해요. 막지는 않아요.</small>
              ) : (
                <small>오늘부터 1년 안. 시행일이 되면 손님 화면이 이 판으로 바뀌어요.</small>
              )}
            </label>
            <label className="field">
              <span>본문 <small>({body.length.toLocaleString()} / {LEGAL_LIMITS.body.toLocaleString()}자)</small></span>
              <textarea className="adm-body-text" value={body} onChange={(e) => setBody(e.target.value)} rows={22} placeholder={"## 제1조 (목적)\n본문…\n\n- 글머리\n1. 번호"} />
              <small>## 제목 · ### 작은 제목 · - 글머리 · 1. 번호 · --- 가로줄 · 빈 줄은 문단</small>
            </label>
            <label className="field">
              <span>게시 메모(선택)</span>
              <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={LEGAL_LIMITS.note} placeholder="예: 첫 게시 · 위탁 업체 추가" />
            </label>
          </div>
          <div className="adm-actions">
            {msg && <p className="note">{msg}</p>}
            <button type="button" className="btn-primary" disabled={!body.trim() || busy} onClick={publish}>
              {busy ? "게시하는 중…" : `제${next}판 게시하기`}
            </button>
          </div>
        </section>
        <section className="acard">
          <h2>미리보기</h2>
          <div className="adm-preview legal-preview">
            <h1 className="legal-title">{title || doc.title}</h1>
            <p className="legal-meta">시행일 {dotDate(effectiveDate)} · 제{next}판</p>
            {body.trim() ? <LegalDocView body={body} /> : <p className="note dim">본문을 쓰면 여기에 손님 화면 모양으로 보여요.</p>}
          </div>
        </section>
      </div>

      <section className="acard">
        <h2>판 이력</h2>
        {data.versions.length ? (
          <div className="atable-wrap">
            <table className="atable">
              <thead>
                <tr><th>판</th><th>상태</th><th>시행일</th><th>게시</th><th>메모</th><th className="num">글자</th><th /></tr>
              </thead>
              <tbody>
                {data.versions.map((v) => {
                  const [label, tone] = statusOf(v);
                  return (
                    <tr key={v.version}>
                      <td>제{v.version}판</td>
                      <td><span className={`adm-badge ${tone}`}>{label}</span></td>
                      <td>{dotDate(v.effectiveDate)}</td>
                      <td>{stamp(v.publishedAt)} · {v.by || "-"}</td>
                      <td className="adm-wrap">{v.note || "-"}</td>
                      <td className="num">{v.body.length.toLocaleString()}</td>
                      <td>
                        <button type="button" className="btn-ghost s" onClick={() => replaceBody(v.body, v.title)}>이 판으로 다시 쓰기</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="note dim">아직 게시한 판이 없어요. 손님 화면에는 "준비 중"으로 나와요.</p>
        )}
      </section>
    </>
  );
}
