// 음료 사진 — 완성 사진(카드·상세·홈·공유 카드)과 만드는 과정 단계 사진(플레이어).
//
// 힉스필드(Nano Banana Pro, 2026-10-27)로 만들었다. 하이볼 첫 장(얼음 잔)을 만든 뒤 나머지는 그 사진을
// 레퍼런스로 넣어 같은 잔·배경·조명·구도로 이었다 — 단계 사진을 넘겨 보면 영상처럼 이어진다.
// 원본(2K PNG)은 docs/design/ 아래에 있고, `npm run photos`(scripts/build-photos.mjs)가 줄이고 잘라 public/ 에 둔다.
// 지금은 14종 모두 완성 사진이 있어 플레이어에 잔 그림(components/Glass.js · CocktailGlass.js)이 나올 일은 없다 — 새 레시피를 더할 때의 대신.

// 완성 사진이 있는 레시피 — public/drinks/<키>.jpg(전체) · <키>-c.jpg(잔 쪽으로 자른 것)
const DRINKS = new Set([
  "highball", "lemon", "ginger", "cola", "earlgrey", "tonic", "yuja", "maesil", "cider", "greentea",
  "oldfashioned", "sour", "godfather", "hottoddy",
]);

// 단계 사진이 있는 레시피와 장 수 — public/steps/<키>/<번호>.jpg. 장 수는 그 레시피의 단계 수와 같아야 한다
// (하이볼: 얼음 · 잔 식히기 · 위스키 · 젓기 · 탄산수 · 들어 올리기 · 레몬 껍질)
const STEPS = { highball: 7 };

// 3D 음료 그림(투명 배경) — 시안 B 처럼 판 위에 바로 얹는다. GPT Image 2.5(high, 2026-10-27), 하이볼 그림을
// 레퍼런스로 넣어 같은 결로 맞췄다. 원본 PNG 는 docs/design/drinks3d/, 화면용 WebP 는 public/drinks3d/(npm run photos).
const ARTS = new Set([
  "highball", "lemon", "ginger", "cola", "earlgrey", "tonic", "yuja", "maesil", "cider", "greentea",
  "oldfashioned", "sour", "godfather", "hottoddy",
]);

/** 3D 음료 그림 — 없으면 null(사진 타일로 대신).
 *  size "s"(360px, 기본) 는 카드·목록용, "l"(600px) 은 상세 첫 판처럼 크게 쓰는 곳. 둘 다 `npm run photos` 가 만든다 */
export const drinkArt = (key, size = "s") => (ARTS.has(key) ? `/drinks3d/${key}${size === "l" ? "" : "-s"}.webp` : null);

// 전체 사진(<키>.jpg, 1080px)은 만드는 과정 플레이어의 완성 장면으로 쓴다.

/** 실사 사진(리퀴드 글래스, 2026-10-27 저녁~) — "card" 잔 쪽으로 자른 480px(카드·목록), "hero" 전체 900px(첫 화면),
 *  "hero-l" 1536px(PC 첫 화면). 모두 WebP, `npm run photos` 가 만든다. 없으면 null */
export const drinkPhoto = (key, size = "card") => (DRINKS.has(key) ? `/drinks/${key}-${size}.webp` : null);

/** 첫 화면 사진의 srcSet — 폰은 900px, PC 는 1536px 를 고른다 */
export const heroSrcSet = (key) => (DRINKS.has(key) ? `/drinks/${key}-hero.webp 900w, /drinks/${key}-hero-l.webp 1536w` : undefined);

/** 잔 쪽으로 자른 완성 사진(JPG) — 공유 카드 이미지(/api/card) */
export const drinkCrop = (key) => (DRINKS.has(key) ? `/drinks/${key}-c.jpg` : null);

// 다른 하이볼류가 같이 쓰는 하이볼 단계 사진 — 붓기 전까지는 잔 속이 같다(얼음 · 잔 식히기 · 위스키 · 맛 더하기 · 젓기)
const SHARED = { ice: 1, chill: 2, whisky: 3, addin: 3, stir: 4 };

// 만드는 과정 영상 클립 — public/clips/<키>/<단계 act>.mp4. 힉스필드 이미지→영상(그 단계 사진을 시작 장면으로, 4초),
// ffmpeg 로 작게 다시 눌렀다. 하이볼 것은 다른 하이볼류도 같이 쓴다(잔·구도가 같다).
// 2026-10-27 시험 2개(얼음 · 젓기)를 넣어 봤다가 사용자가 사진 방식으로 되돌리자고 해서 껐다 — 파일은 남겨 두었다.
// 다시 켜려면: const CLIPS = { highball: new Set(["ice", "stir"]) };
const CLIPS = {};
const clipOf = (key, act) => (CLIPS[key]?.has(act) ? `/clips/${key}/${act}.mp4` : null);

// 만드는 과정을 사진으로 보일지 — 2026-10-28 사용자가 "영상 레시피 같은 것보다 예전 잔 그림이 어떻게 만드는지 더 잘 보인다"며
// 잔 그림 방식(얼음 → 위스키 → 탄산수가 차오르고 스푼이 젓는 그림)으로 되돌렸다. 사진·아래 규칙은 남겨 둔다 — true 로 다시 켠다.
const PLAYER_PHOTOS = false;

/**
 * 만드는 과정의 단계마다 보여 줄 사진 — [{ src, from?, top? }] (단계 수만큼), 사진이 없으면 null(잔 그림으로 대신).
 * 모든 사진이 같은 잔·배경·조명·구도라 이어 붙이면 한 장면처럼 보인다(2026-10-27 확인).
 *  - 제 단계 사진이 있으면(하이볼 7장) 그대로
 *  - 다른 하이볼류: 앞 단계는 하이볼 사진을 같이 쓰고, 믹서를 붓는 단계에서 젓기 사진이 그 레시피 완성 사진으로
 *    천천히 바뀐다(from → src). 그다음부터는 완성 사진, 장식 단계는 장식 쪽(top)으로 다가간다
 *  - 칵테일: 잔이 달라 하이볼 사진을 못 쓴다 — 완성 사진 한 장을 단계마다 다른 자리로 다가가며
 * @param {string} key
 * @param {{ act: string }[]} steps
 */
export function stepPhotos(key, steps) {
  if (!PLAYER_PHOTOS) return null;
  if (STEPS[key] === steps.length) return steps.map((s, i) => ({ src: `/steps/${key}/${i + 1}.jpg`, video: clipOf(key, s.act) }));
  if (!DRINKS.has(key)) return null;
  const done = `/drinks/${key}.jpg`;
  if (!steps.some((s) => s.act === "mixer")) return steps.map((s) => ({ src: done, top: s.act === "garnish" }));
  return steps.map((s) => {
    if (SHARED[s.act]) return { src: `/steps/highball/${SHARED[s.act]}.jpg`, video: clipOf("highball", s.act) };
    if (s.act === "mixer") return { from: "/steps/highball/4.jpg", src: done };
    return { src: done, top: s.act === "garnish" };
  });
}
