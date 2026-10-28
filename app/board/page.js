// 레시피 공유방(게시판) — 회원이 올린 "나만의 제조법"(위스키 · 섞는 재료 · 비율 · 사진 · 만드는 법). 2026-10-28 사용자: 소통 요소.
// 내 레시피 탭 안의 방이다(위 두 칸 BoardTabs). 최신순 · 좋아요순. 글은 lib/server/board.js, 올리기는 /board/new.
import Link from "next/link";
import BoardTabs from "@/components/BoardTabs";
import PostCard from "@/components/PostCard";
import Icon from "@/components/Icon";
import { listPosts, publicPost } from "@/lib/server/board";

export const metadata = { title: "레시피 공유방 — Whisky Lens" };
export const revalidate = 60;

export default async function BoardPage({ searchParams }) {
  const sort = (await searchParams)?.sort === "like" ? "like" : "new";
  let data = { total: 0, items: [] };
  let failed = false;
  try {
    data = await listPosts({ sort, limit: 48 });
  } catch (e) {
    console.error("[board page]", e.message);
    failed = true;
  }
  return (
    <main className="page page-narrow page-board">
      <h1 className="display">내 레시피</h1>
      <BoardTabs on="board" />
      <div className="board-head">
        <p className="lead">나만의 비율과 만드는 법을 나눠요.<br />위스키에 무엇을 얼마나 섞었는지 사진과 함께 올려 보세요.</p>
        <Link href="/board/new" className="btn-primary board-write"><Icon name="plus" size={18} />레시피 올리기</Link>
      </div>
      <div className="chips board-sort">
        <Link href="/board" className={`chip ${sort === "new" ? "is-on" : ""}`}>최신순</Link>
        <Link href="/board?sort=like" className={`chip ${sort === "like" ? "is-on" : ""}`}>좋아요순</Link>
        <span className="board-count">{data.total.toLocaleString()}개</span>
      </div>
      {failed ? (
        <p className="note warn">지금은 불러올 수 없어요. 잠시 뒤 다시 열어 주세요.</p>
      ) : data.items.length ? (
        <div className="board-grid">{data.items.map((p) => <PostCard key={p._id} p={publicPost(p)} />)}</div>
      ) : (
        <div className="panel board-empty">
          <strong>아직 올라온 레시피가 없어요</strong>
          <p className="note">첫 번째로 나만의 한 잔을 올려 보세요.</p>
          <Link href="/board/new" className="btn-primary">레시피 올리기</Link>
        </div>
      )}
    </main>
  );
}
