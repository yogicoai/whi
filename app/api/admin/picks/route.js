// 어드민 실제 제품 추천 — 규칙이 고른 짝 목록과 설정(맨 앞 고정 · 제품 빼기). 바꾸면 손님 화면을 새로 그린다.

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { denyUnlessAdmin } from "@/lib/server/admin";
import { getPickSettings, savePickSettings } from "@/lib/server/settings";
import { productPicks } from "@/lib/picks";
import { getWhisky } from "@/lib/whiskies";

export async function GET() {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;
  const settings = await getPickSettings();
  return NextResponse.json({
    // 빼기 전 목록을 보여 줘야 어드민이 다시 넣을 수 있다
    groups: productPicks({ pinned: settings.pinned, excluded: [] }).map((g) => ({ id: g.id, title: g.title, list: g.list })),
    excludedWhiskies: settings.excluded.map((id) => ({ id, name: getWhisky(id)?.name || id })),
    settings,
  });
}

export async function PUT(request) {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;
  try {
    const { settings } = await request.json();
    const saved = await savePickSettings(settings || {});
    revalidatePath("/", "layout");
    return NextResponse.json({ settings: saved });
  } catch (e) {
    console.error("[admin/picks]", e);
    return NextResponse.json({ error: "저장하지 못했어요" }, { status: 503 });
  }
}
