// 어드민 대시보드 숫자 — 회원 · 이용 기록 · 최근 14일 · 인기 레시피와 제품(lib/server/activity.js).

import { NextResponse } from "next/server";
import { denyUnlessAdmin } from "@/lib/server/admin";
import { dashboard } from "@/lib/server/activity";

export async function GET() {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;
  try {
    return NextResponse.json(await dashboard());
  } catch (e) {
    console.error("[admin/dashboard]", e);
    return NextResponse.json({ error: "DB 에 연결할 수 없어요" }, { status: 503 });
  }
}
