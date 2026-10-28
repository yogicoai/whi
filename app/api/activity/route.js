// 이용 기록 받기 — 저장 · 보내기 · 만들어 봄(lib/track.js 가 sendBeacon 으로 보낸다).
// 실패해도 손님 화면에는 아무 영향이 없어야 해서 늘 204 를 돌려준다.

import { record } from "@/lib/server/activity";

export async function POST(request) {
  try {
    await record(JSON.parse(await request.text()));
  } catch (e) {
    console.error("[activity]", e.message);
  }
  return new Response(null, { status: 204 });
}
