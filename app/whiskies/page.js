// 위스키 — 아래 메뉴 "위스키" 탭. 1,142종을 종류 · 가격대 · 처음이라면으로 거르고 인기 · 별점 · 가격 순으로 본다.
// 2026-10-27 저녁 사용자 결정: 주(主)는 다양한 위스키 정보, 섞어 마시는 법은 부(附) — 그래서 레시피 탭 자리를 이 화면이 받았다.
// 거르는 칩은 링크라서 화면 상태가 주소에 남는다. "더 보기"는 30개씩 늘린다(?n=2 → 60개) — 스크롤 자리는 그대로 둔다.

import Link from "next/link";
import Icon from "@/components/Icon";
import WhiskyCard from "@/components/WhiskyCard";
import { KINDS, SORTS, browseWhiskies, brief } from "@/lib/whiskies";
import { PRICE_BANDS } from "@/lib/look";

export const metadata = { title: "위스키 — Whisky Lens", description: "블렌디드 · 싱글몰트 · 버번 · 재패니즈… 위스키 1,142종을 종류와 가격대로 둘러보기." };

const STEP = 30;

export default async function Whiskies({ searchParams }) {
  const sp = await searchParams;
  const kind = KINDS.some((k) => k.key === sp.kind) ? sp.kind : null;
  const band = PRICE_BANDS[sp.band] ? Number(sp.band) : null;
  const easy = sp.easy === "1";
  const sort = Object.hasOwn(SORTS, sp.sort) ? sp.sort : "popular";
  const page = Math.min(Math.max(Number(sp.n) || 1, 1), 40);
  const { total, items } = browseWhiskies({ kind, band, easy, sort, limit: STEP * page });
  const now = { kind, band, easy: easy ? "1" : null, sort: sort === "popular" ? null : sort };
  const href = (patch) => {
    const qs = new URLSearchParams(Object.entries({ ...now, ...patch }).filter(([, v]) => v != null && v !== ""));
    return qs.size ? `/whiskies?${qs}` : "/whiskies";
  };
  const kindNote = KINDS.find((k) => k.key === kind)?.note;

  return (
    <main className="page">
      <h1 className="display">위스키</h1>
      <p className="lead">{total.toLocaleString()}종 — 종류와 가격대로 골라 보세요.</p>
      <Link href="/search" className="search-field search-link">
        <Icon name="search" size={22} />
        <span>위스키 이름으로 찾기</span>
      </Link>

      <nav className="chips sticky-chips" aria-label="종류로 거르기">
        <Link href={href({ kind: null })} className={`chip ${!kind ? "is-on" : ""}`}>전체</Link>
        {KINDS.map((k) => (
          <Link key={k.key} href={href({ kind: k.key })} className={`chip ${kind === k.key ? "is-on" : ""}`}>{k.name}</Link>
        ))}
      </nav>
      {kindNote && <p className="note">{kindNote}</p>}

      <div className="chips" aria-label="가격대 · 처음이라면">
        <Link href={href({ easy: easy ? null : "1" })} className={`chip ${easy ? "is-on" : ""}`}>처음이라면</Link>
        {Object.entries(PRICE_BANDS).map(([b, name]) => (
          <Link key={b} href={href({ band: band === Number(b) ? null : b })} className={`chip ${band === Number(b) ? "is-on" : ""}`}>{name}</Link>
        ))}
      </div>

      <div className="sorts" role="group" aria-label="정렬">
        {Object.entries(SORTS).map(([key, name]) => (
          <Link key={key} href={href({ sort: key === "popular" ? null : key })} className={sort === key ? "is-on" : ""}>{name}</Link>
        ))}
      </div>

      <section className="section">
        {items.length ? (
          <div className="wgrid">
            {items.map((w, i) => (
              <WhiskyCard key={w.id} w={brief(w)} priority={i < 4} />
            ))}
          </div>
        ) : (
          <p className="note dim">맞는 위스키가 없어요. 거르는 조건을 줄여 보세요.</p>
        )}
        {items.length < total && (
          <Link href={href({ n: String(page + 1) })} scroll={false} className="btn-ghost wide">
            더 보기 ({items.length.toLocaleString()} / {total.toLocaleString()})
          </Link>
        )}
      </section>
      <p className="note dim">별점·후기 수는 데일리샷 기준이에요. 가격은 매장·시기마다 달라 가격대로만 적었어요.</p>
    </main>
  );
}
