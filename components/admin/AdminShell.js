"use client";

// 어드민 틀 — 보이스 동화(Desktop/Dong) 관리 화면의 레이아웃을 따랐다(2026-10-28 사용자 요청).
//   넓은 화면(1024px~): 왼쪽 메뉴(묶음 · 아이콘 · 맨 아래 사이트로 · 로그아웃) + 위쪽 머리 줄(지금 화면 이름 · 사이트로 · 계정)
//   좁은 화면: 머리 줄(로고 · 사이트로 · 계정) 아래에 메뉴가 알약 줄로 붙는다(줄 안에서만 옆으로 민다)
// 색은 토스풍 밝은 관리 색 — 강조는 파랑 하나, 앱 색(호박색)은 로고 네모에만(Dong 과 같은 규칙). globals.css "어드민".
// 로그인 전에는 아이디 · 비밀번호 창. 로그인은 서명한 쿠키(lib/server/admin.js)라 화면 쪽에서는 상태만 묻는다 —
// 막는 것은 이 화면이 아니라 서버(/api/admin/* 의 쿠키 확인)다.

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "../Icon";
import { BrandMark as LensMark } from "../Brand";

const GROUPS = ["운영", "콘텐츠", "회사"];
const NAV = [
  { href: "/admin", label: "대시보드", group: "운영", icon: "dashboard" },
  { href: "/admin/members", label: "회원", group: "운영", icon: "users" },
  { href: "/admin/recipes", label: "레시피·추천", group: "콘텐츠", icon: "cocktail" },
  { href: "/admin/banners", label: "공지·배너", group: "콘텐츠", icon: "megaphone" },
  { href: "/admin/business", label: "사업자 정보·약관", group: "회사", icon: "building" },
];

const isOn = (path, href) => (href === "/admin" ? path === "/admin" : path.startsWith(href));

/** 로고 마크(components/Brand.js) — 어드민에서 앱 색(호박색)이 쓰이는 유일한 자리 */
function BrandMark({ size = 28 }) {
  return <LensMark size={size} className="adm-mark" />;
}

export default function AdminShell({ children }) {
  const path = usePathname();
  const [state, setState] = useState("checking"); // checking · out · in
  const [me, setMe] = useState("");
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const check = () =>
    fetch("/api/admin/login", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setMe(d.id || "");
        setState(d.admin ? "in" : "out");
      })
      .catch(() => setState("out"));

  useEffect(() => {
    check();
  }, []);

  async function login(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, password }) });
    setBusy(false);
    if (res.ok) {
      setPassword("");
      await check();
    } else {
      setError((await res.json().catch(() => ({}))).error || "로그인하지 못했어요");
    }
  }

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    setMe("");
    setState("out");
  }

  if (state === "checking") return <div className="admin-gate"><div className="skeleton" /></div>;

  if (state === "out") {
    return (
      <div className="admin-gate">
        <form className="adm-login" onSubmit={login}>
          <span className="adm-login-mark"><BrandMark size={52} /></span>
          <h1>Whisky Lens 관리</h1>
          <p>관리자 아이디와 비밀번호를 넣어 주세요.</p>
          <label className="field">
            <span>아이디</span>
            <input value={id} onChange={(e) => setId(e.target.value)} autoFocus autoComplete="username" autoCapitalize="none" spellCheck={false} />
          </label>
          <label className="field">
            <span>비밀번호</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </label>
          {error && <p className="adm-error" role="alert">{error}</p>}
          <button className="btn-primary wide" disabled={!id || !password || busy}>{busy ? "확인하는 중…" : "들어가기"}</button>
          <Link href="/" className="adm-back">사이트로 돌아가기</Link>
        </form>
      </div>
    );
  }

  const current = NAV.find((n) => isOn(path, n.href));
  return (
    <div className="admin">
      <a href="#admin-main" className="adm-skip">본문으로 건너뛰기</a>

      <nav className="adm-side" aria-label="관리 메뉴">
        <Link href="/admin" className="adm-brand">
          <BrandMark />
          <span className="brand-word">
            Whisky <b>Lens</b>
          </span>
          <small>관리</small>
        </Link>
        {GROUPS.map((g) => (
          <div key={g} className="adm-group">
            <p>{g}</p>
            {NAV.filter((n) => n.group === g).map((n) => {
              const on = isOn(path, n.href);
              return (
                <Link key={n.href} href={n.href} className={on ? "is-on" : ""} aria-current={on ? "page" : undefined}>
                  <Icon name={n.icon} size={20} />
                  <span>{n.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
        <div className="adm-side-foot">
          <Link href="/">
            <Icon name="external" size={20} />
            <span>사이트로</span>
          </Link>
          <button type="button" onClick={logout}>
            <Icon name="logout" size={20} />
            <span>로그아웃</span>
          </button>
        </div>
      </nav>

      <div className="adm-body">
        <header className="adm-top">
          <Link href="/admin" className="adm-top-brand">
            <BrandMark />
            관리
          </Link>
          <p className="adm-top-title">{current?.label || "관리"}</p>
          <div className="adm-top-right">
            <Link href="/" className="adm-top-link" aria-label="사이트로">
              <span>사이트로</span>
              <Icon name="external" size={16} />
            </Link>
            <span className="adm-me" title="지금 들어온 계정">
              <i aria-hidden="true">{(me || "?").slice(0, 1).toUpperCase()}</i>
              {me}
            </span>
            <button type="button" className="adm-top-logout" onClick={logout} aria-label="로그아웃">
              <Icon name="logout" size={18} />
            </button>
          </div>
        </header>

        <nav className="adm-pills" aria-label="관리 메뉴">
          {NAV.map((n) => {
            const on = isOn(path, n.href);
            return (
              <Link key={n.href} href={n.href} className={on ? "is-on" : ""} aria-current={on ? "page" : undefined}>
                {n.label}
              </Link>
            );
          })}
        </nav>

        <main id="admin-main" tabIndex={-1} className="admin-main">
          {children}
        </main>
      </div>
    </div>
  );
}
