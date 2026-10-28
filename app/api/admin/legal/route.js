// 어드민 약관 — 판 목록(GET ?kind=terms|privacy|youth) · 새 판 게시(POST { kind, title, body, effectiveDate, note }).
// 게시한 판은 고치거나 지우지 않는다 — 고치려면 새 판을 게시한다. 게시하면 그 문서 화면과 푸터를 새로 그린다.

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { denyUnlessAdmin } from "@/lib/server/admin";
import { LegalInputError, listVersions, publishVersion } from "@/lib/server/legal";
import { kstToday, pickDocs } from "@/lib/legal";

export async function GET(request) {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;
  try {
    const versions = await listVersions(new URL(request.url).searchParams.get("kind"));
    const { current, upcoming } = pickDocs(versions);
    return NextResponse.json({ versions, current: current?.version ?? null, upcoming: upcoming?.version ?? null, today: kstToday() });
  } catch (e) {
    if (e instanceof LegalInputError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("[admin/legal]", e);
    return NextResponse.json({ error: "DB 에 연결할 수 없어요" }, { status: 503 });
  }
}

export async function POST(request) {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;
  try {
    const doc = await publishVersion({ ...(await request.json()), by: process.env.ADMIN_ID || "admin" });
    revalidatePath("/", "layout");
    return NextResponse.json({ doc }, { status: 201 });
  } catch (e) {
    if (e instanceof LegalInputError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("[admin/legal]", e);
    return NextResponse.json({ error: "게시하지 못했어요" }, { status: 500 });
  }
}
