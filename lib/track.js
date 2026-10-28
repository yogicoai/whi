// 이용 기록 보내기 — 저장 · 보내기 · 만들어 봄(app/api/activity → 어드민 대시보드의 숫자).
// 화면을 막지 않게 sendBeacon 으로 보내고, 실패해도 조용히 넘어간다. 회원이면 회원 번호만 붙인다.

import { getMember } from "./member.js";

/** @param {"save"|"send"|"made"} type */
export function track(type, { recipeKey, whiskyId = null }) {
  try {
    const body = JSON.stringify({ type, recipeKey, whiskyId, memberId: getMember()?.id || null });
    if (navigator.sendBeacon?.("/api/activity", new Blob([body], { type: "application/json" }))) return;
    fetch("/api/activity", { method: "POST", body, keepalive: true }).catch(() => {});
  } catch {}
}
