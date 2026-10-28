// 사업자 정보 · 약관(서버) — 보이스 동화(Desktop/Dong) app_business_info · app_legal_docs 구조를 MongoDB 로 옮겼다(2026-10-28).
//
// - settings._id "business": 사업자 정보 한 벌. 칸을 바꿀 때마다 business_changes 에 한 줄씩(칸 · 전 → 후 · 사유 · 바꾼 사람).
// - legal_docs: 약관 판. 게시만 하고 고치거나 지우지 않는다(판 번호는 문서마다 1, 2, 3 …). 지금 판은 시행일로 고른다(lib/legal.js pickDocs).
// DB 가 안 되면 손님 화면은 기본 사업자 정보와 "준비 중"으로 돈다.

import { cache } from "react";
import { getDb, tryDb } from "./db.js";
import { BUSINESS_DEFAULTS, BUSINESS_FIELDS, LEGAL_KINDS, LEGAL_LIMITS, addDays, isLegalKind, kstToday, pickDocs, validateBusiness } from "../legal.js";

export class LegalInputError extends Error {}

// ── 사업자 정보

export const getBusiness = cache(async () => {
  const db = await tryDb();
  if (!db) return { ...BUSINESS_DEFAULTS };
  try {
    const doc = await db.collection("settings").findOne({ _id: "business" });
    return { ...BUSINESS_DEFAULTS, ...(doc?.info || {}) };
  } catch (e) {
    console.error("[business]", e.message);
    return { ...BUSINESS_DEFAULTS };
  }
});

/** 사업자 정보 저장 — 바뀐 칸만 이력에 남긴다. 반환: { info, changed } */
export async function saveBusiness(input, { note = "", by = "" } = {}) {
  const { value, errors } = validateBusiness(input);
  if (Object.keys(errors).length) throw Object.assign(new LegalInputError("고칠 칸이 있어요"), { errors });
  const db = await getDb();
  const before = { ...BUSINESS_DEFAULTS, ...((await db.collection("settings").findOne({ _id: "business" }))?.info || {}) };
  const changed = BUSINESS_FIELDS.filter((f) => (before[f.key] ?? null) !== value[f.key]);
  if (!changed.length) return { info: before, changed: [] };
  const now = new Date();
  await db.collection("settings").updateOne({ _id: "business" }, { $set: { info: value, updatedAt: now, updatedBy: by } }, { upsert: true });
  await db.collection("business_changes").insertMany(
    changed.map((f) => ({ field: f.key, label: f.label, before: before[f.key] ?? null, after: value[f.key], note: String(note).slice(0, LEGAL_LIMITS.note), by, at: now }))
  );
  return { info: value, changed: changed.map((f) => f.key) };
}

export async function businessHistory(limit = 40) {
  const rows = await (await getDb()).collection("business_changes").find().sort({ at: -1 }).limit(limit).toArray();
  return rows.map(({ _id, ...r }) => ({ ...r, id: String(_id) }));
}

// ── 약관 판

const docs = async () => {
  const col = (await getDb()).collection("legal_docs");
  // 같은 문서에 같은 판 번호가 두 번 생기지 않게(동시에 게시해도)
  await col.createIndex({ kind: 1, version: 1 }, { unique: true }).catch(() => {});
  return col;
};

/** 문서 한 종류의 모든 판 — 새 판부터 */
export async function listVersions(kind) {
  if (!isLegalKind(kind)) throw new LegalInputError("문서 종류가 맞지 않아요");
  const rows = await (await docs()).find({ kind }).sort({ version: -1 }).toArray();
  return rows.map(({ _id, ...r }) => r);
}

/**
 * 새 판 게시 — 판 번호는 지금까지의 가장 큰 번호 + 1. 시행일은 오늘(한국 날짜)부터 1년 안.
 * @returns 게시한 판
 */
export async function publishVersion({ kind, title, body, effectiveDate, note = "", by = "" }) {
  if (!isLegalKind(kind)) throw new LegalInputError("문서 종류가 맞지 않아요");
  title = String(title || "").trim() || LEGAL_KINDS[kind].title;
  body = String(body || "").trim();
  if (title.length > LEGAL_LIMITS.title) throw new LegalInputError(`제목은 ${LEGAL_LIMITS.title}자까지예요`);
  if (!body) throw new LegalInputError("본문이 비어 있어요");
  if (body.length > LEGAL_LIMITS.body) throw new LegalInputError(`본문은 ${LEGAL_LIMITS.body.toLocaleString()}자까지예요`);
  const today = kstToday();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(effectiveDate || "") || effectiveDate < today || effectiveDate > addDays(today, 366)) {
    throw new LegalInputError("시행일은 오늘부터 1년 안의 날짜로 골라 주세요");
  }
  const col = await docs();
  for (let tries = 0; tries < 3; tries++) {
    const last = await col.find({ kind }).sort({ version: -1 }).limit(1).next();
    const doc = { kind, version: (last?.version || 0) + 1, title, body, effectiveDate, note: String(note).slice(0, LEGAL_LIMITS.note), by, publishedAt: new Date() };
    try {
      await col.insertOne(doc);
      const { _id, ...out } = doc;
      return out;
    } catch (e) {
      if (e.code !== 11000) throw e; // 같은 번호를 누가 먼저 썼다 — 다시 센다
    }
  }
  throw new Error("잠시 뒤 다시 게시해 주세요");
}

/** 손님 화면 — 문서 하나의 지금 판 · 예정 판(본문 포함) */
export const getLegal = cache(async (kind) => {
  const db = await tryDb();
  if (!db || !isLegalKind(kind)) return { current: null, upcoming: null };
  try {
    return pickDocs(await db.collection("legal_docs").find({ kind }).toArray());
  } catch (e) {
    console.error("[legal]", e.message);
    return { current: null, upcoming: null };
  }
});

/** 푸터 · 가입 — 문서마다 지금 시행 중인 판 번호(없으면 null). 본문은 읽지 않는다 */
export const liveVersions = cache(async () => {
  const out = Object.fromEntries(Object.keys(LEGAL_KINDS).map((k) => [k, null]));
  const db = await tryDb();
  if (!db) return out;
  try {
    const rows = await db.collection("legal_docs").find({}, { projection: { kind: 1, version: 1, effectiveDate: 1 } }).toArray();
    for (const k of Object.keys(out)) out[k] = pickDocs(rows.filter((r) => r.kind === k)).current?.version ?? null;
  } catch (e) {
    console.error("[legal]", e.message);
  }
  return out;
});
