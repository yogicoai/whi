// 라벨 찍기 — 사진(base64 JPEG, 브라우저가 1280px 로 줄인 것) → 저비용 모델로 이름 읽기 → 우리 위스키 목록에서 찾기.
// 보틀 렌즈 app/api/analyze 의 1 · 2단계와 같다(lib/server/scan.js). 사진은 판독에만 쓰고 어디에도 저장하지 않는다.
//
// 돌려주는 것: { found: true, whisky } — 그 위스키 화면으로 / { found: false, read, candidates } — 후보 · 이름 검색으로

import { NextResponse } from "next/server";
import { brief } from "@/lib/whiskies";
import { identifyLabel, matchLabel, scanReady, overLimit, logScan, SCAN_PER_DAY } from "@/lib/server/scan";
import { memberByToken, tokenFrom } from "@/lib/server/members";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_BASE64 = 4 * 1024 * 1024; // 1280px JPEG 는 200~500KB — 넉넉히 잡아도 이보다 크면 줄이지 않고 보낸 것

export async function POST(request) {
  if (!scanReady()) {
    return NextResponse.json({ error: "라벨 찍기가 아직 설정되지 않았어요. 이름으로 찾아 주세요" }, { status: 503 });
  }
  const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || request.headers.get("x-real-ip") || "local";
  try {
    const { image } = await request.json();
    const base64 = String(image || "").replace(/^data:image\/\w+;base64,/, "");
    if (!base64) return NextResponse.json({ error: "사진이 없어요" }, { status: 400 });
    if (base64.length > MAX_BASE64) return NextResponse.json({ error: "사진이 너무 커요. 다시 찍어 주세요" }, { status: 413 });
    if (await overLimit(ip)) {
      return NextResponse.json({ error: `오늘은 더 찍을 수 없어요(하루 ${SCAN_PER_DAY}번). 이름으로 찾아 주세요` }, { status: 429 });
    }

    const member = await memberByToken(tokenFrom(request)).catch(() => null);
    const read = await identifyLabel(base64);
    console.log(`[scan] ${read.name || "?"} (${read.confidence}) | ${read.usage.model} in ${read.usage.inputTokens} / out ${read.usage.outputTokens}`);

    // 글자를 못 읽었으면 후보도 찾지 않는다 — 엉뚱한 병을 내밀면 앱을 믿지 못한다
    if (!read.readable || (!read.name && !read.nameEn)) {
      await logScan(ip, { read, found: false, memberId: member?._id });
      return NextResponse.json({ found: false, unreadable: true });
    }
    const { best, candidates } = matchLabel(read);
    await logScan(ip, { read, found: !!best, whiskyId: best?.id, memberId: member?._id });
    const shown = { name: read.name, nameEn: read.nameEn, whisky: read.whisky };
    if (best) return NextResponse.json({ found: true, read: shown, whisky: brief(best) });
    return NextResponse.json({ found: false, read: shown, candidates: candidates.map(brief) });
  } catch (err) {
    const status = err?.status;
    console.error("[scan]", err?.message || err);
    // 앨범에서 아무 사진이나 고를 수 있다 — 판독기가 거절한 사진이면 사진 문제라고 분명히 말한다(보틀 렌즈와 같음)
    if (status === 400 && /image|invalid|unsupported/i.test(err?.message || "")) {
      return NextResponse.json({ error: "이 사진은 읽을 수 없어요. 라벨이 잘 보이는 사진으로 다시 해 주세요" }, { status: 400 });
    }
    if (status === 429 || status === 529 || status >= 500) {
      return NextResponse.json({ error: "지금 판독이 몰려 있어요. 잠시 뒤 다시 찍어 주세요" }, { status: 503 });
    }
    return NextResponse.json({ error: "라벨을 읽는 중에 문제가 생겼어요. 다시 찍어 주세요" }, { status: 500 });
  }
}
