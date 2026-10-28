// 어드민 로그인 — 마스터 아이디(ADMIN_ID) + 비밀번호(ADMIN_PASSWORD), 2026-10-28 사용자 요청(그 전엔 비밀번호 하나).
// 맞으면 서명한 쿠키(wl_admin)를 12시간 준다. 값은 .env.local(배포하면 Vercel 환경 변수)에만 둔다.
// 쿠키 값은 "만료시각.서명" — 서명은 ADMIN_SECRET 으로 만든 HMAC 이라 고쳐 쓰면 맞지 않는다.

import crypto from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "wl_admin";
const TTL_MS = 12 * 3600 * 1000;

const sign = (value) => crypto.createHmac("sha256", process.env.ADMIN_SECRET || "").update(value).digest("hex");
const same = (a, b) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

export function checkLogin(id, password) {
  const wantId = process.env.ADMIN_ID || "";
  const wantPw = process.env.ADMIN_PASSWORD || "";
  if (!wantId || !wantPw || !process.env.ADMIN_SECRET) return false;
  // 아이디가 틀려도 비밀번호까지 비교한다 — 어느 쪽이 틀렸는지 걸린 시간으로 알 수 없게
  const idOk = same(String(id || "").trim(), wantId);
  const pwOk = same(String(password || ""), wantPw);
  return idOk && pwOk;
}

export function adminCookie() {
  const exp = String(Date.now() + TTL_MS);
  return {
    name: ADMIN_COOKIE,
    value: `${exp}.${sign(exp)}`,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL_MS / 1000,
  };
}

export async function isAdmin() {
  const [exp, sig] = ((await cookies()).get(ADMIN_COOKIE)?.value || "").split(".");
  if (!exp || !sig || !process.env.ADMIN_SECRET || Number(exp) < Date.now()) return false;
  return same(sig, sign(exp));
}

/** 어드민 API 첫 줄 — 로그인 안 했으면 401 응답을 돌려준다(했으면 null) */
export async function denyUnlessAdmin() {
  return (await isAdmin()) ? null : Response.json({ error: "어드민 로그인이 필요해요" }, { status: 401 });
}
