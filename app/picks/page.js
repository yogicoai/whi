// 실제 제품으로 만드는 레시피 — 묶음별(후기 많은 · 5만원 이하 · 처음이라면 · 칵테일)로 제품과 레시피 짝을 보여 준다.
// 짝은 lib/picks.js 가 규칙으로 고른다. 제품 정보는 data/whiskies.json(데일리샷 별점·후기·가격대).

import BackButton from "@/components/BackButton";
import ProductPickCard from "@/components/ProductPickCard";
import { productPicks } from "@/lib/picks";
import { getPickSettings } from "@/lib/server/settings";

export const metadata = { title: "실제 제품으로 만드는 레시피 — Whisky Lens" };
export const revalidate = 300; // 어드민이 고정·제외를 바꾸면 그 자리에서 새로 그린다(revalidatePath)

export default async function PicksPage() {
  const groups = productPicks(await getPickSettings());
  return (
    <main className="page page-detail">
      <BackButton fallback="/" />
      <h1 className="display">실제 제품으로 만드는 레시피</h1>
      <p className="lead">많이 마시는 위스키마다 잘 맞는 레시피를 짝지었어요. 누르면 그 위스키로 비율이 맞춰져요.</p>
      {groups.map((g) => (
        <section key={g.id} id={g.id} className="section">
          <h2 className="h2">{g.title}</h2>
          <p className="note dim">{g.note}</p>
          <div className="pgrid">
            {g.list.map((p) => (
              <ProductPickCard key={p.id} pick={p} />
            ))}
          </div>
        </section>
      ))}
      <p className="note dim">별점·후기 수는 데일리샷 기준이고, 가격은 매장·시기마다 달라 가격대로만 적었어요.</p>
    </main>
  );
}
