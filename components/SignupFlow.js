"use client";

// 회원가입 — 동의 → 나이 확인 → 프로필, 세 단계를 한 화면에서 넘긴다.
//
// 가입 정보는 서버에 남긴다(lib/member.js signUp → app/api/members). 실제 서비스에서는 2단계가 휴대폰 본인인증이 되고
// (인증 업체는 클라이언트 결정 대기), 가입 방법 단추가 실제 소셜 로그인으로 바뀐다 — docs/member-data.md.
// 다음 단추는 엄지가 닿는 아래에 붙인다. 뒤로 단추는 앞 단계로, 첫 단계면 이전 화면으로.

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "./Icon";
import { AGREEMENTS, AVATARS, NICK, PROVIDERS, STRENGTHS, isAdultYear, signUp } from "@/lib/member";
import { MOODS } from "@/lib/look";

const STEPS = ["약관 동의", "나이 확인", "프로필"];
// 동의 항목의 "보기" — 약관 화면(어드민 '사업자 정보·약관'에서 게시한 판)
const VIEW = { terms: "/terms", privacy: "/privacy" };

export default function SignupFlow({ provider }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [checked, setChecked] = useState({});
  const [birth, setBirth] = useState("");
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState("highball");
  const [moods, setMoods] = useState([]);
  const [strength, setStrength] = useState(3);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const requiredOk = AGREEMENTS.filter((a) => a.required).every((a) => checked[a.key]);
  const allOn = AGREEMENTS.every((a) => checked[a.key]);
  const adult = isAdultYear(birth);
  const nick = nickname.trim();
  const nickOk = nick.length >= NICK.min && nick.length <= NICK.max;

  const toggleAll = () => setChecked(allOn ? {} : Object.fromEntries(AGREEMENTS.map((a) => [a.key, true])));
  const toggle = (key) => setChecked((c) => ({ ...c, [key]: !c[key] }));
  const toggleMood = (m) => setMoods((list) => (list.includes(m) ? list.filter((x) => x !== m) : [...list, m]));
  const back = () => (step ? setStep(step - 1) : router.back());

  async function finish() {
    setBusy(true);
    setError("");
    try {
      // 동의는 체크 여부만 보낸다 — 동의한 때는 서버가 찍는다
      await signUp({ provider, nickname: nick, avatar, birthYear: Number(birth), agreements: checked, taste: { moods, strength } });
      router.replace("/me?welcome=1");
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  const next = [
    { label: "다음", ok: requiredOk, go: () => setStep(1) },
    { label: "확인했어요", ok: adult, go: () => setStep(2) },
    { label: busy ? "가입하는 중…" : "시작하기", ok: nickOk && !busy, go: finish },
  ][step];

  return (
    <main className="page page-detail page-narrow">
      <button className="back" onClick={back} aria-label="뒤로">
        <Icon name="back" size={22} />
      </button>

      <div className="flow-top">
        <span className="flow-dots" aria-hidden="true">
          {STEPS.map((s, i) => <i key={s} className={i <= step ? "on" : ""} />)}
        </span>
        <span className="flow-step">
          {step + 1}/{STEPS.length} · {STEPS[step]}
        </span>
      </div>

      {step === 0 && (
        <>
          <h1 className="display">약관에 동의해 주세요</h1>
          <p className="lead">{PROVIDERS[provider].name}로 시작해요.</p>
          <button className={`agree-all ${allOn ? "is-on" : ""}`} onClick={toggleAll} aria-pressed={allOn}>
            <span className="check"><Icon name="check" size={16} /></span>
            모두 동의해요
          </button>
          <ul className="agree-list">
            {AGREEMENTS.map((a) => (
              <li key={a.key}>
                <button className={`agree ${checked[a.key] ? "is-on" : ""}`} onClick={() => toggle(a.key)} aria-pressed={!!checked[a.key]}>
                  <span className="check"><Icon name="check" size={14} /></span>
                  <span>
                    <em className={a.required ? "" : "opt"}>{a.required ? "[필수]" : "[선택]"}</em>
                    {a.label}
                  </span>
                </button>
                {VIEW[a.key] && (
                  <a className="agree-view" href={VIEW[a.key]} target="_blank" rel="noreferrer">
                    보기
                  </a>
                )}
              </li>
            ))}
          </ul>
          <p className="note dim">"보기"를 누르면 새 창에서 열려요. 본문은 어드민 '사업자 정보·약관'에서 게시해요.</p>
        </>
      )}

      {step === 1 && (
        <>
          <h1 className="display">만 19세 이상인지 확인할게요</h1>
          <p className="lead">술을 다루는 앱이라 법에 따라 성인만 쓸 수 있어요.</p>
          <div className="verify-card">
            <button className="btn-ghost wide" disabled>
              휴대폰 본인인증 <span className="badge-soon">연결 전</span>
            </button>
            <p className="note dim">실제 서비스에서는 본인인증으로 확인해요. 지금은 시연용으로 태어난 해만 받아요.</p>
            <label className="field">
              <span>태어난 해</span>
              <input
                value={birth}
                onChange={(e) => setBirth(e.target.value.replace(/\D/g, "").slice(0, 4))}
                inputMode="numeric"
                placeholder="예: 1995"
                enterKeyHint="done"
              />
            </label>
            {birth.length === 4 && !adult && <p className="note warn">만 19세 미만은 이용할 수 없어요.</p>}
            {adult && <p className="note">확인됐어요. 만 19세 이상이에요.</p>}
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <h1 className="display">어떻게 불러 드릴까요?</h1>
          <div className="profile-preview">
            <span className="avatar l" style={{ "--av": AVATARS[avatar] }}>{nick.slice(0, 1) || "?"}</span>
          </div>
          <div className="panel">
            <label className="field">
              <span>닉네임</span>
              <input value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={NICK.max} placeholder="예: 민수" enterKeyHint="done" />
            </label>
            <p className="note dim">{NICK.min}~{NICK.max}자. 레시피를 보낼 때 이 이름이 붙어요.</p>

            <span className="chips-cap">프로필 색</span>
            <div className="avatar-picks">
              {Object.entries(AVATARS).map(([k, color]) => (
                <button key={k} className={`avatar-pick ${avatar === k ? "is-on" : ""}`} style={{ "--av": color }} onClick={() => setAvatar(k)} aria-label={`프로필 색 ${k}`} aria-pressed={avatar === k} />
              ))}
            </div>

            <span className="chips-cap">좋아하는 맛 (여럿 골라도 돼요)</span>
            <div className="chips">
              {MOODS.map((m) => (
                <button key={m} className={`chip ${moods.includes(m) ? "is-on" : ""}`} onClick={() => toggleMood(m)} aria-pressed={moods.includes(m)}>
                  {m}
                </button>
              ))}
            </div>

            <div className="seg-group">
              <span className="seg-label">좋아하는 농도</span>
              <div className="seg" role="radiogroup" aria-label="좋아하는 농도">
                {STRENGTHS.map((o) => (
                  <button key={o.ratio} role="radio" aria-checked={o.ratio === strength} className={o.ratio === strength ? "is-on" : ""} onClick={() => setStrength(o.ratio)}>
                    <b>{o.label}</b>
                    <small>1 : {o.ratio}</small>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {error && <p className="note warn">{error}</p>}

      <div className="flow-next">
        <button className="btn-primary" disabled={!next.ok} onClick={next.go}>
          {next.label}
        </button>
      </div>
    </main>
  );
}
