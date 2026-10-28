"use client";

// 내 정보 서랍 — 오른쪽에서 밀려 나오는 창. 보틀 렌즈(wine) components/AccountDrawer.js 의 구성을 가져왔다(2026-10-28 사용자 요청).
//   회원 카드(가입 전: 시작하기 단추들 · 가입 뒤: 닉네임 · 가입 방법) → 활동(저장 · 보냄 · 만들어 봄 · 내 바) → 취향 → 계정 → 바로 가기
// wine 에만 있는 칸(언어 고르기 · 술 준비 타이머 · 스캔 수 · 구독)은 이 앱에 없는 기능이라 뺐다.
//
// 앱에 하나만 둔다(app/layout.js). 여는 곳은 어디든 openAccount() — 홈 오른쪽 위 프로필 단추, PC 위쪽 메뉴 끝의 프로필 단추.
// 실제 소셜 로그인 · 본인인증은 아직 없다(시연용 가입) — 그 자리는 "준비 중"으로 남겨 두고, 붙이면 화면은 그대로 산다.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "./Icon";
import { AVATARS, PROVIDERS, STRENGTHS, getMember, refreshMember, shortDate, signOut } from "@/lib/member";
import { getBar, getSaved, getStats } from "@/lib/saved";

const OPEN = "wl-account";

/** 어디서든 내 정보 서랍을 연다 */
export const openAccount = () => window.dispatchEvent(new Event(OPEN));

export default function AccountDrawer() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState(null);
  const closeRef = useRef(null);

  // 여는 신호 · 저장소가 바뀌면(가입 · 저장 · 내 바) 다시 읽는다
  useEffect(() => {
    const read = () => {
      const bar = getBar();
      setState({
        member: getMember(),
        saved: getSaved().length,
        stats: getStats(),
        bar: bar.mixers.length + bar.addins.length + bar.extras.length + bar.whiskies.length,
      });
    };
    const onOpen = () => {
      read();
      setOpen(true);
      refreshMember().then(read).catch(() => {}); // 서버 것으로 맞춘다 — 어드민이 정지 · 삭제했으면 여기서 반영
    };
    window.addEventListener(OPEN, onOpen);
    window.addEventListener("wl-storage", read);
    return () => {
      window.removeEventListener(OPEN, onOpen);
      window.removeEventListener("wl-storage", read);
    };
  }, []);

  // 다른 화면으로 가면 닫는다(서랍 안 링크를 눌렀을 때)
  useEffect(() => setOpen(false), [path]);

  // 열려 있는 동안 뒤 화면이 스크롤되지 않게 · Esc 로 닫기
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!open || !state) return null;
  const { member, saved, stats, bar } = state;
  const taste = member ? [...(member.taste?.moods || []), STRENGTHS.find((s) => s.ratio === member.taste?.strength)?.label].filter(Boolean) : [];

  return (
    <>
      <div className="drawer-dim" onClick={() => setOpen(false)} aria-hidden="true" />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="내 정보">
        {/* 바탕을 눌러도 닫히지만, 한 손으로 쓰는 폰에서는 누를 곳이 보여야 한다 */}
        <button ref={closeRef} className="drawer-close" onClick={() => setOpen(false)} aria-label="닫기">
          <Icon name="close" size={18} />
        </button>
        <h2 className="drawer-title">내 정보</h2>

        {member ? (
          <Link href="/account" className="acct-card">
            <span className="avatar" style={{ "--av": AVATARS[member.avatar] }}>{member.nickname.slice(0, 1)}</span>
            <span className="acct-who">
              <strong>{member.nickname}님</strong>
              <span>
                {[PROVIDERS[member.provider]?.name && `${PROVIDERS[member.provider].name}로 가입`, member.createdAt && shortDate(member.createdAt)]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </span>
            <Icon name="chevron" size={18} />
          </Link>
        ) : (
          <>
            <div className="acct-card">
              <span className="avatar is-guest">
                <Icon name="user" size={26} />
              </span>
              <span className="acct-who">
                <strong>로그인하지 않음</strong>
                <span>지금 기록은 이 기기에만 저장돼요</span>
              </span>
            </div>
            <div className="acct-auth">
              {Object.entries(PROVIDERS).map(([key, p]) => (
                <Link key={key} href={`/signup?p=${key}`} className={`auth-btn ${key}`}>
                  {p.name}로 시작하기
                </Link>
              ))}
            </div>
            <p className="drawer-note">
              술을 다루는 앱이라 만 19세 이상만 쓸 수 있어요. 가입할 때 태어난 해로 먼저 확인하고, 정식 서비스에서는 휴대폰 본인인증을 붙일 예정이에요.
            </p>
          </>
        )}

        <p className="acct-section">활동</p>
        <div className="acct-stats">
          <Link href="/me"><b>{saved}</b><span>저장한 레시피</span></Link>
          <div><b>{stats.sent}</b><span>보낸 레시피</span></div>
          <div><b>{stats.made}</b><span>만들어 본 것</span></div>
          <Link href="/bar"><b>{bar}</b><span>내 바 재료</span></Link>
        </div>

        <p className="acct-section">취향</p>
        <div className="acct-row">
          <strong>{taste.length ? `${taste.join(" · ")} 좋아함` : "아직 알려 주지 않았어요"}</strong>
          <span>
            {member
              ? "회원정보에서 바꾸면 레시피 상세의 농도가 처음부터 그 값으로 골라져요."
              : "가입할 때 좋아하는 맛과 농도를 고르면 맞는 레시피를 먼저 보여 드려요."}
          </span>
        </div>

        <p className="acct-section">계정</p>
        <ul className="acct-list">
          <li><span>만 19세 확인</span><em>{member ? "태어난 해로 확인함" : "가입할 때"}</em></li>
          <li><span>휴대폰 본인인증</span><em className="soon">준비 중</em></li>
          <li><span>기기 사이 기록 옮기기</span><em className="soon">준비 중</em></li>
          <li><span>이용 요금</span><em>무료</em></li>
        </ul>

        <nav className="acct-links" aria-label="바로 가기">
          <Link href="/me" className="drawer-link">내 레시피 <Icon name="chevron" size={18} /></Link>
          <Link href="/bar" className="drawer-link">내 바 <Icon name="chevron" size={18} /></Link>
          {member && <Link href="/account" className="drawer-link">회원정보 <Icon name="chevron" size={18} /></Link>}
        </nav>
        {member && (
          <button className="acct-signout" onClick={signOut}>
            로그아웃
          </button>
        )}

        <p className="drawer-note">
          로그인이 붙으면 내 레시피 · 내 바가 기기가 아니라 계정에 묶여요. 지금 쌓는 기록은 그때 계정으로 옮길 수 있게 남겨 둬요.
        </p>
      </aside>
    </>
  );
}
