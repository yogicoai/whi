// 라벨 찍기 — 보틀 렌즈(wine lib/identify.js · lib/claude.js · app/api/analyze)의 1차 판독을 위스키에 맞게 옮긴 것(2026-10-28).
//
// 보틀 렌즈 흐름: 저비용 모델(IDENTIFY_MODEL, Haiku)로 "제품명"만 읽는다 → 카탈로그에서 찾는다 → 있으면 바로 결과.
// 이 앱의 카탈로그는 data/whiskies.json(1,142종)이라 찾으면 그 위스키 화면으로 보낸다.
// 보틀 렌즈의 3단계(카탈로그에 없으면 Sonnet 본 분석 · 63원)는 옮기지 않았다 — 이 앱은 위스키 화면이 정해진 데이터로만 그려진다.
// 못 찾으면 읽은 이름과 가까운 후보를 보여 주고, 이름 검색으로 이어 준다. 한 번 찍을 때 Haiku 한 번(수 원).

import Anthropic from "@anthropic-ai/sdk";
import crypto from "node:crypto";
import { allWhiskies } from "../whiskies.js";
import { getDb } from "./db.js";

// .env 에서 줄바꿈이 깨지면 키 값에 다음 변수까지 딸려 들어온다 — 보틀 렌즈 readApiKey 와 같게 정리해서 읽는다
function readApiKey() {
  const raw = process.env.ANTHROPIC_API_KEY;
  if (!raw) return null;
  const key = raw.trim().split(/\s+/)[0];
  return key.startsWith("sk-ant-") ? key : null;
}

export const scanReady = () => !!readApiKey();

const IDENTIFY_PROMPT = `이 사진의 술병 라벨에서 제품을 식별해 JSON 하나만 출력하세요. 설명·코드펜스 없이 JSON만.

{
  "readable": true|false,       // 라벨 글자를 읽을 수 있으면 true
  "whisky": true|false,         // 위스키(버번·스카치·싱글몰트·라이 등)이면 true. 와인·소주·맥주·진·럼 등은 false
  "name": "제품명 — 한국에서 통용되는 한글 표기(예: 잭 다니엘 테네시, 글렌피딕 12년, 조니워커 블랙라벨 12년). 숙성 연수는 'N년'으로",
  "nameEn": "라벨에 적힌 영문 제품명 그대로(예: Glenfiddich 12 Year Old)",
  "age": 숙성 연수 숫자 또는 null,
  "confidence": 0-100           // 제품 특정에 대한 확신도
}

주의: 추측하지 마세요. 라벨이 흐리거나 브랜드를 특정할 수 없으면 readable=false, confidence를 낮게 주세요.`;

/** 사진(base64 JPEG) → { readable, whisky, name, nameEn, age, confidence, usage } */
export async function identifyLabel(base64) {
  const model = (process.env.IDENTIFY_MODEL || "claude-haiku-4-5").trim();
  const client = new Anthropic({ apiKey: readApiKey() });
  const response = await client.messages.create({
    model,
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64 } },
          { type: "text", text: IDENTIFY_PROMPT },
        ],
      },
    ],
  });
  const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("판독 응답 파싱 실패");
  const parsed = JSON.parse(text.slice(start, end + 1));
  return {
    readable: !!parsed.readable,
    whisky: parsed.whisky !== false,
    name: String(parsed.name || "").slice(0, 80),
    nameEn: String(parsed.nameEn || "").slice(0, 120),
    age: Number(parsed.age) > 0 ? Number(parsed.age) : null,
    confidence: Number(parsed.confidence) || 0,
    usage: { inputTokens: response.usage?.input_tokens || 0, outputTokens: response.usage?.output_tokens || 0, model },
  };
}

// ── 우리 목록(1,142종)에서 찾기 ──
// 보틀 렌즈 lib/match.js 의 생각을 위스키에 맞게 줄였다: 낱말이 얼마나 겹치는지 재고,
// "위스키 · 싱글 몰트 · 스카치"처럼 수많은 병이 함께 쓰는 말은 겹쳐도 같은 술의 증거로 치지 않는다.
// 숙성 연수는 등급을 가른다 — 글렌피딕 12년과 15년은 다른 술이라, 양쪽에 다 적혀 있는데 다르면 후보에서 뺀다.

const WEAK = new Set([
  "the", "whisky", "whiskey", "scotch", "single", "malt", "blended", "straight", "bourbon", "kentucky", "tennessee",
  "rye", "irish", "japanese", "american", "pure", "grain", "aged", "year", "years", "old", "yo", "distillery", "distilled",
  "of", "and", "co", "company", "ml", "cl", "abv", "proof", "vol",
  "위스키", "싱글", "몰트", "싱글몰트", "스카치", "블렌디드", "버번", "스트레이트", "켄터키", "테네시", "라이",
  "아이리시", "아이리쉬", "재패니즈", "그레인", "숙성", "년", "년산", "증류소", "더",
]);

const norm = (s) => String(s || "").toLowerCase().replace(/[^0-9a-z가-힣]/g, "");
const tokens = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .split(/[^0-9a-z가-힣]+/)
    .map((t) => t.replace(/^(\d{1,2})(년|년산|yo|y)$/, "$1"))
    .filter((t) => t && !WEAK.has(t) && !/^\d{3,4}$/.test(t)); // 700 · 750(ml) 같은 용량은 이름이 아니다

/** 숙성 연수 — 이름 · 숙성 칸에서 "12년 · 12 years · 12yo" */
const ageOf = (s) => Number(String(s || "").match(/(\d{1,2})\s*(?:년|yo\b|y\.?o\b|years?\b)/i)?.[1] || 0) || null;

let index = null;
function getIndex() {
  if (index) return index;
  index = allWhiskies().map((w) => {
    const words = [w.name, w.nameEn, ...(w.aliases || [])];
    return {
      w,
      bag: new Set(words.flatMap(tokens)),
      own: new Set(tokens(w.name)), // 이 병 이름의 핵심 낱말 — 덜 덧붙은(기본) 제품을 앞에 세울 때 쓴다
      joined: words.map(norm).join("|"),
      age: ageOf(`${w.name} ${w.nameEn || ""} ${w.aging || ""}`),
    };
  });
  return index;
}

/** 읽은 라벨 → { best, candidates } — best 는 자신 있게 고를 수 있을 때만 */
export function matchLabel(read) {
  const qKo = tokens(read.name);
  const qEn = tokens(read.nameEn);
  const qAll = new Set([...qKo, ...qEn]);
  const age = read.age || ageOf(`${read.name} ${read.nameEn}`);
  const exactKeys = [norm(read.name), norm(read.nameEn)].filter((k) => k.length >= 3);

  // 낱말 하나가 이 병 이름들에 들어 있는가 — 띄어쓰기가 달라도("잭다니엘" · "잭 다니엘") 잡히게 3글자 이상은 붙여 쓴 이름 안에서도 찾는다
  const hit = (e, t) => e.bag.has(t) || (t.length >= 3 && !/^\d+$/.test(t) && e.joined.includes(t));
  const cover = (e, q) => (q.length ? q.filter((t) => hit(e, t)).length / q.length : 0);

  const scored = [];
  for (const e of getIndex()) {
    if (age && e.age && age !== e.age) continue; // 숙성 연수가 서로 다르면 다른 술
    const exact = exactKeys.some((k) => e.joined.split("|").includes(k));
    const q = Math.max(cover(e, qKo), cover(e, qEn)); // 읽은 이름이 이 병에 얼마나 들어 있나
    if (!exact && q < 0.5) continue;
    // 이 병 이름의 낱말이 읽은 이름에 얼마나 들어 있나 — "글렌피딕 12년"을 찍었는데 "글렌피딕 12년 셰리 캐스크 에디션"이 먼저 오지 않게
    const own = e.own.size ? [...e.own].filter((t) => qAll.has(t) || [...qAll].some((x) => x.length >= 3 && (x.includes(t) || t.includes(x)))).length / e.own.size : 0;
    const ageBonus = age && e.age === age ? 0.1 : !age && e.age ? -0.05 : 0;
    scored.push({ e, s: (exact ? 1 : 0) + q * 0.6 + own * 0.4 + ageBonus });
  }
  scored.sort((a, b) => b.s - a.s || b.e.w.popularity - a.e.w.popularity);

  const top = scored[0];
  const second = scored[1];
  // 자신 있게 고르는 때: 판독 확신 70 이상(보틀 렌즈와 같은 선) + 점수가 높고 + 다음 후보와 차이가 난다
  const sure = top && read.confidence >= 70 && top.s >= 0.85 && (!second || top.s - second.s >= 0.08);
  return { best: sure ? top.e.w : null, candidates: scored.slice(0, 6).map((x) => x.e.w) };
}

// ── 쓰는 양 막기 · 기록 ──
// 판독은 한 번에 수 원이지만 공개 주소라 누가 자동으로 두드리면 끝이 없다. 같은 곳(IP)에서 하루 40번까지.
// 기록(scans)은 어드민에서 "얼마나 찍나 · 얼마나 찾나"를 보려고 남긴다 — 사진은 저장하지 않는다.
export const SCAN_PER_DAY = 40;
const ipKey = (ip) => crypto.createHash("sha256").update(`whisky-scan:${ip || "?"}`).digest("hex").slice(0, 16);

export async function overLimit(ip) {
  try {
    const db = await getDb();
    const n = await db.collection("scans").countDocuments({ ip: ipKey(ip), at: { $gte: new Date(Date.now() - 864e5) } });
    return n >= SCAN_PER_DAY;
  } catch {
    return false; // DB 가 잠깐 안 되면 막지 않는다 — 찍기가 멈추는 쪽이 더 나쁘다
  }
}

export async function logScan(ip, { read, found, whiskyId, memberId }) {
  try {
    const db = await getDb();
    await db.collection("scans").insertOne({
      at: new Date(),
      ip: ipKey(ip),
      memberId: typeof memberId === "string" && /^m_[0-9a-f]{12}$/.test(memberId) ? memberId : null,
      found: !!found,
      whiskyId: whiskyId || null,
      read: read ? { name: read.name, nameEn: read.nameEn, age: read.age, confidence: read.confidence, whisky: read.whisky } : null,
      tokens: read?.usage ? read.usage.inputTokens + read.usage.outputTokens : 0,
    });
  } catch (e) {
    console.error("[scan] 기록 실패:", e.message);
  }
}
