// 어드민 화면에서 쓰는 API 호출 — 로그인이 풀렸으면(401) 화면을 새로 열어 로그인 창으로 돌아간다.

export async function adminApi(method, path, body) {
  const res = await fetch(path, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) {
    window.location.reload();
    throw new Error("다시 로그인해 주세요");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "잠시 뒤 다시 해 주세요");
  return data;
}

/** "2026.10.27 14:05" (한국 시각) */
export function stamp(iso) {
  if (!iso) return "-";
  const d = new Date(new Date(iso).getTime() + 9 * 3600 * 1000).toISOString();
  return `${d.slice(0, 10).replace(/-/g, ".")} ${d.slice(11, 16)}`;
}
