"use client";

// 회원정보 — 프로필(닉네임 · 색 · 취향) 고치기, 알림 동의, 가입 정보, 로그아웃 · 탈퇴.
// 회원정보는 서버에 있다(lib/member.js → app/api/members/me). 들어오면 서버 것으로 맞추고, 고치면 서버에 저장한다.
// 어드민이 이용을 정지한 계정은 볼 수만 있고 고칠 수 없다.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AVATARS, NICK, PROVIDERS, STRENGTHS, refreshMember, shortDate, signOut, updateMember, withdraw } from "@/lib/member";
import { MOODS } from "@/lib/look";

const formOf = (m) => ({ nickname: m.nickname, avatar: m.avatar, moods: m.taste?.moods || [], strength: m.taste?.strength || 3 });

export default function AccountClient() {
  const router = useRouter();
  const [member, setMember] = useState(undefined); // undefined 읽는 중 · null 없음
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    refreshMember().then((m) => {
      setMember(m);
      if (m) setForm(formOf(m));
    });
  }, []);

  if (member === undefined) return <div className="skeleton" />;
  if (!member) {
    return (
      <div className="empty">
        <strong>로그인이 필요해요</strong>
        <p>가입하면 내 레시피를 어느 기기에서나 보고, 보낼 때 내 이름이 붙어요.</p>
        <Link href="/login" className="btn-primary">시작하기</Link>
      </div>
    );
  }

  const suspended = member.status === "suspended";
  const nick = form.nickname.trim();
  const nickOk = nick.length >= NICK.min && nick.length <= NICK.max;
  const changed =
    nick !== member.nickname ||
    form.avatar !== member.avatar ||
    form.strength !== (member.taste?.strength || 3) ||
    form.moods.join() !== (member.taste?.moods || []).join();
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const say = (text) => {
    setToast(text);
    setTimeout(() => setToast(""), 2200);
  };

  // 서버에 보내고, 되돌아온 회원정보로 화면을 맞춘다
  async function send(patch, done) {
    setBusy(true);
    try {
      const m = await updateMember(patch);
      setMember(m);
      setForm(formOf(m));
      say(done);
    } catch (e) {
      say(e.message);
    } finally {
      setBusy(false);
    }
  }

  const save = () => send({ nickname: nick, avatar: form.avatar, taste: { moods: form.moods, strength: form.strength } }, "저장했어요");
  const toggleMarketing = () => {
    const on = !member.agreements?.marketing;
    send({ marketing: on }, on ? "이벤트·혜택 알림을 받을게요" : "이벤트·혜택 알림을 끌게요");
  };

  function logout() {
    signOut();
    router.replace("/me");
  }

  async function leave() {
    if (!window.confirm("탈퇴하면 회원정보와 이 기기에 저장한 레시피·내 바가 모두 지워져요. 탈퇴할까요?")) return;
    try {
      await withdraw();
      router.replace("/");
    } catch (e) {
      say(e.message);
    }
  }

  return (
    <>
      <section className="profile-card">
        <span className="avatar l" style={{ "--av": AVATARS[form.avatar] }}>{nick.slice(0, 1) || "?"}</span>
        <span className="profile-text">
          <strong>{member.nickname}</strong>
          <span className="profile-meta">{PROVIDERS[member.provider]?.name || "이메일"}로 가입 · {shortDate(member.createdAt)}</span>
          <span className="profile-meta">
            만 19세 확인 {member.adultVerified ? "완료" : "전"}
            {member.verifiedBy === "demo" && " (시연용)"}
          </span>
        </span>
      </section>
      {suspended && <p className="note warn">이용이 정지된 계정이에요. 문의는 고객센터로 해 주세요.</p>}

      <section className="panel">
        <h2 className="h2">프로필</h2>
        <label className="field">
          <span>닉네임</span>
          <input value={form.nickname} onChange={(e) => set({ nickname: e.target.value })} maxLength={NICK.max} disabled={suspended} />
        </label>
        {!nickOk && <p className="note warn">{NICK.min}~{NICK.max}자로 적어 주세요.</p>}

        <span className="chips-cap">프로필 색</span>
        <div className="avatar-picks">
          {Object.entries(AVATARS).map(([k, color]) => (
            <button key={k} className={`avatar-pick ${form.avatar === k ? "is-on" : ""}`} style={{ "--av": color }} onClick={() => set({ avatar: k })} aria-label={`프로필 색 ${k}`} aria-pressed={form.avatar === k} disabled={suspended} />
          ))}
        </div>

        <span className="chips-cap">좋아하는 맛</span>
        <div className="chips">
          {MOODS.map((m) => {
            const on = form.moods.includes(m);
            return (
              <button key={m} className={`chip ${on ? "is-on" : ""}`} aria-pressed={on} disabled={suspended} onClick={() => set({ moods: on ? form.moods.filter((x) => x !== m) : [...form.moods, m] })}>
                {m}
              </button>
            );
          })}
        </div>

        <div className="seg-group">
          <span className="seg-label">좋아하는 농도</span>
          <div className="seg" role="radiogroup" aria-label="좋아하는 농도">
            {STRENGTHS.map((o) => (
              <button key={o.ratio} role="radio" aria-checked={o.ratio === form.strength} className={o.ratio === form.strength ? "is-on" : ""} disabled={suspended} onClick={() => set({ strength: o.ratio })}>
                <b>{o.label}</b>
                <small>1 : {o.ratio}</small>
              </button>
            ))}
          </div>
        </div>

        <button className="btn-primary wide" disabled={!changed || !nickOk || busy || suspended} onClick={save}>
          {busy ? "저장하는 중…" : "저장"}
        </button>
      </section>

      <section className="panel">
        <h2 className="h2">알림</h2>
        <div className="row">
          <span>
            이벤트·혜택 알림
            <small>{member.agreements?.marketing ? `${shortDate(member.agreements.marketing)} 동의` : "받지 않음"}</small>
          </span>
          <button className={`switch ${member.agreements?.marketing ? "is-on" : ""}`} role="switch" aria-checked={!!member.agreements?.marketing} aria-label="이벤트·혜택 알림" disabled={busy || suspended} onClick={toggleMarketing} />
        </div>
      </section>

      <section className="panel">
        <h2 className="h2">계정</h2>
        <div className="row">
          <span>
            연결된 계정
            <small>{PROVIDERS[member.provider]?.name || "이메일"}</small>
          </span>
        </div>
        <div className="row">
          <span>
            약관 동의
            <small>이용약관 · 개인정보 · 만 19세 — {shortDate(member.agreements?.terms)}</small>
          </span>
        </div>
        <div className="row">
          <button className="btn-ghost" onClick={logout}>로그아웃</button>
          <button className="btn-danger" onClick={leave}>회원 탈퇴</button>
        </div>
      </section>
      <p className="note dim center">지금은 시연용 가입이에요. 실제 소셜 로그인과 본인인증은 연결 전이에요.</p>
      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  );
}
