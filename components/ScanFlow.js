"use client";

// 찍기 화면의 흐름 — 찍기(CaptureScreen) → 읽는 중 → 결과. 보틀 렌즈 app/page.js 의 analyze · LoadingScreen 을 옮겼다(2026-10-28).
// 결과: 찾으면 그 위스키 카드("이 위스키 보기"), 못 찾으면 읽은 이름과 가까운 후보 · 이름 검색.
// 찾은 위스키는 이 기기에 "최근 찍은 위스키"로 남는다(사진은 남기지 않는다).

import { useEffect, useState } from "react";
import Link from "next/link";
import CaptureScreen from "./CaptureScreen";
import SearchBox from "./SearchBox";
import WhiskyRow from "./WhiskyRow";
import { downscale, stripPrefix } from "@/lib/imageClient";
import { authHeader } from "@/lib/member";
import { PRICE_BANDS } from "@/lib/look";

const STEPS = ["라벨을 읽는 중", "위스키 이름을 알아보는 중", "목록에서 맞춰 보는 중"];

// 기다림이 길어질 때만 한 줄 — 보틀 렌즈 lib/scanTips.js 의 위스키 팁(술 용어를 풀어 쓴 것)
const TIPS = [
  "물 몇 방울이 향을 엽니다. 도수가 낮아지면서 갇혀 있던 향이 풀려요.",
  "위스키는 병에 담긴 뒤로는 익지 않아요. 12년은 나무통에서 보낸 시간이에요.",
  "피트는 이탄(풀이 썩어 쌓인 흙)이에요. 보리를 말릴 때 태워서 그 연기 향이 술에 배요.",
  "얼음은 향을 닫아요. 향을 보려면 그냥, 편하게 마시려면 얼음 위에.",
  "캐스크 스트렝스는 물을 타지 않은 원액이에요. 도수가 높으니 조금씩 드세요.",
  "싱글 몰트는 한 증류소에서 보리로만 만든 술이라는 뜻이에요.",
  "셰리 캐스크는 셰리 와인을 담았던 통이에요. 건포도 · 초콜릿 향이 거기서 와요.",
];
const TIP_AFTER = 3500;

const RECENT_KEY = "wl-scans";
const readRecent = () => {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
};
function remember(w) {
  try {
    const keep = { id: w.id, name: w.name, type: w.type, image: w.image, cut: w.cut, priceBand: w.priceBand, liquidColor: w.liquidColor, top: w.top };
    localStorage.setItem(RECENT_KEY, JSON.stringify([keep, ...readRecent().filter((x) => x.id !== w.id)].slice(0, 8)));
  } catch {}
}

export default function ScanFlow({ total }) {
  const [screen, setScreen] = useState("capture"); // capture | loading | result
  const [thumb, setThumb] = useState(null);
  const [res, setRes] = useState(null);
  const [error, setError] = useState("");
  const [recent, setRecent] = useState([]);

  useEffect(() => setRecent(readRecent()), [screen]);

  async function analyze(dataUrl) {
    setScreen("loading");
    setError("");
    window.scrollTo({ top: 0 });
    try {
      const [apiImage, thumbImage] = await Promise.all([downscale(dataUrl, 1280, 0.82), downscale(dataUrl, 480, 0.7)]);
      setThumb(thumbImage);
      const r = await fetch("/api/scan", {
        method: "POST",
        headers: { "content-type": "application/json", ...authHeader() },
        body: JSON.stringify({ image: stripPrefix(apiImage) }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "라벨을 읽지 못했어요. 다시 찍어 주세요");
      if (data.found) remember(data.whisky);
      setRes(data);
      setScreen("result");
      if (navigator.vibrate) navigator.vibrate([20, 40, 20]);
    } catch (e) {
      setError(navigator.onLine === false ? "인터넷이 끊겨 있어요. 연결한 뒤 다시 찍어 주세요" : e.message);
      setScreen("capture");
    }
  }

  function again() {
    setRes(null);
    setThumb(null);
    setScreen("capture");
    window.scrollTo({ top: 0 });
  }

  if (screen === "loading") return <ScanLoading thumb={thumb} />;
  if (screen === "result" && res) return <ScanResult res={res} thumb={thumb} total={total} onAgain={again} />;

  return (
    <>
      {error && <p className="note warn scan-error" role="alert">{error}</p>}
      <CaptureScreen onCapture={analyze} />
      {recent.length > 0 && (
        <section className="section scan-recent">
          <div className="section-head"><h2 className="h2">최근 찍은 위스키</h2></div>
          <div className="list">{recent.slice(0, 5).map((w) => <WhiskyRow key={w.id} w={w} />)}</div>
        </section>
      )}
      <section className="section scan-name">
        <div className="section-head"><h2 className="h2">이름으로 찾기</h2></div>
        <SearchBox placeholder="위스키 이름 · 영문도 돼요" />
      </section>
    </>
  );
}

/** 읽는 중 — 찍은 라벨 위로 스캔 선이 지나간다(보틀 렌즈 LoadingScreen) */
function ScanLoading({ thumb }) {
  const [i, setI] = useState(0);
  const [tip, setTip] = useState(null);
  useEffect(() => {
    const a = setTimeout(() => setI(1), 1000);
    const b = setTimeout(() => setI(2), 2400);
    let n = Math.floor(Math.random() * TIPS.length);
    let rotate;
    const first = setTimeout(() => {
      setTip(TIPS[n++ % TIPS.length]);
      rotate = setInterval(() => setTip(TIPS[n++ % TIPS.length]), 7000);
    }, TIP_AFTER);
    return () => {
      [a, b, first].forEach(clearTimeout);
      clearInterval(rotate);
    };
  }, []);
  return (
    <div className="scan-loading" aria-live="polite">
      <div className="scan-shot-frame">
        {thumb && <img src={thumb} alt="찍은 라벨" />}
        <span className="scan-line" />
        <span className="scan-corner tl" />
        <span className="scan-corner tr" />
        <span className="scan-corner bl" />
        <span className="scan-corner br" />
      </div>
      <ol className="loading-steps">
        {STEPS.map((s, idx) => (
          <li key={s} className={idx < i ? "done" : idx === i ? "now" : ""} aria-current={idx === i ? "step" : undefined}>
            <i className="step-dot" />
            {s}
          </li>
        ))}
      </ol>
      {tip && <p className="scan-tip" key={tip}>{tip}</p>}
    </div>
  );
}

/** 결과 — 찾았으면 그 위스키 카드, 아니면 후보 · 이름 검색 */
function ScanResult({ res, thumb, total, onAgain }) {
  const [other, setOther] = useState(false);
  const read = res.read || {};
  const readName = read.name || read.nameEn;

  if (res.found) {
    const w = res.whisky;
    const meta = [w.type?.replace(/\s*\(.*\)$/, ""), w.priceBand && PRICE_BANDS[w.priceBand], w.rating && `★ ${w.rating.toFixed(1)}`].filter(Boolean).join(" · ");
    return (
      <div className="scan-result">
        <div className="scan-pair" style={{ "--liquid": w.liquidColor || "#c8862a" }}>
          {thumb && <img className="scan-pair-shot" src={thumb} alt="찍은 라벨" />}
          <span className={`scan-pair-bottle ${w.cut ? "is-cut" : ""}`}>
            <img src={w.cut || w.image} alt="" />
          </span>
        </div>
        <p className="scan-found">찾았어요</p>
        <h2 className="scan-title">{w.name}</h2>
        {meta && <p className="scan-meta">{meta}</p>}
        <Link href={`/whisky/${w.id}`} className="btn-primary wide">이 위스키 보기</Link>
        <button type="button" className="btn-ghost wide" onClick={onAgain}>다시 찍기</button>
        {!other ? (
          <button type="button" className="scan-other" onClick={() => setOther(true)}>찍은 위스키가 아닌가요? 이름으로 찾기</button>
        ) : (
          <div className="scan-name"><SearchBox autoFocus placeholder="위스키 이름 · 영문도 돼요" /></div>
        )}
      </div>
    );
  }

  const list = res.candidates || [];
  return (
    <div className="scan-result is-miss">
      {thumb && <img className="scan-miss-shot" src={thumb} alt="찍은 라벨" />}
      {res.unreadable ? (
        <>
          <h2 className="scan-title">라벨 글자를 읽지 못했어요</h2>
          <p className="scan-meta">밝은 곳에서 라벨을 정면으로, 글자가 크게 보이게 당겨서 찍어 주세요.</p>
        </>
      ) : list.length > 0 ? (
        <>
          <h2 className="scan-title">“{readName}”로 읽었어요</h2>
          <p className="scan-meta">이 중에 찍은 위스키가 있나요?</p>
        </>
      ) : (
        <>
          <h2 className="scan-title">“{readName}”</h2>
          <p className="scan-meta">
            {read.whisky === false ? "위스키가 아닌 것 같아요. 위스키 병 라벨을 찍어 주세요." : `아직 저희 위스키 목록(${total.toLocaleString()}종)에 없는 위스키예요.`}
          </p>
        </>
      )}
      {list.length > 0 && <div className="list scan-cands">{list.map((w) => <WhiskyRow key={w.id} w={w} />)}</div>}
      <button type="button" className="btn-primary wide" onClick={onAgain}>다시 찍기</button>
      <div className="scan-name">
        <h3 className="h2">이름으로 찾기</h3>
        <SearchBox placeholder="위스키 이름 · 영문도 돼요" />
      </div>
    </div>
  );
}
