// 레시피 공유 주소 — 레시피 하나를 주소에 다 담는다. 서버에는 아무것도 남기지 않는다(회원 기능 전 1단계).
//
//   /recipes/<레시피>?w=위스키 · r=비율(칵테일은 맛 조절 이름) · s=위스키 양 · n=이름 · m=한 줄 메모 · by=보낸 사람
//
// 받은 사람이 열면 같은 비율·양으로 열리고, 위에 "○○님의 레시피" 띠가 붙는다.
// 이름·메모는 화면과 카톡 미리보기 카드에 그대로 찍힌다 — 길이만 자르고, 글자 처리는 React·next/og 가 한다.
// 서버(페이지·카드 이미지)와 브라우저(공유 판) 양쪽에서 쓴다.

export const LIMITS = { n: 20, m: 60, by: 12 };

const first = (v) => (Array.isArray(v) ? v[0] : v);
const clean = (v, max) => String(first(v) ?? "").replace(/\s+/g, " ").trim().slice(0, max);

/** 주소 뒤에 붙일 것 — 빈 칸은 뺀다 */
export function shareQuery({ whiskyId, ratio, shot, name, memo, by, mine }) {
  const q = new URLSearchParams();
  if (whiskyId) q.set("w", whiskyId);
  if (ratio != null && ratio !== "") q.set("r", String(ratio));
  if (shot) q.set("s", String(shot));
  const n = clean(name, LIMITS.n);
  const m = clean(memo, LIMITS.m);
  const b = clean(by, LIMITS.by);
  if (n) q.set("n", n);
  if (m) q.set("m", m);
  if (b) q.set("by", b);
  if (mine) q.set("from", "me");
  return q.toString();
}

/**
 * 주소에서 공유 정보 읽기 — 이름·메모·보낸 사람이 하나도 없으면 null.
 * @param {URLSearchParams|object} sp  브라우저의 URLSearchParams 나 Next 의 searchParams 객체
 */
export function readShared(sp) {
  const get = (k) => (typeof sp?.get === "function" ? sp.get(k) : sp?.[k]);
  const name = clean(get("n"), LIMITS.n);
  const memo = clean(get("m"), LIMITS.m);
  const by = clean(get("by"), LIMITS.by);
  if (!name && !memo && !by) return null;
  return { name, memo, by, mine: first(get("from")) === "me" };
}

/** 띠에 적을 말 — 내가 저장한 것 · 누가 보낸 것 · 보낸 사람을 모르는 것 */
export function sharedLabel(shared) {
  if (shared.mine) return "내 레시피";
  return shared.by ? `${shared.by}님의 레시피` : "받은 레시피";
}
