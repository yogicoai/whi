// 사업자 정보 · 약관 — 손님 화면 · 서버 · 어드민이 같이 쓰는 정의.
// 보이스 동화(Desktop/Dong)의 site-info · legal-doc 구조를 옮겼다(2026-10-28 사용자: "웹 출시를 위해 회사 정보 · 개인정보 · 동의가 있어야 한다").
//
// - 사업자 정보: 푸터에 보이는 칸들. 값은 어드민 '사업자 정보·약관'에서 고친다(DB settings._id "business").
//   Dong 에 없던 개인정보 보호책임자 · 청소년 보호책임자 칸을 더했다(술을 다루는 앱이라 청소년보호정책도 둔다).
// - 약관 문서: 이용약관 · 개인정보처리방침 · 청소년보호정책. 게시하면 판이 하나씩 쌓이고(고치지 않는다) 시행일로 지금 판을 고른다.
//   Dong 의 환불 안내는 뺐다 — 이 앱은 무료라 결제가 없다.
// - 본문 문법은 Dong 과 같다: ## 제목, ### 작은 제목, - 글머리, 1. 번호, --- 가로줄, 빈 줄은 문단. 링크 · 굵게 · HTML 은 글자 그대로 보인다.

export const LEGAL_KINDS = {
  terms: { title: "이용약관", path: "/terms" },
  privacy: { title: "개인정보처리방침", path: "/privacy" },
  youth: { title: "청소년보호정책", path: "/youth" },
};
export const isLegalKind = (k) => Object.hasOwn(LEGAL_KINDS, k || "");

/** 칸 순서가 곧 푸터 순서 */
export const BUSINESS_FIELDS = [
  { key: "name", label: "상호", required: true, max: 60 },
  { key: "ceo", label: "대표자", max: 40 },
  { key: "bizNo", label: "사업자등록번호", max: 12, hint: "숫자 10자리 — 000-00-00000 모양으로 맞춰요" },
  { key: "mailOrderNo", label: "통신판매업 신고번호", max: 60, hint: "무료 서비스라 없으면 비워 두세요(푸터에서 빠져요)" },
  { key: "address", label: "사업장 주소", max: 200 },
  { key: "phone", label: "고객센터 전화", max: 20 },
  { key: "email", label: "이메일", max: 120 },
  { key: "hours", label: "운영 시간", max: 100 },
  { key: "privacyOfficer", label: "개인정보 보호책임자", max: 40 },
  { key: "youthOfficer", label: "청소년 보호책임자", max: 40 },
  { key: "hosting", label: "호스팅 제공자", required: true, max: 60 },
];

/** DB 가 비었거나 안 될 때 — 보이스 동화 약관에 적힌 요기코퍼레이션 값(2026-10-19 판). 모르는 칸은 null("(등록 예정)") */
export const BUSINESS_DEFAULTS = {
  name: "주식회사 요기코퍼레이션",
  ceo: null,
  bizNo: null,
  mailOrderNo: null,
  address: null,
  phone: "02-557-0920",
  email: "contact@yogico.kr",
  hours: "평일 10:00-17:30, 점심 12:50-14:00, 토·일·공휴일 휴무",
  privacyOfficer: "이재홍",
  youthOfficer: null,
  hosting: "Vercel Inc.",
};

export const INFO_TBD = "(등록 예정)";
export const infoText = (v) => (v && String(v).trim() ? v : INFO_TBD);

/** 사업자등록번호 끝자리(검증 숫자) 확인 — 가중치 1,3,7,1,3,7,1,3,5 */
export function bizNoValid(digits) {
  if (!/^\d{10}$/.test(digits)) return false;
  const w = [1, 3, 7, 1, 3, 7, 1, 3, 5];
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(digits[i]) * w[i];
  sum += Math.floor((Number(digits[8]) * 5) / 10);
  return (10 - (sum % 10)) % 10 === Number(digits[9]);
}
export const formatBizNo = (d) => `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`;

/**
 * 사업자 정보 검사 — { value, errors }. 빈 칸은 null, 상호 · 호스팅은 비울 수 없다.
 * 줄바꿈 같은 제어 문자는 받지 않는다(푸터 한 줄이 깨진다).
 */
export function validateBusiness(input = {}) {
  const value = {};
  const errors = {};
  for (const f of BUSINESS_FIELDS) {
    let v = typeof input[f.key] === "string" ? input[f.key].trim() : "";
    if (/[\u0000-\u001f\u007f]/.test(v)) errors[f.key] = "줄바꿈 없이 한 줄로 적어 주세요";
    else if (!v && f.required) errors[f.key] = `${f.label}은 비울 수 없어요`;
    else if (v.length > f.max) errors[f.key] = `${f.max}자까지 적을 수 있어요`;
    else if (v && f.key === "bizNo") {
      const d = v.replace(/\D/g, "");
      if (!bizNoValid(d)) errors[f.key] = "사업자등록번호가 맞지 않아요(숫자 10자리)";
      else v = formatBizNo(d);
    } else if (v && f.key === "phone" && !/^[0-9+() -]{7,20}$/.test(v)) errors[f.key] = "전화번호 모양이 아니에요";
    else if (v && f.key === "email" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) errors[f.key] = "이메일 모양이 아니에요";
    value[f.key] = v || null;
  }
  return { value, errors };
}

// ── 문서

export const LEGAL_LIMITS = { title: 100, body: 60000, note: 500 };

/** 한국 날짜 "2026-10-28" */
export const kstToday = (now = Date.now()) => new Date(now + 9 * 3600 * 1000).toISOString().slice(0, 10);
export const addDays = (ymd, n) => new Date(Date.parse(`${ymd}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
/** "2026-10-28" → "2026년 10월 28일" */
export const longDate = (ymd) => (ymd ? `${Number(ymd.slice(0, 4))}년 ${Number(ymd.slice(5, 7))}월 ${Number(ymd.slice(8, 10))}일` : "");
export const dotDate = (ymd) => (ymd ? ymd.replace(/-/g, ".") : "");

/**
 * 지금 판 · 예정 판 고르기 — 지금 판은 시행일이 오늘 이전인 것 중 (시행일, 판 번호)가 가장 큰 것,
 * 예정 판은 시행일이 오늘 뒤인 것 중 가장 가까운 것.
 * @param {{version:number, effectiveDate:string}[]} versions
 */
export function pickDocs(versions = [], today = kstToday()) {
  const later = (a, b) => (a.effectiveDate === b.effectiveDate ? a.version > b.version : a.effectiveDate > b.effectiveDate);
  let current = null;
  let upcoming = null;
  for (const v of versions) {
    if (v.effectiveDate <= today) {
      if (!current || later(v, current)) current = v;
    } else if (!upcoming || v.effectiveDate < upcoming.effectiveDate || (v.effectiveDate === upcoming.effectiveDate && v.version > upcoming.version)) {
      upcoming = v;
    }
  }
  return { current, upcoming };
}

/** 본문 → 블록 목록. 글자는 그대로 두고 React 가 글자로만 그린다(HTML 을 넣지 않는다) */
export function parseLegal(body = "") {
  const blocks = [];
  let para = [];
  let list = null;
  const flushPara = () => {
    if (para.length) blocks.push({ type: "p", text: para.join("\n") });
    para = [];
  };
  const flushList = () => {
    if (list) blocks.push(list);
    list = null;
  };
  for (const raw of String(body).replace(/\r/g, "").split("\n")) {
    const line = raw.trim();
    let m;
    if (!line) {
      flushPara();
      flushList();
    } else if (/^-{3,}$/.test(line)) {
      flushPara();
      flushList();
      blocks.push({ type: "hr" });
    } else if ((m = line.match(/^#{1,2}\s+(.+)$/))) {
      flushPara();
      flushList();
      blocks.push({ type: "h2", text: m[1] });
    } else if ((m = line.match(/^#{3,}\s+(.+)$/))) {
      flushPara();
      flushList();
      blocks.push({ type: "h3", text: m[1] });
    } else if ((m = line.match(/^[-*·]\s+(.+)$/))) {
      flushPara();
      if (list?.type !== "ul") {
        flushList();
        list = { type: "ul", items: [] };
      }
      list.items.push(m[1]);
    } else if ((m = line.match(/^(\d+)[.)]\s+(.+)$/))) {
      flushPara();
      if (list?.type !== "ol") {
        flushList();
        list = { type: "ol", start: Number(m[1]), items: [] };
      }
      list.items.push(m[2]);
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();
  return blocks;
}

/**
 * 준비된 초안에 지금 사업자 정보 · 시행일을 채운다 — [준비된 초안 넣기]를 누를 때 한 번만(저장되는 본문은 그냥 글자).
 * 사업자 정보를 나중에 바꿔도 이미 게시한 본문은 바뀌지 않는다 — 바뀌면 새 판을 게시한다.
 */
export function fillDraft(body, info, effectiveDate) {
  const map = {
    상호: info.name,
    전화: info.phone,
    이메일: info.email,
    운영시간: info.hours,
    주소: info.address,
    보호책임자: info.privacyOfficer,
    청소년보호책임자: info.youthOfficer,
    호스팅: info.hosting,
    시행일: longDate(effectiveDate),
  };
  return body.replace(/\{\{(\S+?)\}\}/g, (all, k) => (Object.hasOwn(map, k) ? infoText(map[k]) : all));
}
