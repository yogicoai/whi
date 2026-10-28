// 기기에 남기는 것 — 내 레시피(저장한 비율), 내 바(가진 재료·위스키), 공유할 때 쓰는 내 이름.
//
// 아직 회원 기능이 없어서(19세 인증과 함께 클라이언트 결정 대기) 브라우저에 둔다.
// 회원이 붙으면 이 파일의 읽기·쓰기만 서버로 바꾸면 된다.
// 사생활 보호 모드처럼 저장소가 막힌 곳에서도 화면이 깨지지 않게 모두 try 로 감싼다.

const KEYS = { saved: "wl.saved", bar: "wl.bar", nick: "wl.nick", stats: "wl.stats" };

function read(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event("wl-storage"));
  } catch {}
}

export const sameMix = (a, b) =>
  a.key === b.key && a.whiskyId === b.whiskyId && a.ratio === b.ratio && a.shot === b.shot;

export function getSaved() {
  return read(KEYS.saved, []);
}

/** 저장돼 있으면 빼고, 없으면 맨 앞에 넣는다. 저장된 상태가 되었는지를 돌려준다. */
export function toggleSaved(item) {
  const list = getSaved();
  const i = list.findIndex((x) => sameMix(x, item));
  if (i >= 0) {
    list.splice(i, 1);
    write(KEYS.saved, list);
    return false;
  }
  write(KEYS.saved, [{ ...item, at: Date.now() }, ...list].slice(0, 100));
  return true;
}

/** 있으면 이름·메모 같은 것만 고쳐 쓰고, 없으면 맨 앞에 넣는다 — 공유할 때 그 이름으로 남긴다 */
export function upsertSaved(item) {
  const list = getSaved();
  const i = list.findIndex((x) => sameMix(x, item));
  if (i >= 0) list[i] = { ...list[i], ...item };
  else list.unshift({ ...item, at: Date.now() });
  write(KEYS.saved, list.slice(0, 100));
}

export function getBar() {
  const bar = read(KEYS.bar, null);
  return { mixers: bar?.mixers || [], addins: bar?.addins || [], extras: bar?.extras || [], whiskies: bar?.whiskies || [] };
}

export function setBar(bar) {
  write(KEYS.bar, bar);
}

/** 공유할 때 "보낸 사람"에 넣는 내 이름 — 한 번 적으면 다음에도 채워 둔다(가입하면 닉네임) */
export const getNick = () => read(KEYS.nick, "");
export const setNick = (nick) => write(KEYS.nick, nick);

/** 내 기록 — 보낸 레시피 수(sent) · 만드는 과정을 끝까지 본 수(made). 내 레시피 위 프로필에 보여 준다 */
export const getStats = () => ({ sent: 0, made: 0, ...read(KEYS.stats, {}) });
export function bumpStat(key) {
  const stats = getStats();
  write(KEYS.stats, { ...stats, [key]: (stats[key] || 0) + 1 });
}
