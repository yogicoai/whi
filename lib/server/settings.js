// 어드민이 정하는 것 — 레시피 노출·순서·문구(settings/recipes), 실제 제품 추천 고정·제외(settings/picks), 공지·배너(banners).
//
// 손님 화면은 이것을 읽어 코드에 적힌 기본값 위에 덮는다. DB 가 안 되면(tryDb → null) 기본값 그대로 돈다.
// 어드민이 바꾸면 API 가 revalidatePath 로 화면을 새로 그리게 한다.

import { cache } from "react";
import { ObjectId } from "mongodb";
import { tryDb, getDb } from "./db.js";
import { recipeOf } from "../cocktails.js";

// ── 레시피 설정: { [레시피 열쇠]: { hidden, order, why, tip } }

export const getRecipeSettings = cache(async () => {
  const db = await tryDb();
  if (!db) return {};
  try {
    return (await db.collection("settings").findOne({ _id: "recipes" }))?.items || {};
  } catch (e) {
    console.error("[settings]", e.message);
    return {};
  }
});

export async function saveRecipeSettings(items) {
  const clean = {};
  for (const [key, v] of Object.entries(items || {})) {
    if (!recipeOf(key)) continue;
    clean[key] = {
      hidden: !!v.hidden,
      order: Number.isFinite(Number(v.order)) ? Number(v.order) : null,
      why: String(v.why || "").trim().slice(0, 120) || null,
      tip: String(v.tip || "").trim().slice(0, 300) || null,
    };
  }
  await (await getDb()).collection("settings").updateOne({ _id: "recipes" }, { $set: { items: clean, updatedAt: new Date() } }, { upsert: true });
  return clean;
}

/** 목록에 보일 레시피만, 어드민이 정한 순서대로(정하지 않은 것은 원래 순서) */
export function arrange(recipes, settings) {
  return recipes
    .map((r, i) => ({ r, i, s: settings[r.key] || {} }))
    .filter(({ s }) => !s.hidden)
    .sort((a, b) => (a.s.order ?? 1000 + a.i) - (b.s.order ?? 1000 + b.i))
    .map(({ r }) => r);
}

/** 상세 화면 문구 — 어드민이 고친 한 줄 설명·팁이 있으면 그것 */
export function copyOf(recipe, settings) {
  const s = settings[recipe.key] || {};
  return { why: s.why || recipe.why, tip: s.tip || recipe.tip };
}

// ── 실제 제품 추천 설정: { pinned: ["위스키id-레시피"], excluded: ["위스키id"] }

export const getPickSettings = cache(async () => {
  const db = await tryDb();
  const empty = { pinned: [], excluded: [] };
  if (!db) return empty;
  try {
    const doc = await db.collection("settings").findOne({ _id: "picks" });
    return { pinned: doc?.pinned || [], excluded: doc?.excluded || [] };
  } catch (e) {
    console.error("[settings]", e.message);
    return empty;
  }
});

export async function savePickSettings({ pinned = [], excluded = [] }) {
  const clean = {
    pinned: [...new Set(pinned.map(String))].slice(0, 20),
    excluded: [...new Set(excluded.map(String))].slice(0, 200),
  };
  await (await getDb()).collection("settings").updateOne({ _id: "picks" }, { $set: { ...clean, updatedAt: new Date() } }, { upsert: true });
  return clean;
}

// ── 공지·배너

export const TONES = { orange: "귤색", sky: "하늘색", cream: "크림색" };

function bannerInput(b) {
  const title = String(b.title || "").trim().slice(0, 40);
  if (!title) throw new Error("제목을 적어 주세요");
  const link = String(b.link || "").trim();
  if (link && !/^(\/[^/]|https:\/\/)/.test(link)) throw new Error("링크는 /로 시작하는 앱 안 주소나 https:// 주소로 적어 주세요");
  // 날짜만 오면(2026-11-01) 한국 시각으로 시작일 0시 · 종료일 23시 59분까지
  const date = (v, end) => {
    if (!v) return null;
    const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T${end ? "23:59:59" : "00:00:00"}+09:00` : v);
    if (Number.isNaN(d.getTime())) throw new Error("기간 날짜를 다시 골라 주세요");
    return d;
  };
  return {
    title,
    body: String(b.body || "").trim().slice(0, 120),
    link: link || null,
    tone: Object.hasOwn(TONES, b.tone) ? b.tone : "orange",
    active: !!b.active,
    startAt: date(b.startAt, false),
    endAt: date(b.endAt, true),
  };
}

const publicBanner = ({ _id, ...b }) => ({ id: String(_id), ...b });

export async function listBanners() {
  return (await (await getDb()).collection("banners").find().sort({ createdAt: -1 }).toArray()).map(publicBanner);
}

export async function createBanner(b) {
  const now = new Date();
  const doc = { ...bannerInput(b), createdAt: now, updatedAt: now };
  const { insertedId } = await (await getDb()).collection("banners").insertOne(doc);
  return publicBanner({ _id: insertedId, ...doc });
}

export async function updateBanner(id, b) {
  const doc = await (await getDb())
    .collection("banners")
    .findOneAndUpdate({ _id: new ObjectId(id) }, { $set: { ...bannerInput(b), updatedAt: new Date() } }, { returnDocument: "after" });
  return doc && publicBanner(doc);
}

export async function deleteBanner(id) {
  return (await getDb()).collection("banners").deleteOne({ _id: new ObjectId(id) });
}

/** 지금 홈에 띄울 배너 — 켜져 있고 기간 안인 것, 최신순 3개까지 */
export const getActiveBanners = cache(async () => {
  const db = await tryDb();
  if (!db) return [];
  try {
    const now = new Date();
    const list = await db
      .collection("banners")
      .find({
        active: true,
        $and: [{ $or: [{ startAt: null }, { startAt: { $lte: now } }] }, { $or: [{ endAt: null }, { endAt: { $gte: now } }] }],
      })
      .sort({ createdAt: -1 })
      .limit(3)
      .toArray();
    return list.map(publicBanner);
  } catch (e) {
    console.error("[banners]", e.message);
    return [];
  }
});
