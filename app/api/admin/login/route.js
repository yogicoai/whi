// 어드민 로그인 상태(GET) · 로그인(POST: 아이디 · 비밀번호 → 쿠키) · 로그아웃(DELETE: 쿠키 지움).
// 아이디 · 비밀번호는 .env.local 의 ADMIN_ID · ADMIN_PASSWORD.

import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminCookie, checkLogin, isAdmin } from "@/lib/server/admin";

export async function GET() {
  // 들어와 있으면 머리 줄에 보일 아이디도 준다(로그인 전에는 주지 않는다)
  const admin = await isAdmin();
  return NextResponse.json(admin ? { admin, id: process.env.ADMIN_ID || "" } : { admin });
}

export async function POST(request) {
  const { id, password } = await request.json().catch(() => ({}));
  if (!checkLogin(id, password)) {
    await new Promise((r) => setTimeout(r, 600)); // 마구 넣어 보기를 늦춘다
    return NextResponse.json({ error: "아이디나 비밀번호가 맞지 않아요" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  const { name, value, ...options } = adminCookie();
  res.cookies.set(name, value, options);
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
