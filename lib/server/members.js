// 회원 — 서버 저장(members 컬렉션). 칸 정의는 docs/member-data.md.
//
// 아직 실제 소셜 로그인이 없어서(시연용 가입) 가입할 때 기기마다 열쇠(token)를 하나 주고, DB 에는 그 해시만 둔다.
// 기기는 열쇠를 Authorization: Bearer 로 보내 자기 회원정보를 읽고 고친다. 소셜 로그인이 붙으면
// provider 계정 번호로 같은 회원을 찾게 바꾸고, 이 열쇠는 로그인 세션으로 갈음한다.
// 상태: active(이용 중) · suspended(어드민이 이용 정지). 탈퇴하면 문서를 지운다(개인정보를 남기지 않는다).

import crypto from "node:crypto";
import { getDb } from "./db.js";
import { AGREEMENTS, AVATARS, NICK, PROVIDERS, STRENGTHS, isAdultYear } from "../member.js";
import { MOODS } from "../look.js";
import { liveVersions } from "./legal.js";
import { deletePostsOf } from "./board.js";

const consentVersions = async () => {
  const live = await liveVersions();
  return { terms: live.terms, privacy: live.privacy };
};

const hash = (token) => crypto.createHash("sha256").update(token).digest("hex");
const members = async () => (await getDb()).collection("members");

export class InputError extends Error {}

/** 화면·어드민에 내보낼 모양 — 열쇠 해시는 빼고 */
export function publicMember(m) {
  if (!m) return null;
  const { _id, tokenHash, ...rest } = m;
  return { id: _id, ...rest };
}

/** 고칠 수 있는 칸만 골라 확인한다 — 닉네임 · 프로필 색 · 취향 */
function profile(input) {
  const out = {};
  if (input.nickname !== undefined) {
    const nick = String(input.nickname).replace(/\s+/g, " ").trim();
    if (nick.length < NICK.min || nick.length > NICK.max) throw new InputError(`닉네임은 ${NICK.min}~${NICK.max}자로 적어 주세요`);
    out.nickname = nick;
  }
  if (input.avatar !== undefined) {
    if (!Object.hasOwn(AVATARS, input.avatar)) throw new InputError("프로필 색을 다시 골라 주세요");
    out.avatar = input.avatar;
  }
  if (input.taste !== undefined) {
    const moods = (Array.isArray(input.taste?.moods) ? input.taste.moods : []).filter((m) => MOODS.includes(m));
    const strength = STRENGTHS.some((s) => s.ratio === input.taste?.strength) ? input.taste.strength : 3;
    out.taste = { moods: [...new Set(moods)], strength };
  }
  return out;
}

export async function createMember(input) {
  if (!Object.hasOwn(PROVIDERS, input.provider || "")) throw new InputError("가입 방법을 다시 골라 주세요");
  const missing = AGREEMENTS.filter((a) => a.required && !input.agreements?.[a.key]);
  if (missing.length) throw new InputError(`${missing.map((a) => a.label).join(", ")}에 동의해 주세요`);
  if (!isAdultYear(input.birthYear)) throw new InputError("만 19세 이상만 가입할 수 있어요");
  const now = new Date();
  const token = crypto.randomBytes(24).toString("base64url");
  const doc = {
    _id: `m_${crypto.randomBytes(6).toString("hex")}`,
    provider: input.provider,
    ...profile({ nickname: input.nickname, avatar: input.avatar || "highball", taste: input.taste || {} }),
    birthYear: Number(input.birthYear),
    adultVerified: true,
    verifiedBy: "demo", // 실제 서비스: "phone"(휴대폰 본인인증)
    verifiedAt: now,
    agreements: Object.fromEntries(AGREEMENTS.map((a) => [a.key, input.agreements?.[a.key] ? now : null])),
    // 어느 판에 동의했는지 — 가입할 때 시행 중이던 이용약관 · 개인정보처리방침 판 번호(없으면 null). 약관이 바뀌면 다시 묻는 기준
    consentVersions: await consentVersions(),
    status: "active",
    tokenHash: hash(token),
    createdAt: now,
    updatedAt: now,
    lastSeenAt: now,
  };
  await (await members()).insertOne(doc);
  return { member: publicMember(doc), token };
}

/** 열쇠로 회원 찾기 — 찾으면 마지막 접속 시각을 남긴다 */
export async function memberByToken(token) {
  if (!token) return null;
  return (await members()).findOneAndUpdate({ tokenHash: hash(token) }, { $set: { lastSeenAt: new Date() } }, { returnDocument: "after" });
}

/** 회원 자신이 고치기 — 프로필과 이벤트·혜택 알림 동의 */
export async function updateSelf(id, input) {
  const set = { ...profile(input), updatedAt: new Date() };
  if (input.marketing !== undefined) set["agreements.marketing"] = input.marketing ? new Date() : null;
  return (await members()).findOneAndUpdate({ _id: id }, { $set: set }, { returnDocument: "after" });
}

export async function deleteMember(id) {
  const res = await (await members()).deleteOne({ _id: id });
  // 이용 기록은 통계로만 남긴다 — 누구의 것인지(회원 번호)는 지운다(개인정보처리방침 3항, 2026-10-28)
  await (await getDb()).collection("activity").updateMany({ memberId: id }, { $set: { memberId: null } });
  // 모두의 레시피에 올린 글 · 사진도 지운다(닉네임이 붙어 있다)
  await deletePostsOf(id).catch((e) => console.error("[members delete posts]", e.message));
  return res;
}

export function tokenFrom(request) {
  const h = request.headers.get("authorization") || "";
  return h.startsWith("Bearer ") ? h.slice(7).trim() : null;
}

// ── 어드민

/** 목록 — 닉네임 검색, 상태 거르기, 가입 최신순. 회원마다 저장·보냄·만들어 봄 수를 붙인다 */
export async function listMembers({ q = "", status = "", limit = 100 } = {}) {
  const db = await getDb();
  const filter = {};
  if (q.trim()) filter.nickname = { $regex: q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
  if (status) filter.status = status;
  const list = await db.collection("members").find(filter).sort({ createdAt: -1 }).limit(limit).toArray();
  const counts = await db
    .collection("activity")
    .aggregate([
      { $match: { memberId: { $in: list.map((m) => m._id) } } },
      { $group: { _id: { m: "$memberId", t: "$type" }, n: { $sum: 1 } } },
    ])
    .toArray();
  const byMember = {};
  for (const c of counts) (byMember[c._id.m] ||= {})[c._id.t] = c.n;
  const total = await db.collection("members").countDocuments(filter);
  return { total, items: list.map((m) => ({ ...publicMember(m), activity: byMember[m._id] || {} })) };
}

export async function setStatus(id, status) {
  if (!["active", "suspended"].includes(status)) throw new InputError("상태 값이 맞지 않아요");
  return (await members()).findOneAndUpdate({ _id: id }, { $set: { status, updatedAt: new Date() } }, { returnDocument: "after" });
}
