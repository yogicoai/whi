"use client";

// 칵테일 상세의 몸통 — MixStudio 와 같은 틀(완성된 한 잔 · 고르기 · 양 · 만드는 순서 · 저장 · 보내기 · 만드는 과정)에
// 칵테일 규칙(lib/cocktails.js)을 넣는다. 농도(1 : 3) 자리에 맛 조절(덜 달게 · 기본 · 달게)이 온다.
// 저장·공유 주소도 같은 칸을 쓴다 — ratio(r) 에 맛 조절 이름("dry")이 들어간다.

import { useEffect, useState } from "react";
import CocktailGlass from "./CocktailGlass";
import { DEFAULT_WHISKY } from "./Glass";
import Icon from "./Icon";
import StepPlayer from "./StepPlayer";
import ShareSheet from "./ShareSheet";
import { SHOTS } from "@/lib/mixes";
import { COCKTAILS, cocktailPlan, cocktailAmounts, variantHint, variantOf, startShot } from "@/lib/cocktails";
import { LOOK } from "@/lib/look";
import { drinkPhoto, heroSrcSet, stepPhotos } from "@/lib/photos";
import { sharedLabel } from "@/lib/share";
import { getSaved, toggleSaved, sameMix, bumpStat } from "@/lib/saved";
import { track } from "@/lib/track";

const MELT_NOTE = {
  build: "완성 도수는 저으면서 녹아 든 물까지 넣은 대략 값이에요. 얼음이 녹을수록 조금 더 낮아져요.",
  stir: "완성 도수는 저으면서 녹아 든 물까지 넣은 대략 값이에요.",
  shake: "완성 도수는 흔들면서 녹아 든 물까지 넣은 대략 값이에요.",
};

export default function CocktailStudio({ recipeKey, whisky, initialRatio, initialShot, shared = null, copy = null, children = null }) {
  const c = COCKTAILS[recipeKey];
  // 한 줄 설명 · 팁은 어드민이 고친 것이 있으면 그것(app/recipes/[key]/page.js 가 넘긴다)
  const why = copy?.why || c.why;
  const tip = copy?.tip || c.tip;
  const look = LOOK[recipeKey];
  // 고른 위스키에 맞춘 규칙 — 도수가 높으면 위스키 양을 줄여 시작, 귀한 술이면 먼저 그대로 맛보길
  const plan = whisky ? cocktailPlan(whisky) : null;
  const fits = !plan || plan.list.some((x) => x.key === recipeKey);

  const [variant, setVariant] = useState(variantOf(c, initialRatio).key);
  const [shot, setShot] = useState(initialShot || startShot(c, plan));
  const [savedItem, setSavedItem] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [sharing, setSharing] = useState(false);

  const steps = c.steps;
  const amounts = cocktailAmounts(c, { shot, variant, abv: plan?.abv ?? 40 });
  const mix = { key: recipeKey, whiskyId: whisky?.id || null, ratio: variant, shot };
  // 첫 판 — 그 레시피 실사 사진을 가득 깔고 그 위에 유리 제목 카드(리퀴드 글래스). 사진이 없으면 잔 그림
  const hero = drinkPhoto(recipeKey, "hero");

  useEffect(() => {
    const read = () => setSavedItem(getSaved().find((x) => sameMix(x, mix)) || null);
    read();
    window.addEventListener("wl-storage", read);
    return () => window.removeEventListener("wl-storage", read);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipeKey, whisky?.id, variant, shot]);

  const save = { recipeName: c.name, whiskyName: whisky?.name || null, whiskyColor: whisky?.liquidColor || null };
  const toggle = () => {
    const on = toggleSaved({ ...mix, ...save, name: shared?.name || null, memo: shared?.memo || null, by: shared?.mine ? null : shared?.by || null });
    if (on) track("save", { recipeKey, whiskyId: whisky?.id });
  };
  const made = () => {
    bumpStat("made");
    track("made", { recipeKey, whiskyId: whisky?.id });
  };

  const vars = { w: amounts.whisky, ...Object.fromEntries(amounts.parts.map((p) => [p.id, p.amount])) };
  const fill = (s) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
  const glass = (stage, id) => (
    <CocktailGlass cocktail={c} stage={stage} amounts={amounts} whiskyColor={whisky?.liquidColor || DEFAULT_WHISKY} id={id} />
  );

  return (
    <>
      {/* 넓은 화면(PC)에서는 두 칸 — 왼쪽(첫 판 · 비율 · 버튼 줄)은 내려 읽어도 따라오고, 오른쪽은 만드는 순서와
          페이지가 넘겨 준 것(황금레시피 · 잘 맞는 위스키). 폰에서는 그냥 위에서 아래로 쌓인다 */}
      <div className="studio-layout">
        <div className="studio-main">
          <section className="studio-hero">
            {hero ? (
              <img
                className="studio-photo"
                src={hero}
                srcSet={heroSrcSet(recipeKey)}
                sizes="(min-width: 1080px) 528px, 100vw"
                alt=""
                fetchPriority="high"
              />
            ) : (
              <div className="studio-glass">{glass(steps.length, "studio")}</div>
            )}
            <div className="studio-copy">
              <span className="eyebrow">{look.moods.join(" · ")}</span>
              <h1>{c.name}</h1>
              <p>{why}</p>
            </div>
          </section>

          {shared && (
            <section className="shared">
              <small>{sharedLabel(shared)}</small>
              <strong>{shared.name || c.name}</strong>
              {shared.memo && <p>{shared.memo}</p>}
            </section>
          )}

          <section className="panel">
            <a href="#whiskies" className="studio-whisky">
              <span className="wrow-shot">
                {whisky?.image ? <img src={whisky.image} alt="" decoding="async" /> : <span className="wrow-blank" />}
              </span>
              <span className="wrow-body">
                <span className="caption">위스키</span>
                <strong>{whisky ? whisky.name : "어떤 위스키든"}</strong>
              </span>
              <span className="link-more">바꾸기</span>
            </a>
            {!fits && <p className="note warn">이 위스키에는 잘 맞지 않는 편입니다. 아래 추천 위스키도 살펴보세요.</p>}

            <div className="seg-group">
              <span className="seg-label">{c.variantLabel}</span>
              <div className="seg" role="radiogroup" aria-label={c.variantLabel}>
                {c.variants.map((v) => (
                  <button key={v.key} role="radio" aria-checked={v.key === variant} className={v.key === variant ? "is-on" : ""} onClick={() => setVariant(v.key)}>
                    <b>{v.label}</b>
                    <small>{variantHint(c, v.key, shot)}</small>
                  </button>
                ))}
              </div>
            </div>
            <div className="seg-group">
              <span className="seg-label">위스키 양</span>
              <div className="seg" role="radiogroup" aria-label="위스키 양">
                {SHOTS.map((o) => (
                  <button key={o.ml} role="radio" aria-checked={o.ml === shot} className={o.ml === shot ? "is-on" : ""} onClick={() => setShot(o.ml)}>
                    <b>{o.ml}ml</b>
                    <small>{o.ml === c.shot ? "기본" : o.label}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="amounts">
              <div><b>{amounts.whisky}<small>ml</small></b><span>위스키</span></div>
              {amounts.parts.map((p) => (
                <div key={p.id}><b>{p.amount}<small>{p.unit}</small></b><span>{p.name}</span></div>
              ))}
              <div className="amounts-abv"><b>{amounts.abv}<small>%</small></b><span>완성 도수</span></div>
            </div>
          </section>

          <div className="actionbar">
            <button className={`btn-ghost ${savedItem ? "is-on" : ""}`} onClick={toggle} aria-pressed={!!savedItem}>
              <Icon name="saved" size={20} fill={!!savedItem} />
              <span>{savedItem ? "저장됨" : "저장"}</span>
            </button>
            <button className="btn-ghost" onClick={() => setSharing(true)}>
              <Icon name="share" size={20} />
              <span>보내기</span>
            </button>
            <button className="btn-primary" onClick={() => setPlaying(true)}>
              <Icon name="play" size={18} fill />
              <span>만드는 과정</span>
            </button>
          </div>
        </div>
        <div className="studio-side">
          <section className="panel">
            <h2 className="h2">만드는 순서</h2>
            <ol className="steps">
              {steps.map((s, i) => (
                <li key={i}>
                  <span className="step-no">{i + 1}</span>
                  <span>{fill(s.text)}</span>
                </li>
              ))}
            </ol>
            {tip && <p className="note">{tip}</p>}
            {plan?.notes.map((n) => <p className="note warn" key={n}>{n}</p>)}
            {MELT_NOTE[c.method] && <p className="note dim">{MELT_NOTE[c.method]}</p>}
          </section>
          {children}
        </div>
      </div>

      {playing && (
        <StepPlayer
          title={c.name}
          subtitle={`${whisky?.name || "위스키"} ${amounts.whisky}ml · ${variantOf(c, variant).label} · 완성 도수 ${amounts.abv}%`}
          steps={steps.map((s) => fill(s.text))}
          photos={stepPhotos(recipeKey, steps)}
          renderGlass={(stage) => glass(stage, "player")}
          onClose={() => setPlaying(false)}
          onDone={made}
          onShare={() => {
            setPlaying(false);
            setSharing(true);
          }}
        />
      )}
      {sharing && (
        <ShareSheet
          mix={mix}
          save={save}
          initial={{ name: savedItem?.name || shared?.name, memo: savedItem?.memo || shared?.memo }}
          onClose={() => setSharing(false)}
        />
      )}
    </>
  );
}
