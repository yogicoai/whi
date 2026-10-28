// 이용 기록(activity 컬렉션) — 저장 · 보내기 · 만들어 봄. 어드민 대시보드의 숫자와 인기 순위가 여기서 나온다.
// 누가 했는지는 회원 번호만 남긴다(비회원은 없음). 내용은 레시피·위스키 열쇠뿐 — 개인정보를 담지 않는다.

import { getDb } from "./db.js";
import { recipeOf } from "../cocktails.js";
import { getWhisky } from "../whiskies.js";

export const TYPES = { save: "저장", send: "보내기", made: "만들어 봄" };

export async function record({ type, recipeKey, whiskyId, memberId }) {
  if (!Object.hasOwn(TYPES, type) || !recipeOf(recipeKey)) return false;
  await (await getDb()).collection("activity").insertOne({
    type,
    recipeKey,
    whiskyId: whiskyId && getWhisky(whiskyId) ? whiskyId : null,
    memberId: typeof memberId === "string" && /^m_[0-9a-f]{12}$/.test(memberId) ? memberId : null,
    at: new Date(),
  });
  return true;
}

const dayKey = (d) => new Date(d.getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10); // 한국 시각 날짜

/** 대시보드 숫자 — 회원, 이용 기록, 최근 14일 흐름, 인기 레시피·제품 */
export async function dashboard() {
  const db = await getDb();
  const now = new Date();
  const since14 = new Date(now.getTime() - 13 * 86400 * 1000);
  since14.setHours(0, 0, 0, 0);
  const since7 = new Date(now.getTime() - 7 * 86400 * 1000);

  const [memberTotal, suspended, marketing, joins, byType, byType7, daily, topRecipes, topWhiskies] = await Promise.all([
    db.collection("members").countDocuments(),
    db.collection("members").countDocuments({ status: "suspended" }),
    db.collection("members").countDocuments({ "agreements.marketing": { $ne: null } }),
    db.collection("members").find({ createdAt: { $gte: since14 } }, { projection: { createdAt: 1 } }).toArray(),
    db.collection("activity").aggregate([{ $group: { _id: "$type", n: { $sum: 1 } } }]).toArray(),
    db.collection("activity").aggregate([{ $match: { at: { $gte: since7 } } }, { $group: { _id: "$type", n: { $sum: 1 } } }]).toArray(),
    db.collection("activity").find({ at: { $gte: since14 } }, { projection: { at: 1 } }).toArray(),
    db.collection("activity").aggregate([{ $group: { _id: "$recipeKey", n: { $sum: 1 } } }, { $sort: { n: -1 } }, { $limit: 8 }]).toArray(),
    db.collection("activity").aggregate([{ $match: { whiskyId: { $ne: null } } }, { $group: { _id: "$whiskyId", n: { $sum: 1 } } }, { $sort: { n: -1 } }, { $limit: 8 }]).toArray(),
  ]);

  // 최근 14일 — 날마다 가입 수와 이용 기록 수
  const days = [];
  for (let i = 13; i >= 0; i--) days.push(dayKey(new Date(now.getTime() - i * 86400 * 1000)));
  const count = (list, field) => {
    const m = Object.fromEntries(days.map((d) => [d, 0]));
    for (const x of list) {
      const k = dayKey(x[field]);
      if (k in m) m[k]++;
    }
    return days.map((d) => ({ day: d, n: m[d] }));
  };
  const asMap = (rows) => Object.fromEntries(rows.map((r) => [r._id, r.n]));

  return {
    members: { total: memberTotal, suspended, marketing, today: joins.filter((j) => dayKey(j.createdAt) === dayKey(now)).length },
    activity: { total: asMap(byType), week: asMap(byType7) },
    joinsByDay: count(joins, "createdAt"),
    activityByDay: count(daily, "at"),
    topRecipes: topRecipes.map((r) => ({ key: r._id, name: recipeOf(r._id)?.name || r._id, n: r.n })),
    topWhiskies: topWhiskies.map((r) => ({ id: r._id, name: getWhisky(r._id)?.name || r._id, n: r.n })),
  };
}
