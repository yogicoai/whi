// 황금레시피 — 사람들이 블로그·카페에 많이 남긴 조합(잭콕 · 가쿠 하이볼 …)과 비율. 데이터와 셈법은 lib/golden.js.
// 카드 아래에 "글에 적힌 비율"을 함께 적는다 — 사람마다 비율이 다르다는 것 자체가 이 코너의 재미다.

import BackButton from "@/components/BackButton";
import GoldenCard from "@/components/GoldenCard";
import { GOLDEN_META, goldenList } from "@/lib/golden";

export const metadata = {
  title: "황금레시피 — Whisky Lens",
  description: "잭콕 · 가쿠 하이볼 · 짐빔 하이볼… 사람들이 가장 많이 섞어 마시는 조합과 비율.",
};

export default function GoldenPage() {
  const list = goldenList();
  return (
    <main className="page page-detail">
      <BackButton fallback="/" />
      <h1 className="display">황금레시피</h1>
      <p className="lead">사람들이 블로그·카페에 가장 많이 남긴 조합과 비율이에요. 누르면 그 위스키, 그 비율로 열려요.</p>

      <section className="section">
        <ol className="golden-list">
          {list.map((g, i) => (
            <li key={g.name}>
              <GoldenCard g={g} priority={i < 2} />
              <div className="golden-meta">
                {g.votesText && <p><b>글에 적힌 비율</b> {g.votesText}</p>}
                {g.extras.length > 0 && <p><b>곁들이는 것</b> {g.extras.join(" · ")}</p>}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <p className="note dim">
        {GOLDEN_META.source} 기준({GOLDEN_META.collectedAt}). 글 수는 검색 결과 가운데 그 조합을 실제로 쓴 글의 비율로 셈한
        추정치예요. 캔 제품·술집 메뉴 글이 섞여 있어 순위는 참고로만 봐 주세요.
      </p>
    </main>
  );
}
