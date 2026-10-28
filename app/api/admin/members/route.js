// 어드민 회원 목록 — ?q=닉네임 · ?status=active|suspended

import { NextResponse } from "next/server";
import { denyUnlessAdmin } from "@/lib/server/admin";
import { listMembers } from "@/lib/server/members";

export async function GET(request) {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;
  const sp = new URL(request.url).searchParams;
  try {
    return NextResponse.json(await listMembers({ q: sp.get("q") || "", status: sp.get("status") || "" }));
  } catch (e) {
    console.error("[admin/members]", e);
    return NextResponse.json({ error: "DB 에 연결할 수 없어요" }, { status: 503 });
  }
}
