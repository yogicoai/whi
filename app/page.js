// 홈 — 위스키가 주인공이다(2026-10-27 저녁 사용자 결정: 주는 다양한 위스키 정보, 섞어 마시는 법은 부).
//   1. 벤토(첫 화면) — 크기가 다른 타일 바둑판(2026-10-28 사용자: 힉스필드 예제 ③ 배치 + 흰 바탕).
//      가장 큰 칸은 오늘의 위스키, 작은 칸은 섞어 마시기 맛보기(1:3 · 황금레시피 · 실제 제품 · 잭콕)와 찾기
//   2. 종류로 둘러보기 · 인기 위스키 · 처음이라면 · 가격대로
//   3. 부(附) "위스키와 함께" — 내 바로 지금 만들 수 있는 것 · 많이 만드는 레시피 · 황금레시피 · 실제 제품으로 만드는 레시피 · 칵테일
// 오늘의 위스키는 후기 많은 인기 위스키를 한국 날짜로 하루에 하나씩 돌린다(lib/whiskies.js todayWhisky).
// 벤토 칸 배치는 globals.css — 폰 두 칸, 태블릿 · PC 네 칸.

import Link from "next/link";
import RecipeCard from "@/components/RecipeCard";
import GoldenCard from "@/components/GoldenCard";
import WhiskyCard from "@/components/WhiskyCard";
import ProductPickCard from "@/components/ProductPickCard";
import HomeBanner from "@/components/HomeBanner";
import SiteFooter from "@/components/SiteFooter";
import Icon from "@/components/Icon";
import Brand from "@/components/Brand";
import { HomeMe, ForYou } from "@/components/HomeClient";
import { productPicks } from "@/lib/picks";
import { goldenList } from "@/lib/golden";
import { drinkPhoto } from "@/lib/photos";
import { arrange, getActiveBanners, getPickSettings, getRecipeSettings } from "@/lib/server/settings";
import { RECIPES } from "@/lib/mixes";
import { COCKTAILS } from "@/lib/cocktails";
import { POPULAR_ORDER, PRICE_BANDS } from "@/lib/look";
import { KINDS, kindOf, kindCounts, browseWhiskies, todayWhisky, brief } from "@/lib/whiskies";

// 어드민 설정(레시피 노출·순서, 추천 고정·제외, 배너)을 읽는다 — 어드민이 바꾸면 그 자리에서 새로 그리고(revalidatePath),
// 그렇지 않아도 5분마다 한 번 새로 그린다(오늘의 위스키도 그때 날짜를 본다)
export const revalidate = 300;

/** 맛 설명의 첫 문장 — 넓은 화면의 오늘의 위스키 칸에 한 줄로 */
const firstLine = (s) => (s ? s.split(/(?<=[.!?])\s/)[0] : "");

export default async function Home() {
  const [recipeSettings, pickSettings, banners] = await Promise.all([getRecipeSettings(), getPickSettings(), getActiveBanners()]);
  const today = todayWhisky();
  const todayKind = today && kindOf(today);
  const counts = kindCounts();
  const browse = browseWhiskies({ limit: 8 }); // total 은 위스키 탭 첫 줄과 같은 수
  const total = browse.total;
  const popular = browse.items.map(brief);
  const easy = browseWhiskies({ easy: true, limit: 8 }).items.map(brief);
  const mixes = arrange(POPULAR_ORDER.map((k) => RECIPES[k]), recipeSettings).slice(0, 6);
  const cocktails = arrange(Object.values(COCKTAILS), recipeSettings);
  const golden = goldenList().slice(0, 8);
  const jack = goldenList().find((g) => g.name === "잭콕");
  const picks = productPicks(pickSettings)[0].list.slice(0, 8);
  const pick = picks[0];
  return (
    <main className="page page-home">
      <div className="home-top">
        <Brand size={30} className="home-brand" />
        <HomeMe />
      </div>
      <h1 className="home-title">
        오늘은 어떤 위스키를
        <br />
        마셔 볼까요?
      </h1>

      <div className="bento">
        {today && (
          <Link href={`/whisky/${today.id}`} className="bt bt-today" style={{ "--liquid": today.liquidColor || "#c8862a" }}>
            <span className="bt-eyebrow">오늘의 위스키</span>
            <span className="bt-today-shot">
              <img src={today.image} alt="" fetchPriority="high" />
            </span>
            <span className="bt-today-copy">
              <strong className="bt-today-name">{today.name}</strong>
              <span className="bt-today-meta">
                {[today.dailyshot?.rating && `★ ${today.dailyshot.rating}`, todayKind?.name, PRICE_BANDS[today.priceBand]].filter(Boolean).join(" · ")}
              </span>
              {today.tastingNotes && <span className="bt-today-note">{firstLine(today.tastingNotes)}</span>}
            </span>
            <Icon name="arrow" size={20} className="bt-go" />
          </Link>
        )}

        <Link href="/recipes/highball?r=3" className="bt bt-ratio">
          <Icon name="glass" size={26} className="bt-icon" />
          <span>
            <strong className="bt-big">1:3</strong>
            <small>가장 많이 섞는 비율</small>
          </span>
        </Link>

        <div className="bt bt-golden">
          <Link href="/golden" className="bt-head">
            <Icon name="trophy" size={26} className="bt-icon" />
            황금레시피
          </Link>
          <ol className="bt-rank">
            {golden.slice(0, 5).map((g, i) => (
              <li key={g.name}>
                <Link href={g.href}>
                  <b>{i + 1}</b>
                  <span>{g.name}</span>
                  <Icon name="chevron" size={16} />
                </Link>
              </li>
            ))}
          </ol>
        </div>

        {pick && (
          <Link href="/picks" className="bt bt-pick" style={{ "--liquid": pick.whisky.liquidColor || "#c8862a" }}>
            <span className="bt-pick-shot">{pick.whisky.image && <img src={pick.whisky.image} alt="" loading="lazy" decoding="async" />}</span>
            <span className="bt-pick-copy">
              <Icon name="bottle" size={22} className="bt-icon" />
              <strong>실제 제품으로 만드는 레시피</strong>
              <small>{pick.whisky.name} · {pick.recipe.name}</small>
            </span>
          </Link>
        )}

        <Link href="/search" className="bt bt-search" aria-label="위스키 이름으로 찾기">
          <small className="bt-search-note">{total.toLocaleString()}종 가운데 이름으로 찾아요</small>
          <span className="bt-search-pill">
            <Icon name="search" size={20} />
            <span>위스키 찾기</span>
            <Icon name="arrow" size={18} />
          </span>
        </Link>

        {jack && (
          <Link href={jack.href} className="bt bt-jack">
            <img src={drinkPhoto(jack.recipeKey)} alt="" loading="lazy" decoding="async" />
            <span className="bt-label">
              <span>
                {jack.name}
                <small>{jack.ratioLabel}</small>
              </span>
              <Icon name="chevron" size={16} />
            </span>
          </Link>
        )}
      </div>

      <HomeBanner banners={banners} />

      <section className="section">
        <div className="section-head">
          <h2 className="h2">종류로 둘러보기</h2>
          <Link href="/whiskies" className="link-more">전체</Link>
        </div>
        <div className="kind-grid">
          {KINDS.map((k) => (
            <Link key={k.key} href={`/whiskies?kind=${k.key}`} className="kind-tile">
              <strong>{k.name}</strong>
              <span>{k.note}</span>
              <small>{counts[k.key].toLocaleString()}종</small>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="h2">인기 위스키</h2>
          <Link href="/whiskies" className="link-more">전체</Link>
        </div>
        <p className="note dim">데일리샷 후기가 많은 순서예요.</p>
        <div className="rail">
          {popular.map((w) => (
            <WhiskyCard key={w.id} w={w} />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="h2">처음이라면</h2>
          <Link href="/whiskies?easy=1" className="link-more">전체</Link>
        </div>
        <p className="note dim">맛이 부드럽고 구하기 쉬운 위스키예요.</p>
        <div className="rail">
          {easy.map((w) => (
            <WhiskyCard key={w.id} w={w} />
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="h2">가격대로</h2>
        <div className="chips">
          {Object.entries(PRICE_BANDS).map(([b, name]) => (
            <Link key={b} href={`/whiskies?band=${b}`} className="chip">{name}</Link>
          ))}
        </div>
      </section>

      {/* 부(附) — 위스키와 함께 마시는 법 */}
      <div className="addon">
        <p className="addon-label">위스키와 함께</p>
        <h2 className="addon-title">이렇게 섞어 마셔요</h2>
        <p className="note dim">가진 위스키에 탄산수 · 콜라만 있으면 되는 한 잔부터.</p>

        <ForYou />

        <section className="section">
          <div className="section-head">
            <h2 className="h2">많이 만드는 레시피</h2>
            <Link href="/recipes" className="link-more">전체</Link>
          </div>
          <div className="rail">
            {mixes.map((r, i) => (
              <RecipeCard key={r.key} recipe={r} badge={i === 0 && r.key === "highball" ? "가장 기본" : null} />
            ))}
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <h2 className="h2">황금레시피</h2>
            <Link href="/golden" className="link-more">전체</Link>
          </div>
          <p className="note dim">잭콕 · 가쿠 하이볼처럼 사람들이 가장 많이 섞어 마시는 조합과 비율이에요.</p>
          <div className="rail">
            {golden.map((g) => (
              <GoldenCard key={g.name} g={g} />
            ))}
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <h2 className="h2">실제 제품으로 만드는 한 잔</h2>
            <Link href="/picks" className="link-more">전체</Link>
          </div>
          <div className="rail">
            {picks.map((p) => (
              <ProductPickCard key={p.id} pick={p} />
            ))}
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <h2 className="h2">칵테일과 따뜻한 한 잔</h2>
            <Link href="/recipes#cocktails" className="link-more">전체</Link>
          </div>
          <div className="rail">
            {cocktails.map((c) => (
              <RecipeCard key={c.key} recipe={c} />
            ))}
          </div>
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
