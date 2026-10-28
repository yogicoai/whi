// 칵테일과 따뜻한 한 잔 — 올드패션드 · 위스키 사워 · 갓파더 · 핫 토디.
//
// 하이볼류(lib/mixes.js)는 "위스키 + 믹서 + 맛 더하기 하나"를 비율로 섞는다. 칵테일은 그 틀에 맞지 않는다 —
// 재료가 셋 이상이고, 잔(온더록 잔·머그)과 섞는 법(저어서·흔들어서·뜨겁게)이 다르다.
// lib/mixes.js 는 wine 저장소와 같은 파일이라 여기 따로 둔다. 거기에 넣으면 와인 쪽 결과 화면의
// 하이볼 잔 그림이 모르는 레시피를 만나 깨진다.
//
// 양은 레시피마다 기준 위스키 양(shot)에 맞춰 적었고, 위스키 양을 바꾸면 같은 비율로 늘고 준다.
// 하이볼의 농도(1 : 2 · 1 : 3 · 1 : 4) 자리에는 맛 조절(덜 달게 · 기본 · 달게)이 온다.

import { RECIPES, SHOTS, mixPlan, abvOf } from "./mixes.js";

/** 칵테일에만 드는 재료 — 내 바에서 고른다. 레몬즙은 하이볼의 맛 더하기(레몬즙)를 함께 쓴다. */
export const EXTRAS = {
  sugar: { name: "설탕" },
  bitters: { name: "비터스" },
  amaretto: { name: "아마레토" },
  honey: { name: "꿀" },
};

// 저으면서·흔들면서 녹아 드는 얼음물 — 칵테일 맛의 일부라 완성 도수에 넣는다.
// 큰 얼음에 몇 번 젓는 것(build)이 가장 적고, 셰이커에서 세게 흔드는 것이 가장 많다.
const DILUTION = { build: 0.12, stir: 0.2, shake: 0.25, hot: 0 };

const SYRUP = { id: "syrup", name: "설탕 시럽", short: "시럽", needs: "sugar", color: "#f3ead2", clear: true, opacity: 0.5 };
const LEMON = { id: "lemon", name: "레몬즙", short: "레몬", needs: "lemon", color: "#f3e7a1", opacity: 0.85 };

/**
 * parts 의 ml 은 기준 위스키 양(shot)일 때의 양이다. dash 는 병을 한 번 톡 털어 나오는 양(1ml 남짓)을 센다.
 * variants 의 set 은 그 맛에서 바뀌는 재료의 양이다. steps 의 {w} 는 위스키 ml, {재료 id} 는 그 재료의 양.
 * act 는 잔 그림이 무엇을 보여 줄지 정한다(components/CocktailGlass.js).
 */
export const COCKTAILS = {
  oldfashioned: {
    key: "oldfashioned",
    kind: "cocktail",
    name: "올드패션드",
    glass: "rocks",
    ice: "big",
    method: "stir",
    tag: "저어서",
    shot: 60,
    parts: [
      { ...SYRUP, ml: 10 },
      { id: "bitters", name: "비터스", short: "비터스", needs: "bitters", dash: 2, abv: 44, color: "#7a1f12", opacity: 0.9 },
    ],
    variantLabel: "단맛",
    variants: [
      { key: "dry", label: "덜 달게", set: { syrup: 5 } },
      { key: "base", label: "기본", set: {} },
      { key: "sweet", label: "달게", set: { syrup: 15 } },
    ],
    steps: [
      { act: "pour", parts: ["syrup", "bitters"], text: "잔에 설탕 시럽 {syrup}ml와 비터스 {bitters}대시를 넣습니다" },
      { act: "pour", parts: ["whisky"], text: "위스키 {w}ml를 붓습니다" },
      { act: "ice", text: "큰 얼음 하나를 넣습니다 — 없으면 얼음을 가득" },
      { act: "stir", text: "바스푼으로 20~30번 천천히 저어 차갑게 식힙니다. 녹아 든 물도 맛의 일부예요" },
      { act: "garnish", text: "오렌지 껍질을 잔 위에서 비틀어 향을 뿌리고 잔에 걸칩니다" },
    ],
    garnish: "orange",
    why: "위스키에 단맛 조금, 쓴맛 한 방울 — 가장 오래된 위스키 칵테일",
    tip: "비터스는 약초로 만든 쓴 향료예요. 1대시는 병을 한 번 톡 털어 나오는 양입니다. 설탕 시럽은 설탕과 뜨거운 물을 1 : 1 로 녹여 식히면 됩니다.",
  },
  sour: {
    key: "sour",
    kind: "cocktail",
    name: "위스키 사워",
    glass: "rocks",
    ice: "cubes",
    method: "shake",
    tag: "흔들어서",
    shot: 45,
    parts: [
      { ...LEMON, ml: 20 },
      { ...SYRUP, ml: 15 },
    ],
    variantLabel: "맛",
    variants: [
      { key: "tart", label: "새콤하게", set: { syrup: 10 } },
      { key: "base", label: "기본", set: {} },
      { key: "sweet", label: "달게", set: { lemon: 15, syrup: 20 } },
    ],
    steps: [
      { act: "ice", text: "잔에 얼음을 채워 둡니다" },
      { act: "shaker", parts: ["whisky", "lemon", "syrup"], text: "셰이커에 위스키 {w}ml, 레몬즙 {lemon}ml, 설탕 시럽 {syrup}ml를 넣습니다" },
      { act: "shake", text: "얼음을 가득 넣고 뚜껑을 꼭 닫아 15초쯤 세게 흔듭니다" },
      { act: "strain", text: "셰이커 속 얼음은 두고 술만 잔에 걸러 붓습니다" },
      { act: "garnish", text: "레몬 한 조각을 걸칩니다 (선택)" },
    ],
    garnish: "lemon",
    why: "레몬의 신맛과 시럽의 단맛 — 버번으로 만드는 것이 정석",
    tip: "셰이커가 없으면 뚜껑 있는 텀블러나 잼병으로 흔들어도 됩니다. 달걀 흰자 하나를 넣고 얼음 없이 먼저 흔든 뒤 얼음과 다시 흔들면 위에 하얀 거품이 올라옵니다.",
  },
  godfather: {
    key: "godfather",
    kind: "cocktail",
    name: "갓파더",
    glass: "rocks",
    ice: "big",
    method: "build",
    tag: "저어서",
    shot: 45,
    parts: [{ id: "amaretto", name: "아마레토", short: "아마레토", needs: "amaretto", ml: 15, abv: 28, color: "#b8652a", opacity: 0.85 }],
    variantLabel: "단맛",
    variants: [
      { key: "dry", label: "드라이", set: { amaretto: 10 } },
      { key: "base", label: "기본", set: {} },
      { key: "sweet", label: "달게", set: { amaretto: 25 } },
    ],
    steps: [
      { act: "ice", text: "잔에 큰 얼음을 넣습니다 — 없으면 얼음을 가득" },
      { act: "pour", parts: ["whisky"], text: "위스키 {w}ml를 붓습니다" },
      { act: "pour", parts: ["amaretto"], text: "아마레토 {amaretto}ml를 붓습니다" },
      { act: "stir", text: "열 번쯤 저어 섞습니다" },
    ],
    garnish: "none",
    why: "아몬드 향 리큐르 한 스푼 — 재료 두 가지로 끝나는 칵테일",
    tip: "아마레토는 살구씨로 아몬드 향을 낸 달콤한 이탈리아 술(도수 28% 안팎)이에요. 위스키 대신 보드카를 쓰면 '갓마더'가 됩니다.",
  },
  hottoddy: {
    key: "hottoddy",
    kind: "cocktail",
    name: "핫 토디",
    glass: "mug",
    method: "hot",
    tag: "따뜻하게",
    shot: 30,
    parts: [
      { id: "honey", name: "꿀", short: "꿀", needs: "honey", ml: 15, color: "#e0a526", opacity: 0.92 },
      { id: "water", name: "뜨거운 물", short: "물", ml: 150, color: "#e4f1f4", clear: true, opacity: 0.18 },
      { ...LEMON, ml: 10, optional: true },
    ],
    variantLabel: "농도",
    variants: [
      { key: "strong", label: "진하게", set: { water: 100 } },
      { key: "base", label: "보통", set: {} },
      { key: "light", label: "연하게", set: { water: 200 } },
    ],
    steps: [
      { act: "warm", text: "머그에 뜨거운 물을 부어 데운 뒤 따라 버립니다" },
      { act: "pour", parts: ["honey"], text: "꿀 {honey}ml를 넣습니다 — 밥숟가락 하나가 10ml쯤이에요" },
      { act: "pour", parts: ["whisky"], text: "위스키 {w}ml를 붓습니다" },
      { act: "pour", parts: ["water"], text: "끓고 1~2분 식힌 물 {water}ml를 붓습니다" },
      { act: "stir", text: "꿀이 다 녹을 때까지 저어 줍니다" },
      { act: "garnish", parts: ["lemon"], text: "레몬즙 {lemon}ml를 넣거나 레몬 한 조각을 띄웁니다 (선택)" },
    ],
    garnish: "lemon",
    why: "꿀과 레몬을 탄 따뜻한 위스키 — 쌀쌀한 밤에 몸을 녹이는 한 잔",
    tip: "물이 너무 뜨거우면 위스키 향이 날아갑니다. 끓은 물을 조금 식혀(80도쯤) 쓰세요. 계피 스틱이나 정향을 넣으면 더 향긋해집니다.",
  },
};

/** 레시피 열쇠 하나로 하이볼류든 칵테일이든 — 주소에서 온 값이라 제 것인지 확인한다("constructor" 같은 것) */
export function recipeOf(key) {
  if (Object.hasOwn(RECIPES, key)) return RECIPES[key];
  if (Object.hasOwn(COCKTAILS, key)) return COCKTAILS[key];
  return null;
}

export const isCocktail = (recipe) => recipe?.kind === "cocktail";

export const variantOf = (c, key) => c.variants.find((v) => v.key === key) || c.variants.find((v) => v.key === "base");

/** 내 바에 있어야 만들 수 있는 재료 — (선택) 재료는 없어도 된다 */
export const needsOf = (c) => c.parts.filter((p) => p.needs && !p.optional).map((p) => p.needs);

// 위스키 갈래별로 어울리는 정도 — lib/mixes.js 의 FIT 과 같은 눈금(0 권하지 않음 · 3 가장 잘 맞음).
// 올드패션드·위스키 사워는 버번·라이로 만드는 것이 정석이고, 갓파더는 스카치(블렌디드)가 원래다.
// 피트 위스키는 레몬·시럽과 부딪혀 사워에는 권하지 않는다.
const FIT = {
  oldfashioned: { american: 3, rye: 3, blended: 1, malt: 1, irish: 1, japanese: 1, peated: 1 },
  sour: { american: 3, rye: 2, irish: 2, blended: 2, japanese: 1, malt: 1 },
  godfather: { blended: 3, malt: 2, american: 2, japanese: 1, irish: 1, peated: 1 },
  hottoddy: { blended: 3, irish: 3, american: 2, malt: 2, rye: 1, japanese: 1, peated: 1 },
};

export const cocktailFit = (key, style) => (style ? FIT[key]?.[style] ?? 0 : 0);

/** 숙성 연수 — lib/mixes.js 의 것과 같다(공유 파일이라 그쪽에 내보내기를 더하지 않았다) */
function ageOf(w) {
  const m = `${w.name || ""} ${w.aging || ""}`.match(/(\d{1,2})\s*(?:년|yo\b|years?\b)/i);
  return m ? Number(m[1]) : null;
}

/**
 * 이 위스키로 만들 칵테일.
 * @returns {{list: object[], style: string|null, abv: number, strong: boolean, notes: string[]}}
 *   list 는 어울리는 순서다(score 0 은 뺀다).
 */
export function cocktailPlan(w) {
  // 갈래는 하이볼 규칙과 같은 것을 쓴다 — 캔 하이볼(RTD)은 여기서 갈래가 없어 칵테일도 없다
  const { style } = mixPlan({ ...w, category: "whisky" });
  const abv = abvOf(w);
  const strong = (abv ?? 0) >= 52 || /캐스크\s*스트렝스|cask strength/i.test(String(w.type || ""));
  const age = ageOf(w);
  const notes = [];
  if ((age != null && age >= 18) || w.priceBand >= 5) {
    notes.push("숙성이 길고 귀한 위스키입니다. 칵테일로 만들기 전에 니트로 한 모금 먼저 맛보길 권합니다.");
  }
  if (strong) {
    notes.push(`도수가 ${abv ?? "높은"}${abv ? "%로" : ""} 높아 완성 도수도 높습니다. 위스키 양을 한 단계 줄여 두었어요.`);
  }
  const list = Object.values(COCKTAILS)
    .map((c, i) => ({ ...c, score: cocktailFit(c.key, style), order: i }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score || a.order - b.order);
  return { list, style, abv: abv ?? 40, strong, notes };
}

/** 처음 고를 위스키 양 — 도수가 높은 위스키면 한 단계 적게 */
export function startShot(c, plan) {
  if (!plan?.strong) return c.shot;
  const i = SHOTS.findIndex((s) => s.ml === c.shot);
  return SHOTS[Math.max(0, i - 1)].ml;
}

/** 5ml 단위로 — 계량스푼으로 잴 수 있는 양만 말한다(lib/mixes.js 와 같은 규칙) */
const round5 = (n) => Math.max(5, Math.round(n / 5) * 5);

/**
 * 한 잔에 들어가는 양과 완성 도수. 완성 도수는 저으면서·흔들면서 녹아 든 물까지 넣은 대략 값이다.
 * @returns {{whisky: number, parts: object[], dilution: number, total: number, abv: number}}
 *   parts 는 재료마다 amount(화면에 적을 수)·unit(ml 또는 대시)·ml(부피)를 더한 것.
 */
export function cocktailAmounts(c, { shot, variant, abv = 40 }) {
  const v = variantOf(c, variant);
  const k = shot / c.shot;
  const parts = c.parts.map((p) => {
    if (p.dash) {
      const n = Math.max(1, Math.round(p.dash * k));
      return { ...p, amount: n, unit: "대시", ml: n * 0.8 };
    }
    const ml = round5((v.set[p.id] ?? p.ml) * k);
    return { ...p, amount: ml, unit: "ml", ml };
  });
  const liquid = shot + parts.reduce((s, p) => s + p.ml, 0);
  const dilution = Math.round(liquid * DILUTION[c.method]);
  const total = liquid + dilution;
  const alcohol = abv * shot + parts.reduce((s, p) => s + (p.abv || 0) * p.ml, 0);
  return { whisky: shot, parts, dilution, total, abv: Math.round((alcohol / total) * 10) / 10 };
}

/** 맛 조절 단추 밑에 적을 말 — 그 단추가 바꾸는 재료의 양 ("시럽 5 · 레몬 20") */
export function variantHint(c, variant, shot) {
  const ids = [...new Set(c.variants.flatMap((v) => Object.keys(v.set)))];
  const { parts } = cocktailAmounts(c, { shot, variant });
  return ids
    .map((id) => parts.find((p) => p.id === id))
    .map((p) => `${p.short} ${p.amount}`)
    .join(" · ");
}
