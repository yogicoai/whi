// 약관 화면(/terms · /privacy · /youth) — 지금 판 본문, 위에 "시행일 · 제N판". 바뀔 판이 정해져 있으면 "○월 ○일부터 바뀌어요"와
// 접어 둔 새 판. 아직 게시한 판이 없으면 "준비 중"(검색엔진에도 올리지 않는다 — 각 page.js 의 generateMetadata).
// 보이스 동화(Dong) components/legal/LegalPage.tsx 를 옮겼다.

import Link from "next/link";
import LegalDocView from "./LegalDocView";
import SiteFooter from "./SiteFooter";
import { LEGAL_KINDS, dotDate, longDate } from "@/lib/legal";
import { getLegal } from "@/lib/server/legal";

export async function legalMetadata(kind) {
  const { current } = await getLegal(kind);
  const title = `${LEGAL_KINDS[kind].title} — Whisky Lens`;
  return current ? { title } : { title, robots: { index: false } };
}

export default async function LegalPage({ kind }) {
  const { title } = LEGAL_KINDS[kind];
  const { current, upcoming } = await getLegal(kind);
  return (
    <main className="page page-narrow legal-page">
      <p className="legal-crumb">
        <Link href="/">Whisky Lens</Link> · 약관
      </p>
      <h1 className="legal-title">{current?.title || title}</h1>
      {current ? (
        <>
          <p className="legal-meta">
            시행일 {dotDate(current.effectiveDate)} · 제{current.version}판
          </p>
          {upcoming && (
            <details className="legal-next">
              <summary>
                {longDate(upcoming.effectiveDate).replace(/^\d+년 /, "")}부터 바뀌어요 — 바뀌는 판 보기
              </summary>
              <LegalDocView body={upcoming.body} />
            </details>
          )}
          <LegalDocView body={current.body} />
        </>
      ) : (
        <div className="panel legal-soon">
          <strong>준비 중이에요</strong>
          <p>{upcoming ? `${longDate(upcoming.effectiveDate)}부터 시행해요.` : `${title}은 곧 이 자리에 올라와요.`}</p>
        </div>
      )}
      <SiteFooter />
    </main>
  );
}
