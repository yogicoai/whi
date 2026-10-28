// 위스키 이름 검색 — 별칭·영문 이름까지. 목록에 쓸 가벼운 모양만 돌려준다.

import { NextResponse } from "next/server";
import { searchWhiskies, brief } from "@/lib/whiskies";

export async function GET(request) {
  const q = new URL(request.url).searchParams.get("q") || "";
  const items = searchWhiskies(q.slice(0, 40), 20).map(brief);
  return NextResponse.json({ items });
}
