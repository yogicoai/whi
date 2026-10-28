"use client";

// 어드민 대시보드 — 회원 수 · 이용 기록(저장·보내기·만들어 봄) · 최근 14일 흐름 · 인기 레시피와 제품.
// 숫자는 app/api/admin/dashboard(lib/server/activity.js dashboard)에서 온다.

import { useEffect, useState } from "react";
import { adminApi } from "./api";
import { DayBars, RankBars } from "./Charts";

export default function AdminDashboard() {
  const [d, setD] = useState(null);
  const [error, setError] = useState("");

  const load = () => {
    setError("");
    adminApi("GET", "/api/admin/dashboard").then(setD).catch((e) => setError(e.message));
  };
  useEffect(load, []);

  if (error) return <p className="note warn">{error} <button className="btn-ghost" onClick={load}>다시</button></p>;
  if (!d) return <div className="skeleton" />;

  const a = d.activity;
  const pct = d.members.total ? Math.round((d.members.marketing / d.members.total) * 100) : 0;
  const tiles = [
    { label: "전체 회원", value: d.members.total, sub: `오늘 가입 ${d.members.today}명` },
    { label: "이벤트·혜택 알림 동의", value: d.members.marketing, sub: `회원의 ${pct}%` },
    { label: "이용 정지", value: d.members.suspended, sub: "회원 메뉴에서 풀 수 있어요" },
    { label: "레시피 저장", value: a.total.save || 0, sub: `최근 7일 ${a.week.save || 0}` },
    { label: "레시피 보내기", value: a.total.send || 0, sub: `최근 7일 ${a.week.send || 0}` },
    { label: "만들어 본 것", value: a.total.made || 0, sub: `최근 7일 ${a.week.made || 0} · 만드는 과정 끝까지` },
  ];

  return (
    <>
      <h1 className="admin-title">대시보드</h1>
      <p className="admin-sub">회원과 이용 기록을 한눈에. 이용 기록은 회원·비회원 모두 셉니다.</p>

      <div className="kpis">
        {tiles.map((t) => (
          <div key={t.label} className="kpi">
            <span>{t.label}</span>
            <b>{t.value.toLocaleString()}</b>
            <small>{t.sub}</small>
          </div>
        ))}
      </div>

      <div className="agrid2">
        <section className="acard">
          <h2>최근 14일 가입</h2>
          <DayBars data={d.joinsByDay} unit="명" />
        </section>
        <section className="acard">
          <h2>최근 14일 이용 기록</h2>
          <DayBars data={d.activityByDay} unit="건" />
        </section>
        <section className="acard">
          <h2>인기 레시피</h2>
          <p className="note dim">저장 · 보내기 · 만들어 봄을 합친 수</p>
          <RankBars rows={d.topRecipes.map((r) => ({ label: r.name, n: r.n }))} unit="건" />
        </section>
        <section className="acard">
          <h2>인기 제품</h2>
          <p className="note dim">위스키를 골라 저장 · 보내기 · 만들어 본 수</p>
          <RankBars rows={d.topWhiskies.map((r) => ({ label: r.name, n: r.n }))} unit="건" />
        </section>
      </div>
    </>
  );
}
