// 회원 — 가입 · 로그인 · 회원정보(브라우저 쪽).
//
// 회원정보는 서버(whiskylens.members, app/api/members)에 둔다. 아직 실제 소셜 로그인이 없어서(시연용 가입)
// 가입할 때 서버가 이 기기에 열쇠(token)를 하나 주고, 기기는 그 열쇠로 자기 회원정보를 읽고 고친다.
// 화면이 빨리 뜨게 회원정보의 사본을 기기에도 둔다(getMember) — 서버와 다르면 서버가 맞다(refreshMember).
// 칸의 뜻과 서버로 옮길 때의 할 일은 docs/member-data.md. 상수와 isAdultYear 는 서버(lib/server/members.js)도 같이 쓴다.

const KEY = "wl.member";
const TOKEN = "wl.token";

/** 가입 방법 — 시연에서는 어느 것을 눌러도 같은 가입 과정을 지난다 */
export const PROVIDERS = {
  kakao: { name: "카카오" },
  naver: { name: "네이버" },
  google: { name: "Google" },
  email: { name: "이메일" },
};

/** 동의 항목 — 필수 셋은 모두 받아야 가입된다. 서버가 동의한 때를 남긴다(선택 항목은 바꿀 수 있다) */
export const AGREEMENTS = [
  { key: "terms", label: "서비스 이용약관", required: true },
  { key: "privacy", label: "개인정보 수집·이용", required: true },
  { key: "adult", label: "만 19세 이상입니다", required: true },
  { key: "marketing", label: "이벤트·혜택 알림 받기", required: false },
];

/** 프로필 색 — 레시피 카드 색에서 골랐다(lib/look.js) */
export const AVATARS = {
  highball: "#9cc3d5",
  lemon: "#ecd97a",
  cola: "#a4513e",
  tonic: "#97d0bf",
  ginger: "#e8a95b",
  earlgrey: "#b3a7d1",
};

/** 좋아하는 농도 — 레시피 상세의 "농도"를 처음에 이 값으로 고를 수 있게 남긴다 */
export const STRENGTHS = [
  { ratio: 2, label: "진하게" },
  { ratio: 3, label: "보통" },
  { ratio: 4, label: "연하게" },
];

export const NICK = { min: 2, max: 12 };

/**
 * 청소년보호법의 "청소년"은 만 19세 미만이되, 만 19세가 되는 해의 1월 1일을 맞은 사람은 뺀다 —
 * 그래서 태어난 해만으로 가른다(올해 − 태어난 해 ≥ 19 이면 이용 가능).
 */
export function isAdultYear(birthYear, now = new Date()) {
  const y = Number(birthYear);
  return Number.isInteger(y) && y > 1900 && now.getFullYear() - y >= 19;
}

/** "2026.10.27" */
export const shortDate = (iso) => (iso ? String(iso).slice(0, 10).replace(/-/g, ".") : "");

// ── 기기에 둔 사본

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}

export const getMember = () => read(KEY);

function keep(member, token) {
  try {
    localStorage.setItem(KEY, JSON.stringify(member));
    if (token) localStorage.setItem(TOKEN, JSON.stringify(token));
    // 공유할 때 "보내는 사람"에 닉네임이 들어가게
    localStorage.setItem("wl.nick", JSON.stringify(member.nickname));
    window.dispatchEvent(new Event("wl-storage"));
  } catch {}
}

/** 로그아웃 — 이 기기의 회원정보와 열쇠만 지운다. 이 기기에 저장한 레시피·내 바는 남는다 */
export function signOut() {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(TOKEN);
    window.dispatchEvent(new Event("wl-storage"));
  } catch {}
}

// ── 서버

async function api(method, path, body) {
  const token = read(TOKEN);
  let res;
  try {
    res = await fetch(path, {
      method,
      headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw Object.assign(new Error("인터넷 연결을 확인해 주세요"), { status: 0 });
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || "잠시 뒤 다시 해 주세요"), { status: res.status });
  return data;
}

/** 가입 — 서버가 확인해 남기고 이 기기에 열쇠를 준다 */
export async function signUp(input) {
  const { member, token } = await api("POST", "/api/members", input);
  keep(member, token);
  return member;
}

/** 서버의 회원정보로 사본을 맞춘다 — 열쇠가 더는 맞지 않으면(어드민이 지움·탈퇴) 로그아웃 상태로 */
export async function refreshMember() {
  if (!read(TOKEN)) return getMember();
  try {
    const { member } = await api("GET", "/api/members/me");
    keep(member);
    return member;
  } catch (e) {
    if (e.status === 401) {
      signOut();
      return null;
    }
    return getMember(); // 서버가 잠깐 안 되면 사본으로 버틴다
  }
}

/** 회원정보 고치기 — {nickname, avatar, taste} 나 {marketing: true|false} */
export async function updateMember(patch) {
  const { member } = await api("PATCH", "/api/members/me", patch);
  keep(member);
  return member;
}

/** 탈퇴 — 서버의 회원정보를 지우고, 이 기기에 남긴 것도 모두 지운다 */
export async function withdraw() {
  if (read(TOKEN)) await api("DELETE", "/api/members/me");
  try {
    for (const k of [KEY, TOKEN, "wl.saved", "wl.bar", "wl.nick", "wl.stats"]) localStorage.removeItem(k);
    window.dispatchEvent(new Event("wl-storage"));
  } catch {}
}

/** 기기 열쇠 머리말 — 게시판(레시피 공유방)처럼 이 파일 밖에서 회원으로 부를 때 */
export function authHeader() {
  const t = read(TOKEN);
  return t ? { authorization: `Bearer ${t}` } : {};
}
