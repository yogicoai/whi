// 음료 사진 만들기 — docs/design 의 2K 원본(PNG)을 화면용 JPG 로 줄이고 잘라 public/ 에 둔다.
//
//   npm run photos
//
//   public/drinks/<키>.jpg      완성 사진 전체(1080px) — 만드는 과정 플레이어의 완성 장면(폰 전체 화면)
//   public/drinks/<키>-c.jpg    잔 쪽으로 자른 것(600px) — 공유 카드 이미지(/api/card)
//   public/drinks/<키>-card.webp 잔 쪽으로 자른 것(480px) — 레시피 카드 · 제품 카드 · 내 레시피(리퀴드 글래스, 2026-10-27 저녁~)
//   public/drinks/<키>-hero.webp · -hero-l.webp 전체 사진 900px · 1536px — 홈 · 레시피 상세 첫 화면(폰 · PC)
//   public/steps/<키>/<n>.jpg   만드는 과정 단계 사진(1080px)
//   public/drinks3d/<키>.webp   3D 음료 그림(투명 배경, 600px) — 상세 첫 판처럼 크게 쓰는 곳
//   public/drinks3d/<키>-s.webp 같은 그림 작은 판(360px) — 카드·목록(폰에서 그림 폭이 120px 안팎이라 이걸로 충분하다)
//
// 원본은 힉스필드에서 받은 것이다(lib/photos.js 참고). 사진을 더하면 lib/photos.js 의 목록도 고친다.
// sharp 는 Next 가 함께 설치하는 것을 쓴다.

import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DESIGN = path.join(ROOT, "docs", "design");
const PUBLIC = path.join(ROOT, "public");

// 잔 모양별 자르는 칸(사진 크기에 대한 비율) — 모든 사진이 같은 구도(잔 가운데, 바닥이 72% 높이)라 잔 모양만 본다
const CROP = {
  tall: { left: 0.14, top: 0.35, width: 0.72, height: 0.53 },
  short: { left: 0.12, top: 0.42, width: 0.76, height: 0.47 },
};
const SHORT = new Set(["oldfashioned", "sour", "godfather", "hottoddy"]);

const jpg = (img) => img.jpeg({ quality: 80, mozjpeg: true });
const kb = (f) => `${Math.round(fs.statSync(f).size / 1024)}KB`;

async function drinks() {
  const dir = path.join(DESIGN, "drinks");
  const out = path.join(PUBLIC, "drinks");
  fs.mkdirSync(out, { recursive: true });
  const keys = [];
  for (const f of fs.readdirSync(dir).filter((f) => /^[a-z]+\.png$/.test(f)).sort()) {
    const key = f.replace(".png", "");
    const src = path.join(dir, f);
    const { width, height } = await sharp(src).metadata();
    const c = CROP[SHORT.has(key) ? "short" : "tall"];
    await jpg(sharp(src).resize(1080)).toFile(path.join(out, `${key}.jpg`));
    const box = { left: Math.round(c.left * width), top: Math.round(c.top * height), width: Math.round(c.width * width), height: Math.round(c.height * height) };
    await jpg(sharp(src).extract(box).resize(600)).toFile(path.join(out, `${key}-c.jpg`));
    // 화면용 WebP — 카드는 잔 쪽으로 자른 480px, 첫 화면은 전체 사진 900px(폰) · 1536px(PC). 화질 72 면 눈으로 구별되지 않는다
    await sharp(src).extract(box).resize(480).webp({ quality: 72 }).toFile(path.join(out, `${key}-card.webp`));
    await sharp(src).resize(900).webp({ quality: 72 }).toFile(path.join(out, `${key}-hero.webp`));
    await sharp(src).resize(1536).webp({ quality: 70 }).toFile(path.join(out, `${key}-hero-l.webp`));
    keys.push(key);
    console.log(`  ${key}: ${kb(path.join(out, `${key}.jpg`))} · 카드 ${kb(path.join(out, `${key}-card.webp`))} · 첫 화면 ${kb(path.join(out, `${key}-hero.webp`))} / PC ${kb(path.join(out, `${key}-hero-l.webp`))}`);
  }
  return keys;
}

async function steps() {
  for (const d of fs.readdirSync(DESIGN).filter((d) => d.startsWith("steps-"))) {
    const key = d.replace("steps-", "");
    const out = path.join(PUBLIC, "steps", key);
    fs.mkdirSync(out, { recursive: true });
    const files = fs.readdirSync(path.join(DESIGN, d)).filter((f) => /^\d+-.*\.png$/.test(f)).sort((a, b) => parseInt(a) - parseInt(b));
    for (const f of files) await jpg(sharp(path.join(DESIGN, d, f)).resize(1080)).toFile(path.join(out, `${parseInt(f)}.jpg`));
    console.log(`  ${key}: 단계 사진 ${files.length}장`);
  }
}

// 3D 음료 그림(투명 배경 PNG) → 화면용 WebP(투명 유지) 큰 판 600px · 작은 판 360px.
// 화질 72 · 투명도 화질 60 — 82/90 일 때와 눈으로 구별되지 않는데 용량은 절반 아래다(2026-10-27 비교, 하이볼 126KB → 58KB).
// AVIF 는 더 작지만 iOS 16 이전 사파리가 못 읽어서 쓰지 않는다.
const ART_SIZES = { "": 600, "-s": 360 };

async function arts() {
  const dir = path.join(DESIGN, "drinks3d");
  if (!fs.existsSync(dir)) return [];
  const out = path.join(PUBLIC, "drinks3d");
  fs.mkdirSync(out, { recursive: true });
  const keys = [];
  for (const f of fs.readdirSync(dir).filter((f) => /^[a-z]+\.png$/.test(f)).sort()) {
    const key = f.replace(".png", "");
    const trimmed = sharp(path.join(dir, f)).trim({ threshold: 1 });
    const sizes = [];
    for (const [suffix, w] of Object.entries(ART_SIZES)) {
      const dest = path.join(out, `${key}${suffix}.webp`);
      await trimmed.clone().resize({ width: w, height: Math.round((w * 4) / 3), fit: "inside" }).webp({ quality: 72, alphaQuality: 60, effort: 6 }).toFile(dest);
      sizes.push(`${w}px ${kb(dest)}`);
    }
    keys.push(key);
    console.log(`  ${key}: ${sizes.join(" · ")}`);
  }
  return keys;
}

console.log("완성 사진");
const keys = await drinks();
console.log("3D 음료 그림");
const artKeys = await arts();
console.log("만드는 과정");
await steps();
console.log(`\nlib/photos.js 의 DRINKS 에 있어야 할 것: ${keys.join(", ")}`);
console.log(`lib/photos.js 의 ARTS 에 있어야 할 것: ${artKeys.join(", ")}`);
