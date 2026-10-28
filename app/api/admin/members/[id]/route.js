// 어드민 회원 한 명 — 이용 정지·해제(PATCH {status}) · 탈퇴 처리(DELETE, 회원정보를 지운다).

import { NextResponse } from "next/server";
import { denyUnlessAdmin } from "@/lib/server/admin";
import { deleteMember, publicMember, setStatus, InputError } from "@/lib/server/members";

export async function PATCH(request, { params }) {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;
  const { id } = await params;
  try {
    const { status } = await request.json();
    const m = await setStatus(id, status);
    return m ? NextResponse.json({ member: publicMember(m) }) : NextResponse.json({ error: "없는 회원이에요" }, { status: 404 });
  } catch (e) {
    if (e instanceof InputError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("[admin/members/id]", e);
    return NextResponse.json({ error: "DB 에 연결할 수 없어요" }, { status: 503 });
  }
}

export async function DELETE(request, { params }) {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;
  const { id } = await params;
  try {
    const { deletedCount } = await deleteMember(id);
    return deletedCount ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "없는 회원이에요" }, { status: 404 });
  } catch (e) {
    console.error("[admin/members/id]", e);
    return NextResponse.json({ error: "DB 에 연결할 수 없어요" }, { status: 503 });
  }
}
