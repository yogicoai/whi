// 레시피 — 카드 상자. 위에서 맛(깔끔·상큼·달콤…)이나 재료로 거른다.
// 거르는 칩은 링크라서 화면 상태가 주소에 남는다 — 공유해도, 뒤로 가도 그대로다.
// 거르지 않으면 섞어 마시기 · 칵테일 · 따뜻한 한 잔으로 나눠 보여 주고, 거르면 한데 모은다.

import Link from "next/link";
import RecipeCard from "@/components/RecipeCard";
import { RECIPES, MIXERS } from "@/lib/mixes";
import { COCKTAILS } from "@/lib/cocktails";
import { LOOK, MOODS, POPULAR_ORDER } from "@/lib/look";
import { arrange, getRecipeSettings } from "@/lib/server/settings";

export const metadata = { title: "레시피 — Whisky Lens" };

const MIXES = POPULAR_ORDER.map((k) => RECIPES[k]);
const COLD = Object.values(COCKTAILS).filter((c) => c.method !== "hot");
const WARM = Object.values(COCKTAILS).filter((c) => c.method === "hot");

const SECTIONS = [
  { id: "mixes", title: "섞어 마시기", note: "위스키 1 에 믹서 3 에서 시작해요.", list: MIXES },
  { id: "cocktails", title: "칵테일", note: "재료 두세 가지를 젓거나 흔들어 만들어요.", list: COLD },
  { id: "warm", title: "따뜻한 한 잔", note: "얼음 대신 뜨거운 물로, 머그에.", list: WARM },
];

export default async function Recipes({ searchParams }) {
  const { mood, mixer } = await searchParams;
  // 어드민에서 숨긴 레시피는 빼고, 정한 순서대로
  const settings = await getRecipeSettings();
  const sections = SECTIONS.map((s) => ({ ...s, list: arrange(s.list, settings) })).filter((s) => s.list.length);
  const filtered = mood || mixer;
  const list = sections.flatMap((s) => s.list).filter(
    (r) => (!mood || LOOK[r.key].moods.includes(mood)) && (!mixer || r.mixer === mixer)
  );
  const mixerName = mixer && MIXERS[mixer]?.name.replace("차가운 ", "");

  return (
    <main className="page">
      <h1 className="display">레시피</h1>
      <p className="lead">위스키에 무엇을, 얼마나 섞을지.</p>

      <nav className="chips sticky-chips" aria-label="맛으로 거르기">
        <Link href="/recipes" className={`chip ${!filtered ? "is-on" : ""}`}>전체</Link>
        {MOODS.map((m) => (
          <Link key={m} href={`/recipes?mood=${encodeURIComponent(m)}`} className={`chip ${mood === m ? "is-on" : ""}`}>
            {m}
          </Link>
        ))}
        {mixerName && <span className="chip is-on">{mixerName}</span>}
      </nav>

      {filtered ? (
        list.length ? (
          <div className="grid">
            {list.map((r, i) => (
              <RecipeCard key={r.key} recipe={r} priority={i < 4} />
            ))}
          </div>
        ) : (
          <p className="note dim">맞는 레시피가 없어요.</p>
        )
      ) : (
        sections.map((s, si) => (
          <section key={s.id} id={s.id} className="section">
            <h2 className="h2">{s.title}</h2>
            <p className="note dim">{s.note}</p>
            <div className="grid">
              {s.list.map((r, i) => (
                <RecipeCard key={r.key} recipe={r} priority={si === 0 && i < 4} />
              ))}
            </div>
          </section>
        ))
      )}
    </main>
  );
}
