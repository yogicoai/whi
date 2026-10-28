// 약관 본문 그리기 — 손님 화면(/terms · /privacy · /youth)과 어드민 미리보기가 같이 쓴다.
// 본문은 글자로만 그린다(lib/legal.js parseLegal) — HTML 을 넣지 않으니 본문에 무엇을 적어도 화면에 스크립트가 끼지 않는다.

import { parseLegal } from "@/lib/legal";

export default function LegalDocView({ body }) {
  return (
    <div className="legal-body">
      {parseLegal(body).map((b, i) => {
        if (b.type === "h2") return <h2 key={i}>{b.text}</h2>;
        if (b.type === "h3") return <h3 key={i}>{b.text}</h3>;
        if (b.type === "hr") return <hr key={i} />;
        if (b.type === "ul") return <ul key={i}>{b.items.map((t, j) => <li key={j}>{t}</li>)}</ul>;
        if (b.type === "ol") return <ol key={i} start={b.start}>{b.items.map((t, j) => <li key={j}>{t}</li>)}</ol>;
        return <p key={i}>{b.text}</p>;
      })}
    </div>
  );
}
