// 홈 인사말 — 시각과 요일로 고른다. 서버(한국 시각으로 미리 그림)와 브라우저(그 사람 시계)가 같이 쓴다.
//
// 서버에서 미리 그려 두는 이유: 화면이 뜬 뒤에 제목 글자가 바뀌면 브라우저는 그때를 "첫 화면이 다 뜬 때"로 센다
// (Lighthouse LCP 6.1초의 원인이었다, 2026-10-27). 홈은 5분마다 새로 그리니 경계 시각(5시 · 17시)에만 브라우저가 고친다.

/** @param {number} h 0~23시 @param {number} day 0(일)~6(토) */
export function greetingAt(h, day) {
  const weekend = [0, 6].includes(day) || (day === 5 && h >= 17);
  if (h < 5) return "늦은 밤, 가볍게 한 잔 어때요?";
  if (h < 17) return weekend ? "주말엔 어떤 한 잔으로 시작할까요?" : "오늘 저녁엔 뭘 섞어 마실까요?";
  return weekend ? "주말 저녁, 오늘의 한 잔은?" : "오늘 저녁엔 뭘 섞어 마실까요?";
}

/** 지금 한국 시각의 인사말 — 서버는 UTC 로 돌 수 있어서 9시간을 더해 읽는다 */
export function greetingKST(now = Date.now()) {
  const kst = new Date(now + 9 * 3600 * 1000);
  return greetingAt(kst.getUTCHours(), kst.getUTCDay());
}
