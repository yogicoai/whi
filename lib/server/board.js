// 모두의 레시피(게시판) — 서버 저장(posts 컬렉션) · 사진 처리 · 좋아요 · 어드민 숨기기.
// 규칙(글자 수 · 단위 · 비율 계산)은 lib/board.js. 사진은 Cafe24 위스키 전용 폴더(lib/server/ftp.js), DB 에는 주소만.
//
// 글: { _id, memberId, author{nickname, avatar}, title, whisky{id, name, image}, parts[{name, amount, unit}], steps, note, moods,
//       images[{s, l}], likes, likedBy[회원 번호 — 밖에는 내보내지 않는다], status(public · hidden), createdAt, updatedAt }
// 닉네임은 쓸 때의 것을 같이 둔다(목록마다 회원을 다시 찾지 않게). 탈퇴하면 글을 지운다(lib/server/members.js deleteMember).

import crypto from "node:crypto";
import sharp from "sharp";
import { getDb } from "./db.js";
import { uploadFiles, removeFiles } from "./ftp.js";
import { BOARD, UNITS } from "../board.js";
import { MOODS } from "../look.js";
import { getWhisky } from "../whiskies.js";

export class BoardInputError extends Error {}

let indexed = false;
async function posts() {
  const col = (await getDb()).collection("posts");
  if (!indexed) {
    indexed = true;
    await Promise.all([
      col.createIndex({ status: 1, createdAt: -1 }),
      col.createIndex({ status: 1, likes: -1, createdAt: -1 }),
      col.createIndex({ memberId: 1, createdAt: -1 }),
      col.createIndex({ "whisky.id": 1, status: 1 }),
    ]).catch((e) => console.error("[board index]", e.message));
  }
  return col;
}

const clean = (s, max) => String(s ?? "").replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").trim().slice(0, max);
const oneLine = (s, max) => clean(s, max).replace(/\n+/g, " ");

/** 글 내용 확인 — 틀리면 BoardInputError(화면에 그대로 보여 줄 말) */
function validate(input) {
  const title = oneLine(input.title, BOARD.title.max + 1);
  if (title.length < BOARD.title.min || title.length > BOARD.title.max) throw new BoardInputError(`제목은 ${BOARD.title.min}~${BOARD.title.max}자로 적어 주세요`);

  // 위스키 — 목록에서 고른 것이면 서버의 이름 · 사진을 쓴다(보낸 값은 믿지 않는다)
  let whisky;
  const picked = input.whisky?.id ? getWhisky(String(input.whisky.id)) : null;
  if (picked) whisky = { id: picked.id, name: picked.name, image: picked.cut || picked.image || null };
  else {
    const name = oneLine(input.whisky?.name, 41);
    if (!name || name.length > 40) throw new BoardInputError("어떤 위스키로 만들었는지 적어 주세요");
    whisky = { id: null, name, image: null };
  }

  const raw = Array.isArray(input.parts) ? input.parts.slice(0, BOARD.parts) : [];
  const parts = raw.map((p, i) => {
    const name = i === 0 ? "위스키" : oneLine(p?.name, BOARD.partName);
    const unit = UNITS.includes(p?.unit) ? p.unit : "ml";
    const amount = unit === "조금" ? 0 : Math.round(Number(p?.amount) * 10) / 10;
    if (!name) throw new BoardInputError(`${i + 1}번째 재료 이름을 적어 주세요`);
    if (unit !== "조금" && !(amount > 0 && amount <= 1000)) throw new BoardInputError(`${name}의 양을 0보다 크게 적어 주세요`);
    return { name, amount, unit };
  });
  if (parts.length < 2) throw new BoardInputError("위스키와 섞는 재료를 하나 이상 적어 주세요");

  return {
    title,
    whisky,
    parts,
    steps: clean(input.steps, BOARD.steps),
    note: oneLine(input.note, BOARD.note),
    moods: [...new Set((Array.isArray(input.moods) ? input.moods : []).filter((m) => MOODS.includes(m)))],
  };
}

/** 사진 — 방향을 바로잡고(휴대폰 사진) 큰 판 1080px · 작은 판 480px webp 로. 사진이 아니면 sharp 가 읽지 못해 거른다 */
async function processImages(files, postId) {
  const out = [];
  for (const [i, file] of files.entries()) {
    if (file.size > BOARD.imageBytes) throw new BoardInputError("사진 한 장이 너무 커요(8MB 이하)");
    const buf = Buffer.from(await file.arrayBuffer());
    let base;
    try {
      base = sharp(buf, { limitInputPixels: 40e6 }).rotate();
      await base.metadata();
    } catch {
      throw new BoardInputError("사진 파일만 올릴 수 있어요");
    }
    const [l, s] = await Promise.all([
      base.clone().resize({ width: 1080, height: 1350, fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toBuffer(),
      base.clone().resize({ width: 480, height: 600, fit: "inside", withoutEnlargement: true }).webp({ quality: 76 }).toBuffer(),
    ]);
    out.push({ name: `${postId}-${i + 1}-l.webp`, buffer: l }, { name: `${postId}-${i + 1}-s.webp`, buffer: s });
  }
  return out;
}

/** 밖에 보이는 모양 — 좋아요 누른 사람 목록은 빼고, 보는 사람이 눌렀는지 · 내 글인지만 */
export function publicPost(p, viewerId = null) {
  if (!p) return null;
  const { _id, likedBy = [], ...rest } = p;
  return { id: _id, ...rest, liked: !!viewerId && likedBy.includes(viewerId), mine: !!viewerId && p.memberId === viewerId };
}

export async function createPost(member, input, files = []) {
  if (files.length > BOARD.images) throw new BoardInputError(`사진은 ${BOARD.images}장까지 올릴 수 있어요`);
  const body = validate(input);
  const col = await posts();
  const since = new Date(Date.now() - 24 * 3600e3);
  if ((await col.countDocuments({ memberId: member._id, createdAt: { $gte: since } })) >= BOARD.perDay)
    throw new BoardInputError(`하루에 ${BOARD.perDay}개까지 올릴 수 있어요`);

  const id = `p_${crypto.randomBytes(6).toString("hex")}`;
  const prepared = await processImages(files, id);
  let images = [];
  if (prepared.length) {
    const urls = await uploadFiles(prepared); // 실패하면 글도 남기지 않는다(사진 없는 글로 바뀌면 쓴 사람이 헷갈린다)
    for (let i = 0; i < urls.length; i += 2) images.push({ l: urls[i], s: urls[i + 1] });
  }
  const now = new Date();
  const doc = {
    _id: id,
    memberId: member._id,
    author: { nickname: member.nickname, avatar: member.avatar || "highball" },
    ...body,
    images,
    likes: 0,
    likedBy: [],
    comments: 0,
    status: "public",
    createdAt: now,
    updatedAt: now,
  };
  await col.insertOne(doc);
  return doc;
}

/** 목록 — 공개 글만. sort: new(최신) · like(좋아요 많은 순). whiskyId 를 주면 그 위스키로 만든 것만 */
export async function listPosts({ sort = "new", limit = 24, skip = 0, whiskyId = null, memberId = null } = {}) {
  const filter = { status: "public" };
  if (whiskyId) filter["whisky.id"] = whiskyId;
  if (memberId) filter.memberId = memberId;
  const order = sort === "like" ? { likes: -1, createdAt: -1 } : { createdAt: -1 };
  const col = await posts();
  const [items, total] = await Promise.all([
    col.find(filter, { projection: { steps: 0 } }).sort(order).skip(skip).limit(limit).toArray(),
    col.countDocuments(filter),
  ]);
  return { total, items };
}

export async function getPost(id) {
  return (await posts()).findOne({ _id: String(id) });
}

/** 좋아요 — 한 번 더 누르면 취소. 지금 상태와 수를 돌려준다 */
export async function toggleLike(id, memberId) {
  const col = await posts();
  const on = await col.findOneAndUpdate(
    { _id: id, status: "public", likedBy: { $ne: memberId } },
    { $addToSet: { likedBy: memberId }, $inc: { likes: 1 } },
    { returnDocument: "after", projection: { likes: 1 } }
  );
  if (on) return { liked: true, likes: on.likes };
  const off = await col.findOneAndUpdate(
    { _id: id, likedBy: memberId },
    { $pull: { likedBy: memberId }, $inc: { likes: -1 } },
    { returnDocument: "after", projection: { likes: 1 } }
  );
  return off ? { liked: false, likes: off.likes } : null;
}

/** 지우기 — 쓴 사람(memberId 가 맞을 때) 또는 어드민(memberId 없이). 사진 파일도 지운다 */
export async function deletePost(id, memberId = null) {
  const col = await posts();
  const filter = memberId ? { _id: id, memberId } : { _id: id };
  const p = await col.findOneAndDelete(filter);
  if (p) {
    await (await commentsCol()).deleteMany({ postId: id });
    await removeFiles(p.images.flatMap((im) => [im.l, im.s]));
  }
  return !!p;
}

/** 탈퇴한 회원의 글 — 모두 지운다(사진 포함) */
export async function deletePostsOf(memberId) {
  const col = await posts();
  const list = await col.find({ memberId }, { projection: { images: 1 } }).toArray();
  if (!list.length) return 0;
  await col.deleteMany({ memberId });
  await (await commentsCol()).deleteMany({ $or: [{ postId: { $in: list.map((p) => p._id) } }, { memberId }] });
  await removeFiles(list.flatMap((p) => p.images.flatMap((im) => [im.l, im.s])));
  return list.length;
}

// ── 댓글(2026-10-28 사용자: "댓글도 달 수 있게") — comments 컬렉션 { _id, postId, memberId, author, text, createdAt }.
// 글에는 댓글 수(comments)만 둔다. 글을 지우면 댓글도 지운다.

export const COMMENT_MAX = 300;
const commentsCol = async () => (await getDb()).collection("comments");

export function publicComment(c, viewerId = null) {
  const { _id, memberId, ...rest } = c;
  return { id: _id, ...rest, mine: !!viewerId && memberId === viewerId };
}

export async function listComments(postId) {
  return (await commentsCol()).find({ postId }).sort({ createdAt: 1 }).limit(200).toArray();
}

export async function addComment(postId, member, text) {
  const body = clean(text, COMMENT_MAX + 1);
  if (!body) throw new BoardInputError("댓글을 적어 주세요");
  if (body.length > COMMENT_MAX) throw new BoardInputError(`댓글은 ${COMMENT_MAX}자까지 쓸 수 있어요`);
  const p = await (await posts()).findOneAndUpdate({ _id: postId, status: "public" }, { $inc: { comments: 1 } }, { projection: { _id: 1 } });
  if (!p) throw new BoardInputError("없는 글이에요");
  const c = { _id: `c_${crypto.randomBytes(6).toString("hex")}`, postId, memberId: member._id, author: { nickname: member.nickname, avatar: member.avatar || "highball" }, text: body, createdAt: new Date() };
  await (await commentsCol()).insertOne(c);
  return c;
}

/** 댓글 지우기 — 쓴 사람(memberId) 또는 어드민(memberId 없이) */
export async function deleteComment(id, memberId = null) {
  const c = await (await commentsCol()).findOneAndDelete(memberId ? { _id: id, memberId } : { _id: id });
  if (c) await (await posts()).updateOne({ _id: c.postId }, { $inc: { comments: -1 } });
  return !!c;
}

// ── 어드민

export async function adminListPosts({ status = "", q = "", limit = 100 } = {}) {
  const filter = {};
  if (status) filter.status = status;
  if (q.trim()) {
    const re = { $regex: q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    filter.$or = [{ title: re }, { "author.nickname": re }, { "whisky.name": re }];
  }
  const col = await posts();
  const [items, total, hidden] = await Promise.all([
    col.find(filter, { projection: { likedBy: 0 } }).sort({ createdAt: -1 }).limit(limit).toArray(),
    col.countDocuments({}),
    col.countDocuments({ status: "hidden" }),
  ]);
  return { total, hidden, items: items.map((p) => publicPost(p)) };
}

export async function setPostStatus(id, status) {
  if (!["public", "hidden"].includes(status)) throw new BoardInputError("상태 값이 맞지 않아요");
  return (await posts()).findOneAndUpdate({ _id: id }, { $set: { status, updatedAt: new Date() } }, { returnDocument: "after", projection: { likedBy: 0 } });
}
