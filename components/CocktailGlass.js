// 칵테일 잔 그림 — 온더록 잔(올드패션드·위스키 사워·갓파더)과 머그(핫 토디).
//
// Glass.js 와 같은 방식이다. 몇 번째 단계인지를 받아 그 단계까지 일어난 일을 그리고, 움직임은 CSS 전환이 맡는다.
// 다른 점: 재료가 여럿이라 붓는 순서대로 층을 쌓는다. 흔드는 칵테일은 셰이커에서 섞여 한 번에 들어온다.
// 젓거나 흔들면 녹은 얼음물이 더해져 수면이 조금 오른다. 따뜻한 것은 얼음 대신 김이 오른다.
// 나중에 힉스필드 그림으로 바꿔도 이 컴포넌트 자리만 갈아끼우면 된다.

import { mixHex, DEFAULT_WHISKY } from "./Glass";
import { GARNISH } from "@/lib/mixes";

const SHAPES = {
  rocks: {
    clip: "M28.6 60L30.2 119H79.8L81.4 60Z",
    line: "M27 58L29 123Q29.5 128 34 128H76Q80.5 128 81 123L83 58",
    base: "M31 121H79",
    bottom: 119,
    top: 72,
    rim: [83, 58],
  },
  mug: {
    clip: "M27.6 46L29.4 121H78.6L80.4 46Z",
    line: "M26 44L28 123Q28.5 128 33 128H75Q79.5 128 80 123L82 44",
    handle: "M81.3 62Q97 62 97 82Q97 101 80.4 104",
    base: "M30 123H78",
    bottom: 121,
    top: 58,
    rim: [82, 44],
  },
};

// [x, y, 너비, 높이] — 올드패션드·갓파더는 큰 얼음 하나, 사워는 작은 얼음 여럿
const ICE = {
  big: [[40, 88, 30, 28]],
  cubes: [[33, 104, 14, 13], [51, 102, 14, 13], [64, 105, 13, 12], [41, 89, 14, 13], [57, 87, 14, 13]],
};
const STEAM = ["M44 40q-4-6 0-12t0-12", "M55 37q-4-6 0-12t0-12", "M66 40q-4-6 0-12t0-12"];
const MELT = { id: "melt", color: "#e4f1f4", clear: true, opacity: 0.16 };
const ORANGE = { color: "#f39a3a", rind: "#d9771c" };

/** 다 섞였을 때 색 — 색 있는 것은 양만큼 섞고, 맑은 것(물·시럽·녹은 얼음)은 그만큼 옅게 한다 */
function blendOf(layers) {
  let color = null;
  let colored = 0;
  let clear = 0;
  for (const l of layers) {
    if (l.clear) {
      clear += l.ml;
      continue;
    }
    colored += l.ml;
    color = color ? mixHex(color, l.color, l.ml / colored) : l.color;
  }
  if (!color) return MELT.color;
  return mixHex(color, "#f4efe6", Math.min(0.7, (clear / (clear + colored)) * 0.75));
}

/**
 * @param {object} props
 * @param {object} props.cocktail lib/cocktails.js 의 칵테일
 * @param {number} props.stage    지금 단계 (steps.length 면 완성)
 * @param {object} props.amounts  cocktailAmounts(...)
 * @param {string} [props.whiskyColor]
 * @param {string} [props.id]     clipPath 이름 — 한 화면에 잔이 여럿이면 서로 달라야 한다
 */
export default function CocktailGlass({ cocktail, stage, amounts, whiskyColor = DEFAULT_WHISKY, id = "c" }) {
  const shape = SHAPES[cocktail.glass];
  const steps = cocktail.steps;
  const now = steps[stage]?.act || null;
  const at = (act) => {
    const i = steps.findIndex((s) => s.act === act);
    return i >= 0 && i <= stage;
  };

  const whisky = { id: "whisky", ml: amounts.whisky, color: whiskyColor, opacity: 0.88 };
  const partOf = (pid) => (pid === "whisky" ? whisky : amounts.parts.find((p) => p.id === pid));
  const melt = { ...MELT, ml: amounts.dilution };
  const blend = blendOf([whisky, ...amounts.parts, melt]);

  // 잔에 들어오는 차례 — 다 붓기 전에도 층을 모두 그려 두고 높이만 0 으로 둔다.
  // 그래야 부을 때 수면에서부터 자라 오른다(없던 층이 튀어나오지 않는다).
  const order = [];
  let shaker = [];
  steps.forEach((s, i) => {
    const parts = (s.parts || []).map(partOf).filter(Boolean);
    if (s.act === "shaker") shaker = parts;
    else parts.forEach((l) => order.push({ l, at: i }));
    if (s.act === "strain") [...shaker, melt].forEach((l) => order.push({ l, at: i }));
    if (s.act === "stir") order.push({ l: melt, at: i });
  });
  const mixAt = steps.findIndex((s) => s.act === "stir" || s.act === "strain");
  const mixed = mixAt >= 0 && mixAt <= stage;

  const full = shape.bottom - shape.top;
  let surface = shape.bottom;
  const layers = order.map(({ l, at: when }, i) => {
    const h = when <= stage && l.ml > 0 ? (full * l.ml) / amounts.total : 0;
    surface -= h;
    return (
      <rect
        key={i} x="20" width="70" y={surface} height={h}
        style={{
          fill: mixed ? blend : l.color,
          opacity: mixed ? 0.9 : l.opacity ?? 0.85,
          transition: "y 1.2s ease, height 1.2s ease, fill 1.2s ease, opacity 1.2s ease",
        }}
      />
    );
  });

  const step = steps[stage];
  const pourColor = !step
    ? null
    : step.act === "warm"
      ? "#d8ecf1"
      : step.act === "strain"
        ? blend
        : (step.act === "pour" || step.act === "garnish") && step.parts?.length
          ? partOf(step.parts[0])?.color
          : null;
  const steaming =
    cocktail.method === "hot" && (now === "warm" || order.some(({ l, at: when }) => l.id === "water" && when <= stage));
  const garnish = cocktail.garnish !== "none" && at("garnish") ? (cocktail.garnish === "orange" ? ORANGE : GARNISH[cocktail.garnish]) : null;
  const [rx, ry] = shape.rim;

  return (
    <svg viewBox="0 0 110 140" className="glass-svg" aria-hidden="true">
      <defs>
        <clipPath id={`clip-${id}`}>
          <path d={shape.clip} />
        </clipPath>
      </defs>

      {/* 붓는 줄기 — 술 뒤로 바닥까지 내려 차오르는 수면 아래로 잠기게 한다 */}
      {pourColor && (
        <rect key={stage} x="54" y="0" width="2.4" height={shape.bottom} rx="1.2" fill={pourColor} opacity="0.9" className="g-pour" />
      )}

      <g clipPath={`url(#clip-${id})`}>
        {layers}
        {surface < shape.bottom && (
          <rect x="20" y={surface} width="70" height="1.4" className="g-surface" style={{ transition: "y 1.2s ease" }} />
        )}
        {cocktail.ice &&
          ICE[cocktail.ice].map(([x, y, w, h], i) => (
            <rect
              key={i} x={x} y={y} width={w} height={h} rx={w > 20 ? 4 : 3} className="g-ice"
              style={{
                transform: at("ice") ? "translateY(0)" : "translateY(-90px)",
                opacity: at("ice") ? 1 : 0,
                transition: `transform .55s cubic-bezier(.3,1.35,.6,1) ${i * 0.09}s, opacity .25s ${i * 0.09}s`,
              }}
            />
          ))}
      </g>

      {steaming && (
        <g className="g-steam">
          {STEAM.map((d, i) => (
            <path key={i} d={d} style={{ animationDelay: `${i * 0.7}s` }} />
          ))}
        </g>
      )}

      {(now === "shaker" || now === "shake") && (
        <g className={`g-shaker ${now === "shake" ? "shake" : ""}`}>
          <path d="M44 52L47 16H63L66 52Z" />
          <path d="M47 16Q47 6 55 6Q63 6 63 16Z" />
        </g>
      )}

      {now === "stir" && (
        <g className="g-spoon stir">
          <path d={`M64 ${shape.top - 34}L57 ${shape.bottom - 4}`} strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="57" cy={shape.bottom - 3} r="2.2" />
        </g>
      )}

      <path className="g-line" d={shape.line} fill="none" strokeWidth="2" />
      {shape.handle && <path className="g-line" d={shape.handle} fill="none" strokeWidth="2.4" strokeLinecap="round" />}
      <path className="g-base" d={shape.base} strokeWidth="2" strokeLinecap="round" />

      {garnish && cocktail.garnish === "orange" && (
        <path className="g-garnish" d={`M${rx - 9} ${ry + 3}q7-11 19-8q-8 8-19 8z`} fill={garnish.color} stroke={garnish.rind} strokeWidth="1.2" />
      )}
      {garnish && cocktail.garnish !== "orange" && (
        <g className="g-garnish">
          <circle cx={rx - 3} cy={ry + 3} r="8.5" fill={garnish.color} stroke={garnish.rind} strokeWidth="1.6" />
          <path
            d={`M${rx - 3} ${ry - 4.5}V${ry + 10.5}M${rx - 9.5} ${ry - 0.7}L${rx + 3.5} ${ry + 6.7}M${rx - 9.5} ${ry + 6.7}L${rx + 3.5} ${ry - 0.7}`}
            stroke={garnish.rind} strokeWidth="0.8" opacity="0.7"
          />
        </g>
      )}
    </svg>
  );
}
