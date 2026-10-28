// 모두의 레시피(게시판) — 화면과 서버가 같이 쓰는 규칙.
//
// 2026-10-28 사용자: "나만의 제조법을 공유할 공간 — 술과 무엇을 어떤 비율로 섞는지 설정해서 등록하고, 이미지와 레시피를 올리는 게시판".
// 글 하나 = 제목 · 위스키(목록에서 고르거나 직접 쓰기) · 재료 줄(이름 · 양 · 단위, 첫 줄이 위스키) · 만드는 법 · 한마디 · 맛 · 사진 0~3장.
// 쓰기는 회원만(만 19세 확인을 거친 가입자), 읽기는 누구나. 어드민이 숨기거나 지운다. 서버 쪽은 lib/server/board.js.

export const BOARD = {
  title: { min: 2, max: 40 },
  note: 120, // 한마디 — 카드에 한 줄
  steps: 1000, // 만드는 법
  parts: 8, // 재료 줄(위스키 포함)
  partName: 20,
  images: 3,
  imageBytes: 8 * 1024 * 1024, // 한 장(브라우저가 줄여 보낸 뒤) — 넘으면 받지 않는다
  perDay: 10, // 한 회원이 하루에 올릴 수 있는 글
};

/** 양의 단위 — ml 이나 "비율"이면 위스키와 견준 비율을 계산해 보여 준다 */
export const UNITS = ["ml", "비율", "oz", "개", "조각", "조금"];

/** 재료 이름 고르기 도움말 — 직접 써도 된다 */
export const PART_HINTS = ["탄산수", "토닉워터", "콜라", "진저에일", "사이다", "레몬즙", "라임즙", "꿀", "시럽", "오렌지 주스", "커피", "우유", "녹차", "얼음"];

/** 위스키와 견준 비율 — 위스키 줄과 같은 단위(ml · 비율 · oz)인 재료만. "위스키 1 : 탄산수 3 : 레몬즙 0.5" */
export function ratioLine(parts) {
  const [w, ...rest] = parts || [];
  if (!w || !(w.amount > 0) || !["ml", "비율", "oz"].includes(w.unit)) return "";
  const same = rest.filter((p) => p.unit === w.unit && p.amount > 0);
  if (!same.length) return "";
  const r = (n) => String(Math.round((n / w.amount) * 10) / 10);
  return ["위스키 1", ...same.map((p) => `${p.name} ${r(p.amount)}`)].join(" : ");
}

/** 재료 한 줄 글 — "탄산수 135ml", "레몬 1조각", "꿀 조금" */
export function partText(p) {
  if (p.unit === "조금") return `${p.name} 조금`;
  if (!(p.amount > 0)) return p.name;
  const n = Number.isInteger(p.amount) ? p.amount : Math.round(p.amount * 10) / 10;
  return p.unit === "비율" ? `${p.name} ${n}` : `${p.name} ${n}${p.unit}`;
}

/** "3분 전" · "어제" · "10월 27일" */
export function ago(iso, now = Date.now()) {
  const t = new Date(iso).getTime();
  const m = Math.floor((now - t) / 60000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d === 1) return "어제";
  if (d < 7) return `${d}일 전`;
  const k = new Date(t + 9 * 3600e3);
  return `${k.getUTCMonth() + 1}월 ${k.getUTCDate()}일`;
}
