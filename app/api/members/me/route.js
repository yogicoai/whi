// 내 회원정보 — 기기의 열쇠(Authorization: Bearer)로 읽고(GET) · 고치고(PATCH) · 탈퇴한다(DELETE).
// 열쇠가 맞지 않으면(어드민이 지웠거나 탈퇴) 401 — 기기는 로그아웃 상태로 돌아간다.
// 이용 정지(suspended)된 회원은 읽기만 되고 고칠 수 없다.

import { NextResponse } from "next/server";
import { memberByToken, updateSelf, deleteMember, publicMember, tokenFrom, InputError } from "@/lib/server/members";

async function me(request) {
  return memberByToken(tokenFrom(request));
}

const unauthorized = () => NextResponse.json({ error: "다시 로그인해 주세요" }, { status: 401 });
const unavailable = (e) => {
  console.error("[members/me]", e);
  return NextResponse.json({ error: "지금은 서버에 연결할 수 없어요" }, { status: 503 });
};

export async function GET(request) {
  try {
    const m = await me(request);
    return m ? NextResponse.json({ member: publicMember(m) }) : unauthorized();
  } catch (e) {
    return unavailable(e);
  }
}

export async function PATCH(request) {
  try {
    const m = await me(request);
    if (!m) return unauthorized();
    if (m.status === "suspended") return NextResponse.json({ error: "이용이 정지된 계정이에요" }, { status: 403 });
    const updated = await updateSelf(m._id, await request.json());
    return NextResponse.json({ member: publicMember(updated) });
  } catch (e) {
    if (e instanceof InputError) return NextResponse.json({ error: e.message }, { status: 400 });
    return unavailable(e);
  }
}

export async function DELETE(request) {
  try {
    const m = await me(request);
    if (!m) return unauthorized();
    await deleteMember(m._id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return unavailable(e);
  }
}
