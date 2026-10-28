"use client";

// 주요 메뉴 — 폰에서는 아래에 떠 있는 알약 모양 탭, 넓은 화면(PC · 가로 1080px 이상)에서는 위쪽 메뉴 줄.
//
// 폰: 엄지가 닿는 곳은 화면 아래 3분의 1이다. 떠 있는 유리 알약 하나에 다섯 칸을 똑같이 — 지금 칸만 따뜻한 유리 방울과 호박색
//     (리퀴드 글래스, 2026-10-27 저녁~). 내려 읽을 때는 비켜 주고 올리면 돌아온다. 흐림 효과는 이런 떠 있는 층에만 쓴다.
// PC: 같은 링크를 위쪽 한 줄로 — 왼쪽 이름, 오른쪽 메뉴, 끝에 "찍기" 단추. 늘 보이게 둔다. 모양은 globals.css 가 바꾼다.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import Brand from "./Brand";
import { openAccount } from "./AccountDrawer";

// 위스키가 주인공이라(2026-10-27 저녁 사용자 결정) 폰 다섯 칸은 홈 · 위스키 · 찍기 · 내 바 · 내 레시피.
// 레시피(섞어 마시기)는 부(附) — 홈 아래 코너와 위스키 상세에서 들어가고, 자리가 넉넉한 PC 위쪽 메뉴에만 칸을 둔다(wide).
const TABS = [
  { href: "/", label: "홈", icon: "home" },
  { href: "/whiskies", label: "위스키", icon: "rocks", match: /^\/whisk/ },
  { href: "/recipes", label: "레시피", icon: "cocktail", wide: true },
  { href: "/scan", label: "찍기", icon: "camera", primary: true },
  { href: "/bar", label: "내 바", icon: "bar" },
  { href: "/me", label: "내 레시피", icon: "saved", match: /^\/(me|board)/ }, // 레시피 공유방(/board)도 내 레시피 안의 방
];

export default function TabBar() {
  const path = usePathname();
  const [hidden, setHidden] = useState(false);
  const last = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      // 조금 움직인 것에는 반응하지 않는다 — 손가락이 떨릴 때마다 들썩이면 정신없다
      if (Math.abs(y - last.current) < 8) return;
      setHidden(y > last.current && y > 120);
      last.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 페이지를 옮기면 다시 보이게
  useEffect(() => setHidden(false), [path]);

  // 어드민은 손님 앱이 아니라 메뉴를 내린다
  if (path.startsWith("/admin")) return null;
  // 레시피 상세는 아래에 제 버튼 줄(저장 · 만드는 과정 보기)을 붙인다 — 엄지 자리는 하나뿐이다.
  // 시작하기 · 가입 · 회원정보도 제 단추(다음 · 저장)에 집중하게 폰에서는 탭을 내린다(PC 위쪽 메뉴는 그대로 둔다)
  const focus = /^\/(recipes\/[^/]+|login|signup|account)/.test(path);

  return (
    <nav className={`tabbar ${hidden ? "is-hidden" : ""} ${focus ? "is-focus" : ""}`} aria-label="주요 메뉴">
      <Link href="/" className="tabbar-brand" aria-label="Whisky Lens 홈">
        <Brand size={28} />
      </Link>
      {TABS.map((t) => {
        const on = t.match ? t.match.test(path) : t.href === "/" ? path === "/" : path.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`tab ${t.primary ? "tab-primary" : ""} ${t.wide ? "tab-wide" : ""} ${on ? "is-on" : ""}`}
            aria-current={on ? "page" : undefined}
          >
            <span className="tab-icon"><Icon name={t.icon} size={23} /></span>
            <span className="tab-label">{t.label}</span>
          </Link>
        );
      })}
      {/* PC 위쪽 메뉴 끝 — 내 정보 서랍(폰은 홈 오른쪽 위 프로필 단추가 연다) */}
      <button type="button" className="tab tab-acct" onClick={openAccount} aria-label="내 정보">
        <span className="tab-icon"><Icon name="user" size={22} /></span>
      </button>
    </nav>
  );
}
