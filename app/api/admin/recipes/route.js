// 어드민 레시피 설정 — 노출/숨김 · 순서 · 한 줄 설명 · 팁. 바꾸면 손님 화면을 새로 그린다.

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { denyUnlessAdmin } from "@/lib/server/admin";
import { getRecipeSettings, saveRecipeSettings } from "@/lib/server/settings";
import { RECIPES } from "@/lib/mixes";
import { COCKTAILS } from "@/lib/cocktails";
import { POPULAR_ORDER } from "@/lib/look";

const ALL = [...POPULAR_ORDER.map((k) => RECIPES[k]), ...Object.values(COCKTAILS)];

export async function GET() {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;
  return NextResponse.json({
    recipes: ALL.map((r) => ({ key: r.key, name: r.name, group: r.kind === "cocktail" ? (r.method === "hot" ? "따뜻한 한 잔" : "칵테일") : "섞어 마시기", why: r.why, tip: r.tip })),
    settings: await getRecipeSettings(),
  });
}

export async function PUT(request) {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;
  try {
    const { settings } = await request.json();
    const saved = await saveRecipeSettings(settings);
    revalidatePath("/", "layout");
    return NextResponse.json({ settings: saved });
  } catch (e) {
    console.error("[admin/recipes]", e);
    return NextResponse.json({ error: "저장하지 못했어요" }, { status: 503 });
  }
}
