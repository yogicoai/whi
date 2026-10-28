"use client";

// 내 바 — 가진 재료를 고르고 가진 위스키를 담으면, 지금 만들 수 있는 레시피가 바로 아래에 뜬다.
// 고르는 것과 결과를 한 화면에 둔다 — 하나 고를 때마다 결과가 바뀌는 걸 보여야 고를 맛이 난다.

import { useEffect, useState } from "react";
import RecipeCard from "./RecipeCard";
import SearchBox from "./SearchBox";
import Icon from "./Icon";
import { MIXERS, ADDINS } from "@/lib/mixes";
import { EXTRAS } from "@/lib/cocktails";
import { BAR_MIXERS, BAR_ADDINS, BAR_EXTRAS, makeable } from "@/lib/bar";

// 고르는 줄 — 섞는 것 · 맛 더하기 · 칵테일 재료
const GROUPS = [
  { field: "mixers", label: "섞는 것", keys: BAR_MIXERS, name: (k) => MIXERS[k].name.replace("차가운 ", "") },
  { field: "addins", label: "맛 더하기", keys: BAR_ADDINS, name: (k) => ADDINS[k].name },
  { field: "extras", label: "칵테일 재료", keys: BAR_EXTRAS, name: (k) => EXTRAS[k].name },
];
import { getBar, setBar } from "@/lib/saved";

export default function BarClient() {
  const [bar, setState] = useState(null);

  useEffect(() => setState(getBar()), []);
  if (!bar) return <div className="panel skeleton" />;

  const update = (next) => {
    setState(next);
    setBar(next);
  };
  const toggle = (field, key) =>
    update({ ...bar, [field]: bar[field].includes(key) ? bar[field].filter((k) => k !== key) : [...bar[field], key] });
  const addWhisky = (w) => {
    if (bar.whiskies.some((x) => x.id === w.id)) return;
    update({ ...bar, whiskies: [w, ...bar.whiskies] });
  };
  const removeWhisky = (id) => update({ ...bar, whiskies: bar.whiskies.filter((w) => w.id !== id) });

  const list = makeable(bar);

  return (
    <>
      <section className="panel">
        <h2 className="h2">가진 재료</h2>
        {GROUPS.map((g) => (
          <div key={g.field}>
            <span className="chips-cap">{g.label}</span>
            <div className="chips">
              {g.keys.map((k) => {
                const on = bar[g.field].includes(k);
                return (
                  <button key={k} className={`chip ${on ? "is-on" : ""}`} aria-pressed={on} onClick={() => toggle(g.field, k)}>
                    {on && <Icon name="check" size={15} />}
                    {g.name(k)}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      <section className="panel">
        <h2 className="h2">가진 위스키</h2>
        <SearchBox onPick={addWhisky} placeholder="가진 위스키를 찾아 담기" />
        {bar.whiskies.length > 0 && (
          <ul className="mine">
            {bar.whiskies.map((w) => (
              <li key={w.id}>
                <span className="wrow-shot">{w.image ? <img src={w.image} alt="" loading="lazy" decoding="async" /> : <span className="wrow-blank" />}</span>
                <span className="wrow-body"><strong>{w.name}</strong><span className="wrow-meta">{w.type}</span></span>
                <button className="icon-btn" onClick={() => removeWhisky(w.id)} aria-label={`${w.name} 빼기`}>
                  <Icon name="close" size={18} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="h2">지금 만들 수 있는 레시피</h2>
          {list.length > 0 && <span className="count">{list.length}</span>}
        </div>
        {list.length ? (
          <div className="grid">
            {list.map(({ recipe, whisky }) => (
              <RecipeCard
                key={recipe.key}
                recipe={recipe}
                href={whisky ? `/recipes/${recipe.key}?w=${whisky.id}` : `/recipes/${recipe.key}`}
                whiskyColor={whisky?.liquidColor || undefined}
                badge={whisky ? whisky.name : "위스키만 있으면"}
              />
            ))}
          </div>
        ) : (
          <p className="note dim">위에서 가진 재료를 하나 이상 골라 주세요.</p>
        )}
      </section>
    </>
  );
}
