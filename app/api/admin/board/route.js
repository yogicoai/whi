// 어드민 모두의 레시피 — 목록(GET, 숨긴 글 포함) · 숨기기/다시 보이기(PATCH {id, status}) · 지우기(DELETE ?id=, 사진 포함).

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { denyUnlessAdmin } from "@/lib/server/admin";
import { adminListPosts, deletePost, setPostStatus, BoardInputError } from "@/lib/server/board";

const refresh = (id) => {
  revalidatePath("/board");
  revalidatePath(`/board/${id}`);
  revalidatePath("/");
};

export async function GET(request) {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;
  const sp = new URL(request.url).searchParams;
  try {
    return NextResponse.json(await adminListPosts({ status: sp.get("status") || "", q: sp.get("q") || "" }));
  } catch (e) {
    console.error("[admin/board]", e);
    return NextResponse.json({ error: "DB 에 연결할 수 없어요" }, { status: 503 });
  }
}

export async function PATCH(request) {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;
  try {
    const { id, status } = await request.json();
    const p = await setPostStatus(String(id), status);
    if (!p) return NextResponse.json({ error: "없는 글이에요" }, { status: 404 });
    refresh(p._id);
    return NextResponse.json({ ok: true, status: p.status });
  } catch (e) {
    if (e instanceof BoardInputError) return NextResponse.json({ error: e.message }, { status: 400 });
    return NextResponse.json({ error: "바꾸지 못했어요" }, { status: 503 });
  }
}

export async function DELETE(request) {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;
  const id = new URL(request.url).searchParams.get("id") || "";
  try {
    if (!(await deletePost(id))) return NextResponse.json({ error: "없는 글이에요" }, { status: 404 });
    refresh(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "지우지 못했어요" }, { status: 503 });
  }
}
