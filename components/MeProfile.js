"use client";

// 내 레시피 위의 프로필 — 가입했으면 닉네임 · 취향 · 내 기록(저장 · 보냄 · 만들어 봄), 아니면 시작하기 안내.
// 가입을 막 마치고 오면(?welcome=1) 환영 인사를 띄운다.

import { useEffect, useState } from "react";
import Link from "next/link";
import Icon from "./Icon";
import { AVATARS, STRENGTHS, getMember, refreshMember } from "@/lib/member";
import { getSaved, getStats } from "@/lib/saved";

export default function MeProfile() {
  const [state, setState] = useState(null);
  const [welcome, setWelcome] = useState(false);

  useEffect(() => {
    const read = () => setState({ member: getMember(), saved: getSaved().length, stats: getStats() });
    read();
    // 서버 것으로 맞춘다 — 어드민이 정지·삭제했으면 여기서 반영된다
    refreshMember().then(read);
    setWelcome(new URLSearchParams(window.location.search).has("welcome"));
    window.addEventListener("wl-storage", read);
    return () => window.removeEventListener("wl-storage", read);
  }, []);

  useEffect(() => {
    if (!welcome) return;
    const id = setTimeout(() => setWelcome(false), 2600);
    return () => clearTimeout(id);
  }, [welcome]);

  if (!state) return null;
  const { member, saved, stats } = state;

  if (!member) {
    return (
      <Link href="/login" className="profile-card is-guest">
        <span className="avatar" style={{ "--av": "#e8dccd" }}>
          <Icon name="saved" size={26} />
        </span>
        <span className="profile-text">
          <strong>로그인하고 어디서나 보기</strong>
          <span className="profile-meta">지금은 이 기기에만 저장돼요. 가입하면 보낼 때 내 이름도 붙어요.</span>
        </span>
        <span className="link-more">시작</span>
      </Link>
    );
  }

  const taste = [...(member.taste?.moods || []), STRENGTHS.find((s) => s.ratio === member.taste?.strength)?.label].filter(Boolean);
  return (
    <>
      <Link href="/account" className="profile-card">
        <span className="avatar" style={{ "--av": AVATARS[member.avatar] }}>{member.nickname.slice(0, 1)}</span>
        <span className="profile-text">
          <strong>{member.nickname}님의 바</strong>
          <span className="profile-meta">{taste.length ? `${taste.join(" · ")} 좋아함` : "취향을 알려 주면 맞는 레시피를 골라 드려요"}</span>
        </span>
        <span className="link-more">회원정보</span>
      </Link>
      <div className="profile-stats">
        <div><b>{saved}</b><span>저장한 레시피</span></div>
        <div><b>{stats.sent}</b><span>보낸 레시피</span></div>
        <div><b>{stats.made}</b><span>만들어 본 것</span></div>
      </div>
      {welcome && <div className="toast" role="status">환영해요, {member.nickname}님!</div>}
    </>
  );
}
