// 하이볼 잔 그림 — 몇 번째 단계인지를 받아 그린다.
//
// 상태가 없는 그림이라 서버에서도 그린다(레시피 카드의 완성된 잔). 만드는 과정 연출은
// MixStudio 가 단계를 넘겨 주고, 얼음이 떨어지고 술이 차오르는 것은 CSS 전환이 맡는다.
// 층의 높이는 부피에 비례한다 — 청·시럽은 무거워 바닥에 깔리고 위스키가 그 위에 뜬다.
// 나중에 힉스필드 그림으로 바꿔도 이 컴포넌트 자리만 갈아끼우면 된다.

import { MIXERS, ADDINS, GARNISH } from "@/lib/mixes";

const BOTTOM = 119;
const TOP = 38;
const ICE = [[37, 104], [53, 101], [41, 88], [56, 84], [45, 71], [59, 67]];
const BUBBLES = [
  [42, 113, 0], [50, 109, 0.6], [61, 115, 1.2], [69, 110, 0.3],
  [46, 101, 1.6], [65, 104, 0.9], [55, 116, 2], [71, 99, 1.4],
];

function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function mixHex(a, b, r) {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  if (!x || !y) return a;
  return `#${x.map((v, i) => Math.round(v + (y[i] - v) * r).toString(16).padStart(2, "0")).join("")}`;
}

export const DEFAULT_WHISKY = "#c8862a";

/**
 * @param {object} props
 * @param {object} props.recipe  lib/mixes.js 의 레시피
 * @param {object[]} props.steps stepsOf(recipe)
 * @param {number} props.stage   지금 단계 (steps.length 면 완성)
 * @param {object} props.amounts amountsOf(...)
 * @param {string} [props.whiskyColor]
 * @param {string} [props.id]    clipPath 이름 — 한 화면에 잔이 여럿이면 서로 달라야 한다
 */
export default function Glass({ recipe, steps, stage, amounts, whiskyColor = DEFAULT_WHISKY, id = "g" }) {
  const mixer = MIXERS[recipe.mixer];
  const add = recipe.addin ? ADDINS[recipe.addin] : null;
  const at = (act) => {
    const i = steps.findIndex((s) => s.act === act);
    return i >= 0 && i <= stage;
  };
  const now = steps[stage]?.act || null;

  const full = BOTTOM - TOP;
  const total = amounts.whisky + (amounts.addin?.ml || 0) + amounts.mixer.ml;
  const aH = add && at("addin") ? (full * amounts.addin.ml) / total : 0;
  const wH = at("whisky") ? (full * amounts.whisky) / total : 0;
  const mH = at("mixer") ? (full * amounts.mixer.ml) / total : 0;
  const surface = BOTTOM - aH - wH - mH;

  const mixed = at("lift");
  let blend = mixHex(whiskyColor, mixer.tint, mixer.clear ? 0.45 : 0.75);
  if (add) blend = mixHex(blend, add.tint, 0.18);
  const garnish = recipe.garnish !== "none" && at("garnish") ? GARNISH[recipe.garnish] : null;
  const pourColor =
    now === "whisky" ? whiskyColor : now === "addin" ? add?.tint : mixer.clear ? "#d8ecf1" : mixer.tint;

  const layer = (y, h, fill, opacity, slow) => ({
    y,
    height: h,
    style: {
      fill: mixed ? blend : fill,
      opacity: mixed ? 0.9 : opacity,
      transition: `y ${slow}s ease, height ${slow}s ease, fill 1.2s ease, opacity 1.2s ease`,
    },
  });

  return (
    <svg viewBox="0 0 110 140" className="glass-svg" aria-hidden="true">
      <defs>
        <clipPath id={`clip-${id}`}>
          <path d="M34 20L35.8 119H74.2L76 20Z" />
        </clipPath>
      </defs>

      {/* 붓는 줄기 — 술 뒤로 바닥까지 내려 차오르는 수면 아래로 잠기게 한다 */}
      {(now === "whisky" || now === "addin" || now === "mixer") && (
        <rect key={now} x="54" y="0" width="2.4" height={BOTTOM} rx="1.2" fill={pourColor} opacity="0.9" className="g-pour" />
      )}

      <g clipPath={`url(#clip-${id})`}>
        {add && <rect x="30" width="50" {...layer(BOTTOM - aH, aH, add.tint, 0.92, 1)} />}
        <rect x="30" width="50" {...layer(BOTTOM - aH - wH, wH, whiskyColor, 0.88, 1.2)} />
        <rect x="30" width="50" {...layer(surface, mH, mixer.tint, Math.max(mixer.opacity, 0.22), 1.4)} />
        {aH + wH + mH > 0 && (
          <rect x="30" y={surface} width="50" height="1.4" className="g-surface" style={{ transition: "y 1.4s ease" }} />
        )}

        {ICE.map(([x, y], i) => (
          <rect
            key={i} x={x} y={y} width="14" height="13" rx="3" className="g-ice"
            style={{
              transform: at("ice") ? "translateY(0)" : "translateY(-90px)",
              opacity: at("ice") ? 1 : 0,
              transition: `transform .55s cubic-bezier(.3,1.35,.6,1) ${i * 0.09}s, opacity .25s ${i * 0.09}s`,
            }}
          />
        ))}

        {mixer.fizzy && at("mixer") &&
          BUBBLES.map(([x, y, d], i) => (
            <circle key={i} cx={x} cy={y} r={i % 3 ? 1.1 : 1.6} className="g-bubble" style={{ animationDelay: `${d}s` }} />
          ))}
      </g>

      {(now === "chill" || now === "stir" || now === "lift") && (
        <g className={`g-spoon ${now === "lift" ? "lift" : "stir"}`}>
          <path d="M62 4L57 114" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="57" cy="115" r="2.2" />
        </g>
      )}

      <path className="g-line" d="M32 18L34.5 124Q35 128 39 128H71Q75 128 75.5 124L78 18" fill="none" strokeWidth="2" />
      <path className="g-base" d="M36 121H74" strokeWidth="2" strokeLinecap="round" />

      {garnish && (
        <g className="g-garnish">
          <circle cx="76" cy="22" r="8.5" fill={garnish.color} stroke={garnish.rind} strokeWidth="1.6" />
          <path d="M76 14.5V29.5M69.5 18.3L82.5 25.7M69.5 25.7L82.5 18.3" stroke={garnish.rind} strokeWidth="0.8" opacity="0.7" />
        </g>
      )}
    </svg>
  );
}
