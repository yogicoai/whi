// 회원가입 — 가입 정보를 확인해 서버에 남기고, 이 기기에서 쓸 열쇠(token)를 준다(lib/server/members.js).

import { NextResponse } from "next/server";
import { createMember, InputError } from "@/lib/server/members";

export async function POST(request) {
  try {
    const body = await request.json();
    return NextResponse.json(await createMember(body), { status: 201 });
  } catch (e) {
    if (e instanceof InputError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("[members]", e);
    return NextResponse.json({ error: "지금은 가입할 수 없어요. 잠시 뒤 다시 해 주세요" }, { status: 503 });
  }
}
