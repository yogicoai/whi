"use client";

// 위스키 이름으로 찾기 — 입력이 멈춘 뒤에 묻는다. 별칭·영문 이름으로도 찾힌다.
// onPick 을 주면 고르는 용도(내 바에 담기), 안 주면 위스키 화면으로 간다.

import { useEffect, useRef, useState } from "react";
import WhiskyRow from "./WhiskyRow";
import Icon from "./Icon";

export default function SearchBox({ autoFocus = false, onPick = null, placeholder = "위스키 이름 · 영문도 돼요" }) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const seq = useRef(0);

  useEffect(() => {
    const term = q.trim();
    if (!term) {
      setItems([]);
      return;
    }
    const mine = ++seq.current;
    const id = setTimeout(async () => {
      setBusy(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
        const data = await res.json();
        // 늦게 온 옛 응답이 새 결과를 덮지 않게
        if (mine === seq.current) setItems(data.items || []);
      } catch {
        if (mine === seq.current) setItems([]);
      } finally {
        if (mine === seq.current) setBusy(false);
      }
    }, 220);
    return () => clearTimeout(id);
  }, [q]);

  return (
    <div className="search">
      <label className="search-field">
        <Icon name="search" size={20} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          enterKeyHint="search"
          aria-label="위스키 찾기"
        />
        {q && (
          <button className="icon-btn" onClick={() => setQ("")} aria-label="지우기">
            <Icon name="close" size={18} />
          </button>
        )}
      </label>
      {q.trim() && (
        <div className="search-results" aria-busy={busy}>
          {items.map((w) =>
            onPick ? (
              <button key={w.id} className="pick-row" onClick={() => { onPick(w); setQ(""); }}>
                <WhiskyRowStatic w={w} />
                <span className="pick-add"><Icon name="plus" size={18} /></span>
              </button>
            ) : (
              <WhiskyRow key={w.id} w={w} />
            )
          )}
          {!busy && !items.length && <p className="note dim">찾는 위스키가 없어요. 이름을 조금 줄여서 다시 찾아보세요.</p>}
        </div>
      )}
    </div>
  );
}

// 고르는 용도에서는 줄 자체가 링크이면 안 된다 — 같은 모양을 링크 없이 그린다
function WhiskyRowStatic({ w }) {
  return (
    <span className="wrow wrow-static">
      <span className="wrow-shot">{w.image ? <img src={w.image} alt="" loading="lazy" /> : <span className="wrow-blank" />}</span>
      <span className="wrow-body">
        <strong>{w.name}</strong>
        <span className="wrow-meta">{w.type}</span>
      </span>
    </span>
  );
}
