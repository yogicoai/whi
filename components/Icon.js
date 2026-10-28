// 선 아이콘 — 1.8px 선 하나로 통일한다. 색은 글자색(currentColor)을 따른다.
// 힉스필드 아이콘 시트가 오면 여기만 바꾼다.

const PATHS = {
  home: "M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z",
  recipes: "M6 3h9l3 3v15H6zM15 3v3h3M9 11h6M9 15h6",
  scan: "M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M8.5 12a3.5 3.5 0 1 0 7 0 3.5 3.5 0 1 0-7 0",
  bar: "M6.5 3h3v3l1.5 2.5V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8.5L6.5 6zM15 8h2.5v2.5l1.5 2V20a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-7.5l2-2zM5 13h6",
  cocktail: "M4.5 4h15L12 12.5zM12 12.5V20M8 20h8M16 7.5l3-3",
  rocks: "M5 7h14l-1.5 12.3A2 2 0 0 1 15.5 21h-7a2 2 0 0 1-2-1.7zM5.6 12h12.8M9.5 14.5h4.5v3.5H9.5z",
  camera: "M4 8.5A1.5 1.5 0 0 1 5.5 7h2.3l1.4-2h5.6l1.4 2h2.3A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5zM12 16a3.3 3.3 0 1 0 0-6.6 3.3 3.3 0 0 0 0 6.6z",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20.5c1.2-3.6 4.2-5.5 7.5-5.5s6.3 1.9 7.5 5.5",
  chevron: "M9.5 6l6 6-6 6",
  saved: "M7 3h10a1 1 0 0 1 1 1v17l-6-4-6 4V4a1 1 0 0 1 1-1z",
  back: "M15 5l-7 7 7 7",
  search: "M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM20 20l-4.5-4.5",
  plus: "M12 5v14M5 12h14",
  check: "M5 12.5l4.5 4.5L19 7.5",
  play: "M8 5.5v13l11-6.5z",
  close: "M6 6l12 12M18 6 6 18",
  arrow: "M5 12h14M13 6l6 6-6 6",
  // 어드민 메뉴
  dashboard: "M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z",
  users: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c.8-3.3 3.4-5 6.5-5s5.7 1.7 6.5 5M16 4.6a3.3 3.3 0 0 1 0 6.3M18 14.6c1.8.7 3 2.5 3.5 5",
  megaphone: "M4 10v4a1 1 0 0 0 1 1h2l5 4V5L7 9H5a1 1 0 0 0-1 1zM16 8.5a4.5 4.5 0 0 1 0 7",
  building: "M5 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16M15 9h3a1 1 0 0 1 1 1v11M3 21h18M8.5 8h3M8.5 12h3M8.5 16h3",
  external: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
  logout: "M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h10",
  trophy:"M8 4h8v5a4 4 0 0 1-8 0zM8 6H5v1a3 3 0 0 0 3 3M16 6h3v1a3 3 0 0 1-3 3M12 13v4M9 20.5h6M10 17h4v3.5h-4z",
  glass: "M7 3.5h10l-1.3 16.3a1.3 1.3 0 0 1-1.3 1.2H9.6a1.3 1.3 0 0 1-1.3-1.2zM7.4 8.5h9.2M10.5 12h.01M13.5 14.5h.01M11 17h.01",
  bottle: "M10 3h4v4.5l1.5 2.5V20a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1V10L10 7.5zM8.5 13h7",
  spark: "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6",
  share: "M12 15V3.5M7.5 8 12 3.5 16.5 8M5 12.5V19a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6.5",
  image: "M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5zM4 16l4.5-4.5 4 4 3-3L20 17M15 9.5a1.5 1.5 0 1 0 0-.01",
};

export default function Icon({ name, size = 22, fill = false, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
