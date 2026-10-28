"use client";

// 홈에서 사람마다 달라지는 부분 — 인사말(지금 시각) · 첫 화면 오른쪽 위 프로필 단추(내 정보 서랍) · "내 바로 지금 만들 수 있어요".
//
// 서버는 이 사람이 누구인지, 무엇을 가졌는지 모른다. 그래서 처음엔 손님 기준으로 그리고 브라우저에서 읽은 뒤에 바꾼다.
// 바뀌어도 화면이 밀리지 않게 둔다 — 제목은 서버가 한국 시각으로 미리 그린 그대로(lib/greeting.js),
// 프로필은 자리가 정해진 둥근 단추에, "지금 만들 수 있어요"는 처음부터 안내 카드 자리에 그린다.

import { useEffect, useState } from "react";
import Link from "next/link";
import RecipeCard from "./RecipeCard";
import Icon from "./Icon";
import { getBar } from "@/lib/saved";
import { AVATARS, getMember } from "@/lib/member";
import { makeable } from "@/lib/bar";
import { greetingAt } from "@/lib/greeting";
import { openAccount } from "./AccountDrawer";

export function Greeting({ initial }) {
  const [text, setText] = useState(initial);
  // 그 사람 시계로 다시 본다 — 서버가 그린 뒤 시각 경계를 넘었을 때만 바뀐다
  useEffect(() => {
    const now = new Date();
    setText(greetingAt(now.getHours(), now.getDay()));
  }, []);
  return <h1 className="display">{text}</h1>;
}

/** 첫 화면 오른쪽 위 둥근 단추 — 누르면 내 정보 서랍(components/AccountDrawer.js). 가입한 사람은 닉네임 첫 글자, 아니면 사람 아이콘 */
export function HomeMe() {
  const [member, setMember] = useState(null);
  useEffect(() => {
    const read = () => setMember(getMember());
    read();
    window.addEventListener("wl-storage", read);
    return () => window.removeEventListener("wl-storage", read);
  }, []);
  return (
    <button
      type="button"
      className={`me-chip ${member ? "is-member" : ""}`}
      onClick={openAccount}
      aria-label={member ? `${member.nickname}님의 내 정보` : "내 정보"}
    >
      {member ? (
        <span className="avatar s" style={{ "--av": AVATARS[member.avatar] }}>{member.nickname.slice(0, 1)}</span>
      ) : (
        <Icon name="user" size={21} />
      )}
    </button>
  );
}

export function ForYou() {
  const [list, setList] = useState(null);

  useEffect(() => {
    const read = () => setList(makeable(getBar()));
    read();
    window.addEventListener("wl-storage", read);
    return () => window.removeEventListener("wl-storage", read);
  }, []);

  if (!list?.length) {
    return (
      <Link href="/bar" className="hint-card">
        <strong>집에 있는 재료를 알려 주세요</strong>
        <span>콜라·토닉·탄산수… 가진 것만 고르면 지금 만들 수 있는 레시피를 골라 드려요.</span>
      </Link>
    );
  }
  return (
    <section className="section">
      <div className="section-head">
        <h2 className="h2">내 바로 지금 만들 수 있어요</h2>
        <Link href="/bar" className="link-more">내 바</Link>
      </div>
      <div className="rail">
        {list.slice(0, 6).map(({ recipe, whisky }) => (
          <RecipeCard
            key={recipe.key}
            recipe={recipe}
            size="s"
            href={whisky ? `/recipes/${recipe.key}?w=${whisky.id}` : `/recipes/${recipe.key}`}
            whiskyColor={whisky?.liquidColor || undefined}
            badge={whisky ? whisky.name : null}
          />
        ))}
      </div>
    </section>
  );
}
