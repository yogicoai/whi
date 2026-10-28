import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 작업 기준 폴더를 이 저장소로 못 박는다.
  // 비워 두면 Next 가 C:\Users\Yogibo Design\package-lock.json 을 보고 홈 폴더를 기준으로 잡는데,
  // 그러면 산출물 이름에 Dropbox 의 한글 폴더 이름이 섞여 Turbopack 이 글자 중간을 자르다 죽는다
  // ("start byte index … is not a char boundary" — wine 저장소에서 2026-10-27 에 겪었다).
  turbopack: { root: dirname(fileURLToPath(import.meta.url)) },
  // 개발 서버 왼쪽 아래의 Next 표시를 끈다 — 떠 있는 탭바를 가리고, 개발 화면을 그대로 보여 줄 때 헷갈린다
  devIndicators: false,
  // 음료 그림·사진(public/)은 기본값이면 볼 때마다 서버에 바뀌었는지 묻는다 — 하루는 그대로 쓰고, 그 뒤 일주일은
  // 쓰면서 뒤에서 새로 받아 둔다. 파일 이름이 그대로라 그림을 바꾸면(npm run photos) 손님 폰에는 하루쯤 늦게 바뀐다.
  // 글꼴(app/fonts)은 Next 가 이름에 해시를 붙여 1년 저장으로 내보내니 따로 적지 않는다.
  async headers() {
    const cache = [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }];
    return ["/drinks3d/:path*", "/drinks/:path*", "/steps/:path*"].map((source) => ({ source, headers: cache }));
  },
};

export default nextConfig;
