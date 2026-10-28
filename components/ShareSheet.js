"use client";

// 레시피 보내기 — 이름·한 줄 메모·보내는 사람을 적고 링크나 카드 이미지로 보낸다.
//
// 로그인도 서버 저장도 없다(회원 기능 전 1단계). 비율·위스키·양·이름·메모가 모두 주소에 들어가서,
// 받은 사람이 열면 같은 레시피가 "○○님의 레시피" 띠와 함께 열린다. 그 링크를 카톡에 붙이면
// 미리보기로 레시피 카드(/api/card …&size=og)가 뜬다. 보내면 내 레시피에도 그 이름으로 남긴다.

import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import { LIMITS, shareQuery } from "@/lib/share";
import { getNick, setNick, upsertSaved, bumpStat } from "@/lib/saved";
import { track } from "@/lib/track";

/**
 * @param {object} props
 * @param {{key: string, whiskyId: string|null, ratio: number|string, shot: number}} props.mix
 * @param {object} props.save    내 레시피에 남길 나머지 칸 (recipeName · whiskyName · whiskyColor)
 * @param {{name?: string, memo?: string}} [props.initial]
 * @param {() => void} props.onClose
 */
export default function ShareSheet({ mix, save, initial, onClose }) {
  const [name, setName] = useState(initial?.name || "");
  const [memo, setMemo] = useState(initial?.memo || "");
  const [by, setBy] = useState("");
  const [preview, setPreview] = useState("");
  const [toast, setToast] = useState("");
  const [manual, setManual] = useState(""); // 복사가 막힌 브라우저 — 링크를 보여 주고 직접 복사하게
  const toastTimer = useRef(null);

  useEffect(() => setBy(getNick()), []);

  const query = shareQuery({ ...mix, name, memo, by });
  const cardUrl = (size) => `/api/card?k=${mix.key}&${query}&size=${size}`;

  // 카드 미리보기는 글자를 멈추고 잠시 뒤에 다시 그린다 — 한 글자마다 서버가 그리지 않게
  useEffect(() => {
    const id = setTimeout(() => setPreview(cardUrl("story")), 450);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // 열려 있는 동안 Esc 로 닫기
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const say = (text) => {
    setToast(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2200);
  };

  // 보낼 때마다 내 이름과 내 레시피를 남기고, 내 기록의 "보낸 레시피"를 하나 올린다
  const keep = () => {
    setNick(by.trim().slice(0, LIMITS.by));
    upsertSaved({ ...mix, ...save, name: name.trim() || null, memo: memo.trim() || null });
    bumpStat("sent");
    track("send", { recipeKey: mix.key, whiskyId: mix.whiskyId });
  };

  async function sendLink() {
    keep();
    const url = `${location.origin}/recipes/${mix.key}?${query}`;
    const title = name.trim() || save.recipeName;
    try {
      if (navigator.share) {
        await navigator.share({ title, text: `${title} — Whisky Lens 레시피`, url });
        return;
      }
    } catch (e) {
      if (e?.name === "AbortError") return; // 사용자가 공유 창을 닫았다
    }
    if (await copy(url)) {
      setManual("");
      say("링크를 복사했어요. 카톡에 붙여 보내 보세요");
    } else {
      setManual(url);
      say("아래 링크를 길게 눌러 복사해 주세요");
    }
  }

  async function sendImage() {
    keep();
    try {
      const blob = await fetch(cardUrl("story")).then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.blob();
      });
      const file = new File([blob], `${(name.trim() || save.recipeName).replace(/[\\/:*?"<>|]/g, "")}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: name.trim() || save.recipeName });
          return;
        } catch (e) {
          if (e?.name === "AbortError") return;
        }
      }
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = file.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      say("카드 이미지를 저장했어요");
    } catch {
      say("이미지를 만들지 못했어요. 잠시 뒤 다시 해 주세요");
    }
  }

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <section className="sheet" role="dialog" aria-modal="true" aria-label="레시피 보내기">
        <div className="sheet-grip" />
        <h2 className="sheet-title">레시피 보내기</h2>
        <p className="sheet-sub">받은 사람이 열면 이 비율 그대로 열려요. 내 레시피에도 이 이름으로 남아요.</p>

        <label className="field">
          <span>레시피 이름</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={LIMITS.n} placeholder={`예: 퇴근 ${save.recipeName}`} enterKeyHint="next" />
        </label>
        <label className="field">
          <span>한 줄 메모 (선택)</span>
          <input value={memo} onChange={(e) => setMemo(e.target.value)} maxLength={LIMITS.m} placeholder="예: 탄산은 세게, 레몬 껍질은 꼭" enterKeyHint="next" />
        </label>
        <label className="field">
          <span>보내는 사람 (선택)</span>
          <input value={by} onChange={(e) => setBy(e.target.value)} maxLength={LIMITS.by} placeholder="예: 민수" enterKeyHint="done" />
        </label>

        {manual && (
          <label className="field">
            <span>보낼 링크</span>
            <input value={manual} readOnly onFocus={(e) => e.target.select()} />
          </label>
        )}

        <div className="sheet-preview">{preview && <img src={preview} alt="보낼 레시피 카드 미리보기" />}</div>

        <div className="sheet-actions">
          <button className="btn-ghost" onClick={sendImage}>
            <Icon name="image" size={18} />
            <span>카드 이미지</span>
          </button>
          <button className="btn-primary" onClick={sendLink}>
            <Icon name="share" size={18} />
            <span>링크 보내기</span>
          </button>
        </div>
      </section>
      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  );
}

/** 클립보드에 넣기 — 안 되는 브라우저는 숨긴 입력칸으로 */
async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}
