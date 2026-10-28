// 시안 공통 — 로고 · 아이콘 · 아래 메뉴 · 데이터 도우미
const P = {
  home: "M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z",
  rocks: "M5 7h14l-1.5 12.3A2 2 0 0 1 15.5 21h-7a2 2 0 0 1-2-1.7zM5.6 12h12.8M9.5 14.5h4.5v3.5H9.5z",
  camera: "M4 8.5A1.5 1.5 0 0 1 5.5 7h2.3l1.4-2h5.6l1.4 2h2.3A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5zM12 16a3.3 3.3 0 1 0 0-6.6 3.3 3.3 0 0 0 0 6.6z",
  bar: "M6.5 3h3v3l1.5 2.5V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8.5L6.5 6zM15 8h2.5v2.5l1.5 2V20a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-7.5l2-2zM5 13h6",
  saved: "M7 3h10a1 1 0 0 1 1 1v17l-6-4-6 4V4a1 1 0 0 1 1-1z",
  arrow: "M5 12h14M13 6l6 6-6 6",
  search: "M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM20 20l-4.5-4.5",
  chevron: "M9.5 6l6 6-6 6",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20.5c1.2-3.6 4.2-5.5 7.5-5.5s6.3 1.9 7.5 5.5",
  trophy: "M8 4h8v5a4 4 0 0 1-8 0zM8 6H5v1a3 3 0 0 0 3 3M16 6h3v1a3 3 0 0 1-3 3M12 13v4M9 20.5h6M10 17h4v3.5h-4z",
};
const ic = (n, s = 22, w = 1.8) =>
  `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${P[n]}"/></svg>`;
const mark = (s = 28) => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" aria-hidden="true">
  <circle cx="16" cy="16" r="13.5" fill="#fff"/>
  <rect x="8.9" y="10.5" width="7.4" height="7.4" rx="1.8" transform="rotate(-14 12.6 14.2)" fill="#fff" stroke="#b5772a" stroke-width="1.3"/>
  <path d="M4.01 15.5C8.5 13.9 11.5 17.1 16 15.5S23.5 13.9 27.99 15.5A12 12 0 1 1 4.01 15.5Z" fill="#c8862a" fill-opacity="0.9"/>
  <circle cx="16" cy="16" r="13.5" fill="none" stroke="#1d1b18" stroke-width="3"/>
  <path d="M3.77 10.29A13.5 13.5 0 0 1 9.25 4.31" fill="none" stroke="#fff" stroke-opacity="0.8" stroke-width="1.1" stroke-linecap="round"/></svg>`;
const brand = (s = 28) => `<span class="brand">${mark(s)}<span class="bw">Whisky <b>Lens</b></span></span>`;
const tabs = () => `<nav class="tabbar">${[
  ["home", "홈", 1], ["rocks", "위스키"], ["camera", "찍기"], ["bar", "내 바"], ["saved", "내 레시피"],
].map(([i, l, on]) => `<a class="${on ? "on" : ""}">${ic(i, 23)}<span>${l}</span></a>`).join("")}</nav>`;
const PB = { 1: "2만원 이하", 2: "2~5만원", 3: "5~10만원", 4: "10~30만원", 5: "30만원 이상" };
const short = (t) => t.split(" · ")[0].replace(" 스카치", "").replace(" 위스키", "").replace("켄터키 스트레이트 ", "");
const img = (k) => `cut/${k}.webp`;
const mix = (hex, t, to = "#ffffff") => {
  const a = parseInt((hex || "#c8862a").slice(1), 16), b = parseInt(to.slice(1), 16);
  const c = [16, 8, 0].map((s) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t));
  return "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("");
};
const KINDS = [
  { ko: "블렌디드", en: "Blended", n: 185, k: "8", c: "#F1C36A", line: "여러 원액을 섞어 부드럽고 무난해요" },
  { ko: "싱글몰트", en: "Single Malt", n: 543, k: "11", c: "#E7D8BE", line: "한 증류소의 보리 원액, 향이 진해요" },
  { ko: "버번·테네시", en: "Bourbon", n: 174, k: "15", c: "#E08A4E", line: "옥수수로 만들어 바닐라처럼 달콤해요" },
  { ko: "재패니즈", en: "Japanese", n: 61, k: "x5", c: "#EBCFC2", line: "깔끔해서 하이볼로 많이 마셔요" },
  { ko: "피트(스모키)", en: "Peated", n: 70, k: "x4", c: "#AEB5A6", line: "연기 · 훈연 향이 나요" },
  { ko: "아이리시", en: "Irish", n: 38, k: "x2", c: "#A9CFA9", line: "가볍고 부드러워요" },
  { ko: "라이", en: "Rye", n: 42, k: "x3", c: "#CFAE84", line: "호밀로 만들어 알싸해요" },
];
const TODAY = "12"; // 몽키 숄더 — 실제 앱은 날마다 바뀐다
const POPULAR = ["0", "1", "2", "8", "7", "11"];
