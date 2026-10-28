// 위스키 상세 — 위스키 정보가 주인공이다(맛 · 이야기 · 곁들이면 좋은 것 · 비슷한 위스키). 섞어 마시는 법(황금레시피 ·
// 이렇게 섞어 드세요 · 칵테일)은 그 아래 부가 코너 — 2026-10-27 저녁 사용자 결정("주는 위스키 정보, 음료 제조법은 부").
// 넓은 화면(PC)에서는 두 칸 — 왼쪽에 병(따라 내려온다), 오른쪽에 정보 그리고 함께 마시는 법.
// 가격은 "N만원대"만 말한다 — 매장·시기마다 달라 숫자 하나로 말하면 틀린 말이 된다(2026-10-01 방향).

import Link from "next/link";
import { notFound } from "next/navigation";
import BackButton from "@/components/BackButton";
import RecipeCard from "@/components/RecipeCard";
import GoldenCard from "@/components/GoldenCard";
import { getWhisky, findByName, flavored } from "@/lib/whiskies";
import { cocktailPlan } from "@/lib/cocktails";
import { PRICE_BANDS } from "@/lib/look";
import { goldenFor } from "@/lib/golden";

export async function generateMetadata({ params }) {
  const { id } = await params;
  return { title: `${getWhisky(id)?.name || "위스키"} — Whisky Lens` };
}

export default async function WhiskyPage({ params }) {
  const { id } = await params;
  const w = getWhisky(id);
  if (!w) notFound();

  const { plan } = w;
  const picks = plan.recipes.slice(0, plan.picks);
  const others = plan.recipes.slice(plan.picks);
  // 칵테일은 잘 맞는(2 이상) 것만 — 하이볼처럼 "다른 레시피"로 접어 둘 만큼 많지 않다.
  // 맛을 더한 위스키(애플 · 허니)는 칵테일을 권하지 않는다(실제 제품 추천 lib/picks.js 와 같은 기준)
  const cocktails = flavored(w) ? [] : cocktailPlan(w).list.filter((c) => c.score >= 2);
  const similar = (w.similar || []).map((n) => ({ name: n, hit: findByName(n) }));
  // 이 위스키로 유명한 조합 — 잭 다니엘 테네시면 잭콕, 산토리 가쿠빈이면 가쿠 하이볼
  const golden = goldenFor({ whiskyId: w.id });
  const facts = [w.type?.replace(/\s*\(.*\)$/, ""), w.country, w.alcohol, w.priceBand && PRICE_BANDS[w.priceBand]].filter(Boolean);

  return (
    <main className="page page-detail">
      <BackButton fallback="/" />

      <div className="detail-layout">
        <section className="w-hero" style={{ "--liquid": w.liquidColor || "#c8862a" }}>
          <div className="w-bottle">{w.image ? <img src={w.image} alt={w.name} fetchPriority="high" /> : null}</div>
          <h1 className="display">{w.name}</h1>
          {w.nameEn && <p className="w-en">{w.nameEn}</p>}
          <div className="facts">
            {facts.map((f) => (
              <span key={f}>{f}</span>
            ))}
          </div>
          {w.dailyshot?.reviews > 0 && (
            <p className="w-social">
              ★ {w.dailyshot.rating ?? "-"} · 데일리샷 후기 {w.dailyshot.reviews.toLocaleString()}개
              {w.dailyshot.url && (
                <>
                  {" · "}
                  <a href={w.dailyshot.url} target="_blank" rel="noopener noreferrer" className="link-more">데일리샷에서 보기</a>
                </>
              )}
            </p>
          )}
        </section>

        <div className="detail-info">
          {w.tasteProfile?.length > 0 && (
            <section className="panel">
              <h2 className="h2">맛</h2>
              <div className="taste">
                {w.tasteProfile.map((a) => (
                  <div key={a.axis} className="taste-row">
                    <span>{a.axis}</span>
                    <span className="taste-bar"><i style={{ width: `${Math.max(4, Math.min(100, a.value))}%` }} /></span>
                  </div>
                ))}
              </div>
              {w.tastingNotes && <p className="body">{w.tastingNotes}</p>}
            </section>
          )}

          {w.story && (
            <section className="panel">
              <h2 className="h2">이야기</h2>
              <p className="body">{w.story}</p>
            </section>
          )}

          {w.foodPairing?.length > 0 && (
            <section className="panel">
              <h2 className="h2">곁들이면 좋은 것</h2>
              <ul className="pairs">
                {w.foodPairing.map((p) => (
                  <li key={p.food}>
                    <span className="pair-emoji">{p.emoji}</span>
                    <span><strong>{p.food}</strong><span className="wrow-meta">{p.why}</span></span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {similar.length > 0 && (
            <section className="section">
              <h2 className="h2">비슷한 위스키</h2>
              <div className="chips">
                {similar.map(({ name, hit }) =>
                  hit ? (
                    <Link key={name} href={`/whisky/${hit.id}`} className="chip">{name}</Link>
                  ) : (
                    <span key={name} className="chip chip-plain">{name}</span>
                  )
                )}
              </div>
            </section>
          )}
        </div>

        {/* 부(附) — 이 위스키와 함께 마시는 법. 위스키 정보가 먼저다(2026-10-27 저녁 사용자 결정) */}
        <div className="detail-mix addon">
          <p className="addon-label">이 위스키와 함께</p>
          <h2 className="addon-title">이렇게도 마셔요</h2>
          {golden.length > 0 && (
            <section className="section">
              <h2 className="h2">이 위스키의 황금레시피</h2>
              <p className="note dim">사람들이 이 위스키로 가장 많이 만든 조합이에요.</p>
              <div className="rail">
                {golden.map((g) => (
                  <GoldenCard key={g.name} g={g} />
                ))}
              </div>
            </section>
          )}

          {picks.length > 0 && (
            <section className="section">
              <h2 className="h2">이렇게 섞어 드세요</h2>
              {plan.styleNote && <p className="lead">{plan.styleNote}</p>}
              <div className="rail">
                {picks.map((r, i) => (
                  <RecipeCard
                    key={r.key}
                    recipe={r}
                    href={`/recipes/${r.key}?w=${w.id}`}
                    whiskyColor={w.liquidColor || undefined}
                    badge={i === 0 ? "가장 잘 맞아요" : null}
                    priority={i < 2}
                  />
                ))}
              </div>
              {others.length > 0 && (
                <div className="chips">
                  {others.map((r) => (
                    <Link key={r.key} href={`/recipes/${r.key}?w=${w.id}`} className="chip">{r.name}</Link>
                  ))}
                </div>
              )}
              {plan.notes.map((n) => <p key={n} className="note warn">{n}</p>)}
            </section>
          )}

          {cocktails.length > 0 && (
            <section className="section">
              <h2 className="h2">칵테일로도</h2>
              <div className="rail">
                {cocktails.map((c) => (
                  <RecipeCard key={c.key} recipe={c} href={`/recipes/${c.key}?w=${w.id}`} whiskyColor={w.liquidColor || undefined} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
