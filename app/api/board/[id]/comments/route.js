// 댓글 — 목록(GET, 누구나 · 열쇠가 있으면 내 댓글 표시) · 달기(POST {text}, 회원) · 지우기(DELETE ?cid=, 쓴 사람).

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { memberByToken, tokenFrom } from "@/lib/server/members";
import { addComment, deleteComment, listComments, publicComment, BoardInputError } from "@/lib/server/board";

export async function GET(request, { params }) {
  const { id } = await params;
  try {
    const viewer = tokenFrom(request) ? await memberByToken(tokenFrom(request)) : null;
    return NextResponse.json({ items: (await listComments(id)).map((c) => publicComment(c, viewer?._id)) });
  } catch (e) {
    console.error("[comments GET]", e);
    return NextResponse.json({ error: "지금은 불러올 수 없어요" }, { status: 503 });
  }
}

export async function POST(request, { params }) {
  const { id } = await params;
  try {
    const member = await memberByToken(tokenFrom(request));
    if (!member) return NextResponse.json({ error: "댓글은 회원만 달 수 있어요" }, { status: 401 });
    if (member.status === "suspended") return NextResponse.json({ error: "이용이 정지된 계정이에요" }, { status: 403 });
    const { text } = await request.json();
    const c = await addComment(id, member, text);
    revalidatePath(`/board/${id}`);
    revalidatePath("/board");
    return NextResponse.json({ comment: publicComment(c, member._id) }, { status: 201 });
  } catch (e) {
    if (e instanceof BoardInputError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("[comments POST]", e);
    return NextResponse.json({ error: "잠시 뒤 다시 해 주세요" }, { status: 503 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    const member = await memberByToken(tokenFrom(request));
    if (!member) return NextResponse.json({ error: "다시 로그인해 주세요" }, { status: 401 });
    const ok = await deleteComment(new URL(request.url).searchParams.get("cid") || "", member._id);
    if (!ok) return NextResponse.json({ error: "내가 쓴 댓글만 지울 수 있어요" }, { status: 403 });
    revalidatePath(`/board/${id}`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "지우지 못했어요" }, { status: 503 });
  }
}
