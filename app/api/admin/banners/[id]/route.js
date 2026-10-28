// 어드민 배너 하나 — 고치기(PATCH) · 지우기(DELETE). 바꾸면 홈을 새로 그린다.

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { denyUnlessAdmin } from "@/lib/server/admin";
import { deleteBanner, updateBanner } from "@/lib/server/settings";

export async function PATCH(request, { params }) {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;
  const { id } = await params;
  try {
    const banner = await updateBanner(id, await request.json());
    revalidatePath("/");
    return banner ? NextResponse.json({ banner }) : NextResponse.json({ error: "없는 배너예요" }, { status: 404 });
  } catch (e) {
    return NextResponse.json({ error: e.message || "저장하지 못했어요" }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;
  const { id } = await params;
  try {
    await deleteBanner(id);
    revalidatePath("/");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message || "지우지 못했어요" }, { status: 400 });
  }
}
