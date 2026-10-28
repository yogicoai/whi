"use client";

// 어드민 레시피·추천 — (1) 레시피 14종의 노출 · 순서 · 한 줄 설명 · 팁, (2) 실제 제품 추천의 맨 앞 고정 · 제품 빼기.
// 저장하면 손님 화면이 그 자리에서 새로 그려진다(API 가 revalidatePath). 빈칸은 코드에 적힌 기본 문구를 쓴다.

import { useEffect, useState } from "react";
import { adminApi } from "./api";

export default function AdminRecipes() {
  return (
    <>
      <h1 className="admin-title">레시피·추천</h1>
      <p className="admin-sub">숨긴 레시피는 홈·레시피 목록에서 빠져요(공유 링크로는 열려요). 빈칸은 원래 문구를 써요.</p>
      <RecipeSettings />
      <PickSettings />
    </>
  );
}

function RecipeSettings() {
  const [recipes, setRecipes] = useState(null);
  const [settings, setSettings] = useState({});
  const [saved, setSaved] = useState("{}");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    adminApi("GET", "/api/admin/recipes")
      .then((d) => {
        setRecipes(d.recipes);
        setSettings(d.settings);
        setSaved(JSON.stringify(d.settings));
      })
      .catch((e) => setMsg(e.message));
  }, []);

  if (!recipes) return <div className="skeleton" />;
  const changed = JSON.stringify(settings) !== saved;
  const set = (key, patch) => setSettings((s) => ({ ...s, [key]: { ...s[key], ...patch } }));

  async function save() {
    setMsg("");
    try {
      const d = await adminApi("PUT", "/api/admin/recipes", { settings });
      setSettings(d.settings);
      setSaved(JSON.stringify(d.settings));
      setMsg("저장했어요. 손님 화면에 바로 반영돼요.");
    } catch (e) {
      setMsg(e.message);
    }
  }

  let group = null;
  return (
    <section className="acard">
      <div className="acard-head">
        <h2>레시피 {recipes.length}종</h2>
        <button className="btn-primary" disabled={!changed} onClick={save}>저장</button>
      </div>
      {msg && <p className="note">{msg}</p>}
      <div className="recipe-rows">
        {recipes.map((r) => {
          const s = settings[r.key] || {};
          const head = r.group !== group ? (group = r.group) : null;
          return (
            <div key={r.key}>
              {head && <h3 className="recipe-group">{head}</h3>}
              <div className={`recipe-row ${s.hidden ? "is-hidden" : ""}`}>
                <div className="recipe-row-top">
                  <strong>{r.name}</strong>
                  <label className="mini-field">
                    순서
                    <input type="number" min="1" max="99" value={s.order ?? ""} placeholder="기본" onChange={(e) => set(r.key, { order: e.target.value === "" ? null : Number(e.target.value) })} />
                  </label>
                  <span className="row-switch">
                    {s.hidden ? "숨김" : "보임"}
                    <button className={`switch ${s.hidden ? "" : "is-on"}`} role="switch" aria-checked={!s.hidden} aria-label={`${r.name} 보이기`} onClick={() => set(r.key, { hidden: !s.hidden })} />
                  </span>
                </div>
                <label className="field">
                  <span>한 줄 설명</span>
                  <input value={s.why || ""} placeholder={r.why} maxLength={120} onChange={(e) => set(r.key, { why: e.target.value })} />
                </label>
                <label className="field">
                  <span>팁</span>
                  <textarea rows={2} value={s.tip || ""} placeholder={r.tip} maxLength={300} onChange={(e) => set(r.key, { tip: e.target.value })} />
                </label>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PickSettings() {
  const [d, setD] = useState(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => adminApi("GET", "/api/admin/picks").then(setD).catch((e) => setMsg(e.message));
  useEffect(() => {
    load();
  }, []);

  if (!d) return <div className="skeleton" />;
  const { pinned, excluded } = d.settings;

  async function update(next) {
    setBusy(true);
    setMsg("");
    try {
      await adminApi("PUT", "/api/admin/picks", { settings: { ...d.settings, ...next } });
      await load();
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  }

  const togglePin = (id) => update({ pinned: pinned.includes(id) ? pinned.filter((x) => x !== id) : [...pinned, id] });
  const exclude = (whiskyId) => update({ excluded: [...excluded, whiskyId], pinned: pinned.filter((x) => !x.startsWith(`${whiskyId}-`)) });
  const restore = (whiskyId) => update({ excluded: excluded.filter((x) => x !== whiskyId) });

  return (
    <section className="acard">
      <h2>실제 제품으로 만드는 레시피</h2>
      <p className="note dim">규칙이 데일리샷 후기 · 가격대 · 마시기 쉬운 정도로 고른 짝이에요. 고정한 짝은 홈 줄 맨 앞에 나와요.</p>
      {msg && <p className="note warn">{msg}</p>}
      {d.groups.map((g) => (
        <div key={g.id} className="pick-group">
          <h3 className="recipe-group">{g.title}</h3>
          <ul className="pick-rows">
            {g.list.map((p) => {
              const isPinned = pinned.includes(p.id);
              return (
                <li key={p.id}>
                  {p.whisky.image ? <img src={p.whisky.image} alt="" /> : <span className="wrow-blank" />}
                  <span className="pick-text">
                    <strong>{p.whisky.name}</strong>
                    <small>{p.recipe.name} · ★ {p.whisky.rating ?? "-"} · 후기 {p.whisky.reviews.toLocaleString()} · {p.whisky.price || "-"}</small>
                  </span>
                  {isPinned && <span className="badge ok">고정</span>}
                  {g.id === "popular" && (
                    <button className="btn-ghost s" disabled={busy} onClick={() => togglePin(p.id)}>{isPinned ? "고정 풀기" : "맨 앞 고정"}</button>
                  )}
                  <button className="btn-danger" disabled={busy} onClick={() => exclude(p.whisky.id)}>빼기</button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      {d.excludedWhiskies.length > 0 && (
        <div className="pick-group">
          <h3 className="recipe-group">뺀 제품</h3>
          <div className="chips">
            {d.excludedWhiskies.map((w) => (
              <button key={w.id} className="chip" disabled={busy} onClick={() => restore(w.id)}>
                {w.name} · 다시 넣기
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
