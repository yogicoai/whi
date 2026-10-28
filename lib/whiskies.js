// 위스키 데이터 — data/whiskies.json 을 서버에서 한 번 읽어 쓴다.
//
// 데이터는 scripts/export-whiskies.mjs 가 wine 저장소 DB 에서 뽑아 둔 것이다.
// DB 에 붙지 않으니 화면을 아무리 열어도 원본에 조회수·기록이 쌓이지 않는다.
// 1,165종 · 2.4MB 라 통째로 메모리에 두고 거른다.
//
// 읽을 때 두 가지를 바로잡는다(원본은 wine DB 라 손대지 않는다 — 2026-10-27 데이터 점검):
//  - 술이 아닌 상품(위스키 잔·카라페·훈연 칩·지거·휴대용 병·책·토닉워터 묶음 판매 23개)은 뺀다 — 종류와 도수가 둘 다 비어 있다
//  - 가격대는 데일리샷 가격이 있으면 그것으로 다시 정한다 — wine DB 값이 74종 어긋났다(조니워커 블루 37만원이 "10~30만원")

import fs from "node:fs";
import path from "node:path";
import { mixPlan } from "./mixes.js";
import { COCKTAILS, cocktailFit } from "./cocktails.js";

let cache = null;

/** 가격 → 가격대(lib/look.js PRICE_BANDS — 1 2만원 이하 · 2 2~5만원 · 3 5~10만원 · 4 10~30만원 · 5 30만원 이상) */
const bandOf = (won) => (won <= 20000 ? 1 : won < 50000 ? 2 : won < 100000 ? 3 : won < 300000 ? 4 : 5);

function load() {
  if (cache) return cache;
  const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "whiskies.json"), "utf8"));
  const list = raw.filter((w) => w.type || w.alcohol);
  for (const w of list) {
    if (w.dailyshot?.price) w.priceBand = bandOf(w.dailyshot.price);
    // 레시피 규칙은 결과 객체 모양을 받는다 — 주종만 붙여 넘긴다(가격대를 바로잡은 뒤라야 "귀한 위스키" 안내가 맞게 붙는다)
    w.plan = mixPlan({ ...w, category: "whisky" });
  }
  // 배경을 지운 병 사진(npm run bottles → public/bottles/<id>.webp, 2026-10-28 디자인 A) — 없으면 원래 사진을 쓴다
  const cutsFile = path.join(process.cwd(), "data", "bottles.json");
  const cuts = fs.existsSync(cutsFile) ? JSON.parse(fs.readFileSync(cutsFile, "utf8")) : {};
  for (const w of list) w.cut = cuts[w.id] ? `/bottles/${w.id}.webp` : null;
  cache = { list, byId: new Map(list.map((w) => [w.id, w])) };
  return cache;
}

/** 섞기를 권하지 않는 귀한 위스키 — 10만원 이상이거나 18년 이상 숙성. 홈 인기 위스키 · 레시피별 위스키 · 실제 제품 추천이 함께 뺀다 */
export function precious(w) {
  const age = Number(`${w.name} ${w.aging || ""}`.match(/(\d{1,2})\s*(?:년|yo\b|years?\b)/i)?.[1] || 0);
  return (w.priceBand ?? 0) >= 4 || age >= 18;
}

/** 사과·꿀 맛을 더한 위스키 — 칵테일 추천에서는 뺀다 */
export const flavored = (w) => /가향|플레이버|리큐르/.test(w.type || "");

/** 띄어쓰기·대소문자·기호를 지운 비교용 이름 */
const norm = (s) => String(s || "").toLowerCase().replace(/[^0-9a-z가-힣]/g, "");

export function getWhisky(id) {
  return load().byId.get(id) || null;
}

/** 전체 목록(인기순) — 추천 코너(lib/picks.js)가 거른다 */
export function allWhiskies() {
  return load().list;
}

/** 섞어 마시기 좋은 인기 위스키 — 귀한 위스키는 빼고 인기순 */
export function popularWhiskies(limit = 20) {
  return load().list.filter((w) => w.plan.recipes.length && !precious(w)).slice(0, limit);
}

// ── 둘러보기(위스키 탭 · 홈) — 2026-10-27 저녁 사용자 결정: 주(主)는 다양한 위스키 정보, 섞어 마시는 법은 부(附).
// 종류는 섞는 규칙과 같은 갈래(lib/mixes.js styleOf)를 쓰고, 술을 잘 모르는 사람을 위해 한 줄 풀이를 붙인다.
// en · color 는 홈 종류 카드(디자인 A 컬러 보틀) — 갈래마다 제 색 카드에 대표 병을 얹는다
export const KINDS = [
  { key: "blended", name: "블렌디드", en: "Blended", color: "#f1c36a", note: "여러 원액을 섞어 부드럽고 무난해요" },
  { key: "malt", name: "싱글몰트", en: "Single Malt", color: "#e7d8be", note: "한 증류소의 보리 원액 — 향이 진해요" },
  { key: "american", name: "버번·테네시", en: "Bourbon", color: "#e08a4e", note: "옥수수로 만들어 바닐라처럼 달콤해요" },
  { key: "japanese", name: "재패니즈", en: "Japanese", color: "#ebcfc2", note: "깔끔해서 하이볼로 많이 마셔요" },
  { key: "peated", name: "피트(스모키)", en: "Peated", color: "#aeb5a6", note: "연기·훈연 향이 나요" },
  { key: "irish", name: "아이리시", en: "Irish", color: "#a9cfa9", note: "가볍고 부드러워요" },
  { key: "rye", name: "라이", en: "Rye", color: "#cfae84", note: "호밀로 만들어 알싸해요" },
];
export const kindOf = (w) => KINDS.find((k) => k.key === w.plan?.style) || null;
export const SORTS = { popular: "인기순", rating: "별점순", price: "가격 낮은 순" };
const EASY = 70; // 처음 마시는 사람에게 권하는 정도(beginner 0~100) — 353종

/** 종류 · 가격대 · 처음이라면으로 거르고 정렬 — 사진 있는 것만. 전체 수와 앞에서 limit 개 */
export function browseWhiskies({ kind = null, band = null, easy = false, sort = "popular", limit = 30 } = {}) {
  let list = load().list.filter(
    (w) => w.image && (!kind || w.plan.style === kind) && (!band || w.priceBand === band) && (!easy || (w.beginner ?? 0) >= EASY)
  );
  if (sort === "rating") {
    // 후기가 적으면 별점이 흔들린다 — 30개 이상만
    list = list
      .filter((w) => (w.dailyshot?.reviews ?? 0) >= 30 && w.dailyshot?.rating)
      .sort((a, b) => b.dailyshot.rating - a.dailyshot.rating || b.dailyshot.reviews - a.dailyshot.reviews);
  } else if (sort === "price") {
    list = list.filter((w) => w.dailyshot?.price).sort((a, b) => a.dailyshot.price - b.dailyshot.price);
  }
  return { total: list.length, items: list.slice(0, limit) };
}

/** 갈래마다 몇 종인지 — 홈 "종류로 둘러보기" */
export function kindCounts() {
  const counts = Object.fromEntries(KINDS.map((k) => [k.key, 0]));
  for (const w of load().list) if (w.image && w.plan.style in counts) counts[w.plan.style]++;
  return counts;
}

/** 갈래마다 대표 병 — 배경을 지운 사진이 있는 것 중 후기가 가장 많은 것(맛을 더한 위스키 빼고). 홈 종류 카드 */
export function kindFaces() {
  const out = {};
  for (const w of load().list) {
    if (!w.cut || flavored(w) || out[w.plan.style]) continue;
    out[w.plan.style] = w.cut;
  }
  return out;
}

/** 오늘의 위스키(홈 첫 화면) — 후기 100개 넘는 인기 위스키(귀한 것 빼고, 사진 있는 것) 30종을 한국 날짜로 하루에 하나씩 */
export function todayWhisky() {
  const pool = load()
    .list.filter((w) => w.image && w.plan.recipes.length && !precious(w) && (w.dailyshot?.reviews ?? 0) >= 100)
    .slice(0, 30);
  return pool.length ? pool[Math.floor((Date.now() + 9 * 3600e3) / 86400e3) % pool.length] : null;
}

/** 이름(별칭·영문 포함)으로 찾기 — 앞에서 맞는 것을 먼저, 그 안에서 기본 제품을 먼저, 그다음 인기순.
 *  "잭다니엘"이면 잭 다니엘 테네시가 잭다니엘 애플(맛을 더한 것) · 맥라렌 에디션(한정판)보다 앞에 온다 */
export function searchWhiskies(q, limit = 20) {
  const key = norm(q);
  if (!key) return [];
  const scored = [];
  for (const w of load().list) {
    const names = [w.name, w.nameEn, ...(w.aliases || [])].map(norm);
    const starts = names.some((n) => n.startsWith(key));
    if (!starts && !names.some((n) => n.includes(key))) continue;
    const variant = flavored(w) || /에디션|edition|한정|리미티드|limited/i.test(w.name);
    scored.push({ w, s: (starts ? 2e6 : 0) + (variant ? 0 : 1e6) + w.popularity });
  }
  return scored.sort((a, b) => b.s - a.s).slice(0, limit).map((x) => x.w);
}

/** 이 레시피에 잘 맞는 위스키 — 귀한 위스키는 빼고, 잘 맞는 순서 → 인기순 */
export function whiskiesForRecipe(key, limit = 12) {
  const list = load().list.filter((w) => !precious(w));
  if (Object.hasOwn(COCKTAILS, key)) {
    // 칵테일은 위스키 갈래로 고른다 — 잘 맞는(2 이상) 것을 점수순, 같으면 인기순(목록이 이미 인기순이다). 맛을 더한 위스키는 뺀다
    return list
      .filter((w) => !flavored(w))
      .map((w) => ({ w, s: cocktailFit(key, w.plan.style) }))
      .filter((x) => x.s >= 2)
      .sort((a, b) => b.s - a.s)
      .slice(0, limit)
      .map((x) => x.w);
  }
  // 하이볼류 — 그 위스키의 추천 앞자리(1~3위)에 이 레시피가 든 것 먼저, 그다음 이 레시피 점수가 높은 것.
  // 유자·매실·사이다·녹차는 어느 위스키에서도 앞자리에 들지 않아 목록이 비었었다(2026-10-27 점검)
  return list
    .map((w) => ({ w, i: w.plan.recipes.findIndex((r) => r.key === key) }))
    .filter((x) => x.i >= 0)
    .map(({ w, i }) => ({ w, top: i < w.plan.picks ? 1 : 0, s: w.plan.recipes[i].score }))
    .sort((a, b) => b.top - a.top || b.s - a.s)
    .slice(0, limit)
    .map((x) => x.w);
}

/** 이름으로 정확히 하나 — 비슷한 위스키 칩을 우리 데이터에 잇는 데 쓴다 */
export function findByName(name) {
  const key = norm(name);
  return load().list.find((w) => [w.name, ...(w.aliases || [])].some((n) => norm(n) === key)) || null;
}

/** 화면에 넘길 가벼운 모양 — 목록·검색 결과용 */
export function brief(w) {
  return {
    id: w.id,
    name: w.name,
    type: w.type,
    country: w.country,
    image: w.image,
    cut: w.cut,
    alcohol: w.alcohol,
    aging: w.aging,
    priceBand: w.priceBand,
    liquidColor: w.liquidColor,
    popularity: w.popularity,
    kind: w.plan.style,
    rating: w.dailyshot?.rating ?? null,
    reviews: w.dailyshot?.reviews ?? 0,
    // 내 바에서 "이 위스키로 만들 수 있는 것"을 브라우저에서 다시 고를 수 있게 규칙에 필요한 칸을 함께 준다
    tasteProfile: (w.tasteProfile || []).filter((a) => a.axis === "피트"),
    top: w.plan.recipes.slice(0, w.plan.picks).map((r) => ({ key: r.key, name: r.name })),
  };
}
