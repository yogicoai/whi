// 어드민 그림 — 날짜별 세로 막대(최근 14일)와 순위 가로 막대. 한 그림에 한 가지 값만 그린다(축 둘 금지).
// 막대 색은 --chart(#e8650a, 흰 바탕 대비 3:1 넘김 — dataviz 검사기 통과). 글자는 늘 글자색.
// 막대에 손가락·마우스를 대면 값이 뜨고, 그림마다 "표로 보기"가 있다.

/** @param {{data: {day: string, n: number}[], unit: string}} props */
export function DayBars({ data, unit }) {
  const max = Math.max(1, ...data.map((d) => d.n));
  return (
    <figure className="chart">
      <div className="vbars" role="img" aria-label={data.map((d) => `${d.day.slice(5)} ${d.n}${unit}`).join(", ")}>
        {data.map((d) => (
          <span key={d.day} className="vbar" tabIndex={0} style={{ "--h": `${(d.n / max) * 100}%` }}>
            <i />
            <span className="tip">
              {d.day.slice(5).replace("-", "/")} · {d.n}
              {unit}
            </span>
          </span>
        ))}
      </div>
      <div className="vbars-x" aria-hidden="true">
        {data.map((d, i) => (
          <span key={d.day}>{i % 2 === data.length % 2 ? "" : d.day.slice(5).replace("-", "/")}</span>
        ))}
      </div>
      <details className="chart-table">
        <summary>표로 보기</summary>
        <table className="atable">
          <tbody>
            {data.map((d) => (
              <tr key={d.day}><td>{d.day}</td><td className="num">{d.n}{unit}</td></tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

/** @param {{rows: {label: string, n: number}[], unit: string}} props */
export function RankBars({ rows, unit }) {
  if (!rows.length) return <p className="note dim">아직 기록이 없어요.</p>;
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <ol className="hbars">
      {rows.map((r, i) => (
        <li key={r.label} title={`${r.label} ${r.n}${unit}`}>
          <span className="hbar-rank">{i + 1}</span>
          <span className="hbar-label">{r.label}</span>
          <span className="hbar-track"><i style={{ width: `${Math.max(3, (r.n / max) * 100)}%` }} /></span>
          <span className="hbar-n">{r.n}{unit}</span>
        </li>
      ))}
    </ol>
  );
}
