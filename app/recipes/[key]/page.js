// 레시피 상세 — 고른 위스키로 비율을 맞추고 만드는 과정을 본다.
//
// ?w=위스키 · ?r=비율(칵테일은 맛 조절 이름) · ?s=위스키 양 을 받는다. 내 레시피에서 열면 저장한 그대로 열린다.
// 공유 링크로 들어오면 ?n=이름 · ?m=메모 · ?by=보낸 사람 이 더 붙는다(lib/share.js) — 위에 띠로 보여 주고,
// 카톡 미리보기에는 그 레시피 카드(/api/card)를 건다.
// 위스키를 고르지 않고 들어오면 이 레시피가 가장 잘 맞는 인기 위스키를 먼저 골라 둔다.
// 하이볼류는 MixStudio, 칵테일은 CocktailStudio 가 몸통을 맡는다 — 받는 값은 같다.

import Link from "next/link";
import { notFound } from "next/navigation";
import BackButton from "@/components/BackButton";
import MixStudio from "@/components/MixStudio";
import CocktailStudio from "@/components/CocktailStudio";
import WhiskyRow from "@/components/WhiskyRow";
import { RATIOS, SHOTS } from "@/lib/mixes";
import { recipeOf, isCocktail } from "@/lib/cocktails";
import { readShared, shareQuery, sharedLabel } from "@/lib/share";
import { getWhisky, whiskiesForRecipe, brief } from "@/lib/whiskies";
import { copyOf, getRecipeSettings } from "@/lib/server/settings";
import { goldenFor } from "@/lib/golden";
import { withRo } from "@/lib/look";

const first = (v) => (Array.isArray(v) ? v[0] : v);

export async function generateMetadata({ params, searchParams }) {
  const { key } = await params;
  const sp = await searchParams;
  const recipe = recipeOf(key);
  if (!recipe) return { title: "레시피 — Whisky Lens" };

  const shared = readShared(sp);
  const whisky = first(sp.w) ? getWhisky(first(sp.w)) : null;
  const title = shared?.name ? `${shared.name} — ${recipe.name}` : `${recipe.name} — Whisky Lens`;
  const description =
    [shared && !shared.mine && sharedLabel(shared), whisky?.name, shared?.memo].filter(Boolean).join(" · ") || recipe.why;
  const card = `/api/card?k=${key}&${shareQuery({ whiskyId: whisky?.id, ratio: first(sp.r), shot: first(sp.s), ...shared })}&size=og`;
  return {
    title,
    description,
    openGraph: { title, description, images: [{ url: card, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [card] },
  };
}

export default async function RecipePage({ params, searchParams }) {
  const { key } = await params;
  const sp = await searchParams;
  const recipe = recipeOf(key);
  if (!recipe) notFound();
  const cocktail = isCocktail(recipe);
  const [w, r, s] = [first(sp.w), first(sp.r), first(sp.s)];

  const fits = whiskiesForRecipe(key, 12);
  const picked = (w && getWhisky(w)) || fits[0] || null;
  const ratio = cocktail
    ? recipe.variants.some((v) => v.key === r) ? r : null
    : RATIOS.some((o) => o.ratio === Number(r)) ? Number(r) : null;
  const shot = SHOTS.some((o) => o.ml === Number(s)) ? Number(s) : null;
  const Studio = cocktail ? CocktailStudio : MixStudio;
  // 어드민이 고친 한 줄 설명 · 팁(숨긴 레시피도 공유 링크로는 열린다)
  const copy = copyOf(recipe, await getRecipeSettings());
  // 이 레시피로 유명한 조합(잭콕 · 가쿠 하이볼 …) — 누르면 그 위스키 · 그 비율로 다시 열린다
  const golden = goldenFor({ recipeKey: key });

  return (
    <main className="page page-detail">
      <BackButton fallback="/recipes" />
      <Studio
        key={`${key}-${picked?.id}-${ratio}-${shot}`}
        recipeKey={key}
        whisky={picked ? brief(picked) : null}
        initialRatio={ratio}
        initialShot={shot}
        shared={readShared(sp)}
        copy={copy}
      >
        {golden.length > 0 && (
          <section className="panel">
            <h2 className="h2">황금레시피</h2>
            <p className="note dim">사람들이 이 레시피를 이렇게 불러요. 누르면 그 위스키와 비율로 바뀌어요.</p>
            <div className="chips">
              {golden.map((g) => (
                <Link key={g.name} href={g.href} className="chip">
                  {g.name}
                  {g.ratioLabel && <small className="chip-sub">{g.ratioLabel}</small>}
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="section" id="whiskies">
          <h2 className="h2">{withRo(recipe.name)} 마시기 좋은 위스키</h2>
          <div className="list">
            {fits.map((x) => (
              <WhiskyRow
                key={x.id}
                w={brief(x)}
                href={`/recipes/${key}?w=${x.id}`}
                note={x.id === picked?.id ? "지금 고른 위스키" : null}
              />
            ))}
          </div>
        </section>
      </Studio>
    </main>
  );
}
