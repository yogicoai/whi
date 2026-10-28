// 좋아요 — 회원만, 한 번 더 누르면 취소.

import { NextResponse } from "next/server";
import { memberByToken, tokenFrom } from "@/lib/server/members";
import { toggleLike } from "@/lib/server/board";

export async function POST(request, { params }) {
  const { id } = await params;
  try {
    const member = await memberByToken(tokenFrom(request));
    if (!member) return NextResponse.json({ error: "회원만 누를 수 있어요" }, { status: 401 });
    const r = await toggleLike(id, member._id);
    return r ? NextResponse.json(r) : NextResponse.json({ error: "없는 글이에요" }, { status: 404 });
  } catch (e) {
    console.error("[board like]", e);
    return NextResponse.json({ error: "잠시 뒤 다시 해 주세요" }, { status: 503 });
  }
}
