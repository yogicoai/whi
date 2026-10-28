// Cafe24(yogibo 오픈호스팅) 사진 올리기 — 모두의 레시피 게시판 사진(2026-10-28).
// 보틀 렌즈 lib/ftp.js 와 같은 방식이고 접속 정보(YOGIBO_FTP · YOGIBO_FTP_ID · YOGIBO_FTP_PW · FTP_PUBLIC_BASE)도 같다.
// 올리는 폴더만 위스키 전용(WHISKY_UPLOAD_DIR, 기본 /app/img/whisky/board/) — 보틀 렌즈 폴더(/app/img/wine/)와 섞지 않는다.
// 사진 파일은 DB 에 넣지 않는다(무료 512MB 를 빨리 채운다) — DB 에는 주소만.

import { Readable } from "node:stream";
import { Client } from "basic-ftp";

export const ftpReady = () => !!(process.env.YOGIBO_FTP && process.env.YOGIBO_FTP_ID && process.env.YOGIBO_FTP_PW && process.env.FTP_PUBLIC_BASE);

function dir() {
  const d = process.env.WHISKY_UPLOAD_DIR || "/app/img/whisky/board/";
  return d.endsWith("/") ? d : `${d}/`;
}

export const publicUrl = (name) => `${process.env.FTP_PUBLIC_BASE.replace(/\/+$/, "")}/${dir().replace(/^\/+/, "")}${name}`;

async function connect() {
  // 서버리스에서는 패시브 모드가 막힐 수 있다 — 오래 매달리지 않게 짧게 끊는다
  const client = new Client(10000);
  client.ftp.verbose = false;
  await client.access({
    host: process.env.YOGIBO_FTP,
    port: Number(process.env.CAFE24_FTP_PORT) || 21,
    user: process.env.YOGIBO_FTP_ID,
    password: process.env.YOGIBO_FTP_PW,
    secure: false,
  });
  await client.ensureDir(dir()); // 없으면 만들고 그 자리로 간다
  return client;
}

/** 여러 파일을 한 번 접속해서 올린다 — [{name, buffer}] → 공개 주소 목록 */
export async function uploadFiles(files) {
  if (!ftpReady()) throw new Error("사진 저장소(FTP) 설정이 없어요");
  const client = await connect();
  try {
    for (const f of files) await client.uploadFrom(Readable.from(f.buffer), f.name);
    return files.map((f) => publicUrl(f.name));
  } finally {
    client.close();
  }
}

/** 지우기 — 글을 지울 때. 실패해도 글 삭제는 막지 않는다(파일만 남는다) */
export async function removeFiles(urls) {
  if (!ftpReady() || !urls.length) return;
  const prefix = publicUrl("");
  const names = urls.filter((u) => u.startsWith(prefix)).map((u) => u.slice(prefix.length)).filter((n) => /^[\w.-]+$/.test(n));
  if (!names.length) return;
  let client;
  try {
    client = await connect();
    for (const n of names) await client.remove(n).catch(() => {});
  } catch (e) {
    console.error("[ftp remove]", e.message);
  } finally {
    client?.close();
  }
}
