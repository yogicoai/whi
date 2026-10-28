// 앱 이름 "Whisky Lens" 로고 — 마크(위스키가 반쯤 담긴 렌즈) + 글자(Whisky 굵게 · Lens 호박색).
// 2026-10-28 사용자: "이 부분이 앱 이름이라 디자인 요소를 넣어 달라". 홈 위 · PC 위쪽 메뉴 · 어드민이 같이 쓴다.
// 마크는 그라데이션 · clipPath 없이 단색 도형만 쓴다 — 한 화면에 여러 개가 있고 그중 하나가 display:none 이면
// 같은 id 를 가리키는 다른 마크의 색이 빠지기 때문이다(술 윗면은 원과 만나는 점을 계산해 그렸다).

/** 마크 — 검은 렌즈 테, 그 안에 호박색 술(윗면 잔물결)과 반쯤 잠긴 얼음, 테 왼쪽 위에 빛 반사 */
export function BrandMark({ size = 28, className = "" }) {
  return (
    <svg className={`brand-mark ${className}`} width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <circle cx="16" cy="16" r="13.5" fill="#fff" />
      <rect x="8.9" y="10.5" width="7.4" height="7.4" rx="1.8" transform="rotate(-14 12.6 14.2)" fill="#fff" stroke="#b5772a" strokeWidth="1.3" />
      <path d="M4.01 15.5C8.5 13.9 11.5 17.1 16 15.5S23.5 13.9 27.99 15.5A12 12 0 1 1 4.01 15.5Z" fill="#c8862a" fillOpacity="0.9" />
      <circle cx="16" cy="16" r="13.5" fill="none" stroke="#1d1b18" strokeWidth="3" />
      <path d="M3.77 10.29A13.5 13.5 0 0 1 9.25 4.31" fill="none" stroke="#fff" strokeOpacity="0.8" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

/** 마크 + 글자. size 는 마크 크기 — 글자는 CSS(.brand-word)가 정한다 */
export default function Brand({ size = 28, className = "" }) {
  return (
    <span className={`brand ${className}`}>
      <BrandMark size={size} />
      <span className="brand-word">
        Whisky <b>Lens</b>
      </span>
    </span>
  );
}
