// 어드민 사업자 정보 — 읽기(GET: 지금 값 · 기본값 · 바꾼 이력) · 저장(POST: { info, note }). 저장하면 푸터가 있는 화면을 모두 새로 그린다.

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { denyUnlessAdmin } from "@/lib/server/admin";
import { LegalInputError, businessHistory, getBusiness, saveBusiness } from "@/lib/server/legal";
import { BUSINESS_DEFAULTS } from "@/lib/legal";

export async function GET() {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;
  try {
    const [info, history] = await Promise.all([getBusiness(), businessHistory()]);
    return NextResponse.json({ info, defaults: BUSINESS_DEFAULTS, history });
  } catch (e) {
    console.error("[admin/business]", e);
    return NextResponse.json({ error: "DB 에 연결할 수 없어요" }, { status: 503 });
  }
}

export async function POST(request) {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;
  try {
    const { info, note } = await request.json();
    const out = await saveBusiness(info, { note, by: process.env.ADMIN_ID || "admin" });
    if (out.changed.length) revalidatePath("/", "layout");
    return NextResponse.json(out);
  } catch (e) {
    if (e instanceof LegalInputError) return NextResponse.json({ error: e.message, errors: e.errors }, { status: 400 });
    console.error("[admin/business]", e);
    return NextResponse.json({ error: "저장하지 못했어요" }, { status: 500 });
  }
}
