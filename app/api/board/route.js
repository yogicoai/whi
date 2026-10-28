// 모두의 레시피 — 목록(GET, 누구나) · 올리기(POST, 회원 — 기기 열쇠 Authorization: Bearer).
// 올리기는 multipart: data(JSON 글) + images(사진 0~3장, 브라우저가 줄여 보낸 것). 사진은 Cafe24 로, 글은 DB(posts)로.

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { memberByToken, tokenFrom } from "@/lib/server/members";
import { createPost, listPosts, publicPost, BoardInputError } from "@/lib/server/board";

export async function GET(request) {
  const sp = new URL(request.url).searchParams;
  try {
    const viewer = sp.get("me") ? await memberByToken(tokenFrom(request)) : null;
    const { total, items } = await listPosts({
      sort: sp.get("sort") === "like" ? "like" : "new",
      limit: Math.min(48, Number(sp.get("limit")) || 24),
      skip: Math.max(0, Number(sp.get("skip")) || 0),
      whiskyId: sp.get("whisky") || null,
      memberId: viewer?._id || null,
    });
    return NextResponse.json({ total, items: items.map((p) => publicPost(p)) });
  } catch (e) {
    console.error("[board GET]", e);
    return NextResponse.json({ error: "지금은 불러올 수 없어요" }, { status: 503 });
  }
}

export async function POST(request) {
  try {
    const member = await memberByToken(tokenFrom(request));
    if (!member) return NextResponse.json({ error: "회원만 올릴 수 있어요. 먼저 시작하기를 해 주세요" }, { status: 401 });
    if (member.status === "suspended") return NextResponse.json({ error: "이용이 정지된 계정이에요" }, { status: 403 });
    const form = await request.formData();
    let input;
    try {
      input = JSON.parse(String(form.get("data") || "{}"));
    } catch {
      return NextResponse.json({ error: "글 내용을 읽지 못했어요" }, { status: 400 });
    }
    const files = form.getAll("images").filter((f) => typeof f === "object" && f.size > 0);
    const post = await createPost(member, input, files);
    revalidatePath("/board");
    revalidatePath("/");
    return NextResponse.json({ post: publicPost(post, member._id) }, { status: 201 });
  } catch (e) {
    if (e instanceof BoardInputError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("[board POST]", e);
    return NextResponse.json({ error: "올리지 못했어요. 잠시 뒤 다시 해 주세요" }, { status: 503 });
  }
}
