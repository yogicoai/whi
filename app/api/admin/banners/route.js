// 어드민 공지·배너 — 목록(GET) · 만들기(POST). 바꾸면 홈을 새로 그린다.

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { denyUnlessAdmin } from "@/lib/server/admin";
import { createBanner, listBanners } from "@/lib/server/settings";

export async function GET() {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;
  try {
    return NextResponse.json({ banners: await listBanners() });
  } catch (e) {
    console.error("[admin/banners]", e);
    return NextResponse.json({ error: "DB 에 연결할 수 없어요" }, { status: 503 });
  }
}

export async function POST(request) {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;
  try {
    const banner = await createBanner(await request.json());
    revalidatePath("/");
    return NextResponse.json({ banner }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message || "저장하지 못했어요" }, { status: 400 });
  }
}
