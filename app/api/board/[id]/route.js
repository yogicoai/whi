// 모두의 레시피 글 하나 — 읽기(GET, 열쇠가 있으면 내가 좋아요 눌렀는지 · 내 글인지도) · 지우기(DELETE, 쓴 사람만).

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { memberByToken, tokenFrom } from "@/lib/server/members";
import { deletePost, getPost, publicPost } from "@/lib/server/board";

export async function GET(request, { params }) {
  const { id } = await params;
  try {
    const p = await getPost(id);
    if (!p || p.status !== "public") return NextResponse.json({ error: "없는 글이에요" }, { status: 404 });
    const viewer = tokenFrom(request) ? await memberByToken(tokenFrom(request)) : null;
    return NextResponse.json({ post: publicPost(p, viewer?._id) });
  } catch (e) {
    console.error("[board/id GET]", e);
    return NextResponse.json({ error: "지금은 불러올 수 없어요" }, { status: 503 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    const member = await memberByToken(tokenFrom(request));
    if (!member) return NextResponse.json({ error: "다시 로그인해 주세요" }, { status: 401 });
    if (!(await deletePost(id, member._id))) return NextResponse.json({ error: "내가 쓴 글만 지울 수 있어요" }, { status: 403 });
    revalidatePath("/board");
    revalidatePath(`/board/${id}`);
    revalidatePath("/");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[board/id DELETE]", e);
    return NextResponse.json({ error: "지우지 못했어요" }, { status: 503 });
  }
}
