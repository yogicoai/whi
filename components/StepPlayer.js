"use client";

// 만드는 과정 — 전체 화면에서 단계 사진을 한 장씩 넘겨 영상처럼 보여 준다(인스타 스토리처럼).
//
// 사진마다 천천히 다가가고(확대), 위 막대가 다 차면 다음 장으로 넘어간다. 화면 오른쪽을 누르면 다음,
// 왼쪽은 이전, 꾹 누르고 있으면 멈춘다. 넘기는 때는 막대 애니메이션이 끝나는 순간(animationend)이라
// 멈춤(animation-play-state)과 넘김이 어긋나지 않는다.
// 단계마다 사진 한 장(lib/photos.js stepPhotos) — from 이 있으면 그 사진에서 시작해 단계 동안 천천히 다음 사진으로
// 바뀐다(믹서를 부으면 잔 속 색이 바뀌는 장면). 영상 클립(video)이 있는 단계는 그 영상을 한 번 틀고(얼음이 떨어지고
// 바 스푼이 젓는 장면), 그 단계 시간은 클립 길이로 늘린다. 움직임 줄이기를 켠 사람에게는 사진만 보인다.
// 사진이 없을 때만 잔 그림(renderGlass)을 같은 자리에 크게 그린다.

import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";

const STEP_MS = 3200;
const CLIP_MS = 4000; // 영상 클립 길이(힉스필드 4초)
const HOLD_MS = 220; // 이보다 오래 누르면 "멈춤", 짧으면 "넘김"

const two = (n) => String(n).padStart(2, "0");

/**
 * @param {object} props
 * @param {string} props.title         레시피 이름
 * @param {string} props.subtitle      끝 화면에 적을 한 줄 (위스키 · 완성 도수)
 * @param {string[]} props.steps       단계 문장 (양이 채워진 것)
 * @param {{src: string, from?: string, top?: boolean, video?: string}[]|null} props.photos 단계마다 사진(·영상) — 단계 수와 같아야 한다
 * @param {(stage: number) => any} props.renderGlass 사진이 없을 때 그 단계의 잔 그림
 * @param {() => void} props.onClose
 * @param {() => void} [props.onShare]
 * @param {() => void} [props.onDone] 끝까지 봤을 때 한 번 (내 기록 "만들어 본 것")
 */
export default function StepPlayer({ title, subtitle, steps, photos, renderGlass, onClose, onShare, onDone }) {
  const n = steps.length;
  const [i, setI] = useState(0); // 0 … n-1 진행 중, n 끝
  const [paused, setPaused] = useState(false);
  const timer = useRef(null);
  const held = useRef(false);
  const closeRef = useRef(null);
  const videoRef = useRef(null);
  const [still, setStill] = useState(false); // 움직임 줄이기 — 영상 대신 사진
  const done = i >= n;
  const frame = Math.min(i, n - 1);
  const clipAt = (k) => (still ? null : photos?.[k]?.video || null);

  useEffect(() => setStill(window.matchMedia("(prefers-reduced-motion: reduce)").matches), []);

  // 영상 단계 — 들어올 때마다 처음부터, 꾹 눌러 멈추면 영상도 멈춘다
  useEffect(() => {
    if (videoRef.current) videoRef.current.currentTime = 0;
  }, [frame]);
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (paused) v.pause();
    else v.play().catch(() => {});
  }, [paused, frame]);

  const go = (d) => setI((x) => Math.max(0, Math.min(n, x + d)));

  // 열려 있는 동안 뒤 화면이 스크롤되지 않게 · Esc 로 닫기 · 화살표로 넘기기
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 끝까지 보면 한 번 알린다(다시 보기로 또 끝내면 또)
  useEffect(() => {
    if (done) onDone?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  // 다음 사진을 미리 받아 둔다 — 넘길 때 빈 화면이 비치지 않게
  useEffect(() => {
    const next = photos?.[i + 1];
    for (const src of [next?.from, next?.src]) if (src) new Image().src = src;
  }, [i, photos]);

  const press = () => {
    held.current = false;
    timer.current = setTimeout(() => {
      held.current = true;
      setPaused(true);
    }, HOLD_MS);
  };
  const release = (d) => {
    clearTimeout(timer.current);
    if (held.current) setPaused(false);
    else go(d);
  };

  return (
    <>
    {/* 넓은 화면에서는 플레이어를 가운데 폰 모양 창으로 띄운다 — 바깥 어두운 바탕을 누르면 닫힌다(폰에서는 안 보인다) */}
    <div className="player-shade" onClick={onClose} aria-hidden="true" />
    <div
      className={`player ${paused ? "is-paused" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label={`${title} 만드는 과정`}
      style={{ "--dur": `${clipAt(frame) ? CLIP_MS : STEP_MS}ms` }}
    >
      {photos ? (
        photos.map((p, k) =>
          Math.abs(k - frame) <= 1 ? (
            <div key={k} className={`player-frame ${k === frame ? "is-on" : ""} ${k % 2 ? "alt" : ""} ${p.top ? "top" : ""}`}>
              {clipAt(k) ? (
                // 앞뒤 장의 영상도 미리 받아 둔다(다음 장) · 끝 장면으로 남겨 둔다(지난 장)
                <video
                  ref={k === frame ? videoRef : undefined}
                  src={clipAt(k)}
                  poster={p.src}
                  muted
                  playsInline
                  autoPlay={k === frame}
                  preload="auto"
                />
              ) : (
                <>
                  {p.from && <img src={p.from} alt="" decoding="async" />}
                  <img className={p.from ? "pour" : undefined} src={p.src} alt="" decoding="async" />
                </>
              )}
            </div>
          ) : null
        )
      ) : (
        <div className="player-frame is-on player-svg">{renderGlass(done ? n : frame)}</div>
      )}

      <div className="player-tap" aria-hidden="true">
        <button tabIndex={-1} onPointerDown={press} onPointerUp={() => release(-1)} onPointerLeave={() => clearTimeout(timer.current)} />
        <button tabIndex={-1} onPointerDown={press} onPointerUp={() => release(1)} onPointerLeave={() => clearTimeout(timer.current)} />
      </div>

      <div className="player-top">
        <div className="player-bars">
          {steps.map((_, k) => (
            <i key={k} className={k < i ? "done" : k === i ? "now" : ""}>
              {/* 지금 막대는 열쇠를 바꿔 다시 그린다 — 뒤로 갔다 와도 처음부터 차오르게 */}
              <b key={k === i ? `now-${i}` : k} onAnimationEnd={k === i ? () => go(1) : undefined} />
            </i>
          ))}
        </div>
        <div className="player-head">
          <span className="player-title">
            {title}
            <small>만드는 과정</small>
          </span>
          <button ref={closeRef} className="player-close" onClick={onClose} aria-label="닫기">
            <Icon name="close" size={20} />
          </button>
        </div>
      </div>

      {done ? (
        <div className="player-end">
          <h2>완성!</h2>
          <p>{subtitle}</p>
          <div className="player-end-actions">
            <button className="btn-ghost" onClick={() => setI(0)}>다시 보기</button>
            {onShare ? (
              <button className="btn-primary" onClick={onShare}>이 레시피 보내기</button>
            ) : (
              <button className="btn-primary" onClick={onClose}>닫기</button>
            )}
          </div>
        </div>
      ) : (
        <div className="player-caption" aria-live="polite">
          <div className="player-no">
            {two(frame + 1)}
            <small>/ {two(n)}</small>
          </div>
          <p className="player-text">{steps[frame]}</p>
          {i === 0 && <p className="player-hint">오른쪽을 누르면 다음 · 왼쪽은 이전 · 꾹 누르면 멈춰요</p>}
        </div>
      )}
    </div>
    </>
  );
}
