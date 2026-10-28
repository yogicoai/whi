"use client";

// 내 레시피 — 저장한 비율 그대로 다시 연다. 같은 하이볼이라도 사람마다 맞는 비율이 다르다.
// 이름(보낼 때 붙인 것)이 있으면 이름을 크게, 누가 보낸 레시피면 그 사람 이름을 함께 연다.

import { useEffect, useState } from "react";
import Link from "next/link";
import DrinkGlass from "./DrinkGlass";
import Icon from "./Icon";
import { recipeOf, isCocktail, variantOf } from "@/lib/cocktails";
import { drinkPhoto } from "@/lib/photos";
import { LOOK } from "@/lib/look";
import { shareQuery } from "@/lib/share";
import { getSaved, toggleSaved } from "@/lib/saved";

export default function SavedClient() {
  const [list, setList] = useState(null);

  useEffect(() => {
    const read = () => setList(getSaved());
    read();
    window.addEventListener("wl-storage", read);
    return () => window.removeEventListener("wl-storage", read);
  }, []);

  if (list == null) return <div className="skeleton" />;
  if (!list.length) {
    return (
      <div className="empty">
        <strong>아직 저장한 레시피가 없어요</strong>
        <p>레시피에서 비율을 고르고 저장을 누르면 여기 모여요. 다음엔 고민 없이 바로 만들 수 있어요.</p>
        <Link href="/recipes" className="btn-primary">레시피 둘러보기</Link>
      </div>
    );
  }

  return (
    <ul className="saved">
      {list.map((s) => {
        const recipe = recipeOf(s.key);
        if (!recipe) return null;
        // 칵테일은 ratio 칸에 맛 조절 이름이 들어 있다 ("dry" → "덜 달게")
        const spec = isCocktail(recipe) ? variantOf(recipe, s.ratio).label : `1 : ${s.ratio}`;
        const qs = shareQuery({ whiskyId: s.whiskyId, ratio: s.ratio, shot: s.shot, name: s.name, memo: s.memo, by: s.by, mine: !s.by });
        const photo = drinkPhoto(s.key);
        return (
          <li key={`${s.key}-${s.whiskyId}-${s.ratio}-${s.shot}`} style={{ "--card": LOOK[s.key]?.color }}>
            <Link href={`/recipes/${s.key}?${qs}`} className="saved-link">
              <span className="saved-art">
                {photo ? (
                  <img src={photo} alt="" loading="lazy" decoding="async" />
                ) : (
                  <DrinkGlass recipe={recipe} whiskyColor={s.whiskyColor || undefined} shot={s.shot} ratio={s.ratio} id={`s-${s.at}`} />
                )}
              </span>
              <span className="saved-body">
                <strong>{s.name || s.recipeName}</strong>
                <span>{[s.name && s.recipeName, s.whiskyName || "어떤 위스키든", s.by && `${s.by}님이 보냄`].filter(Boolean).join(" · ")}</span>
                <span className="saved-spec">{spec} · 위스키 {s.shot}ml</span>
              </span>
            </Link>
            <button className="icon-btn" onClick={() => toggleSaved(s)} aria-label="저장 취소">
              <Icon name="close" size={18} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
