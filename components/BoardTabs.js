// 내 레시피 위 두 칸 — 레시피 공유방(/board) · 저장한 레시피(/me). 2026-10-28 사용자: "내 레시피 안에 레시피 공유방 같은 게시판 방이 하나"
import Link from "next/link";

export default function BoardTabs({ on }) {
  return (
    <nav className="board-tabs" aria-label="내 레시피">
      <Link href="/board" className={on === "board" ? "is-on" : ""} aria-current={on === "board" ? "page" : undefined}>레시피 공유방</Link>
      <Link href="/me" className={on === "me" ? "is-on" : ""} aria-current={on === "me" ? "page" : undefined}>저장한 레시피</Link>
    </nav>
  );
}
