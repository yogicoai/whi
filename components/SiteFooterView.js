// 푸터 그리기만 — 사업자 정보와 시행 중인 약관을 받아 그린다. 손님 화면(SiteFooter)과 어드민 미리보기가 같이 쓴다.
// 보이스 동화(Dong) SiteFooter 순서를 따랐다: 상호 → 대표 · 사업자등록번호 → (통신판매업) → 주소 → 고객센터 · 이메일 → 책임자 → 호스팅 → 약관 링크.
// 빈 칸은 "(등록 예정)", 아직 시행 전인 문서는 링크 대신 "(준비 중)". 개인정보처리방침은 굵게(법에서 눈에 띄게 하라고 한다).

import Link from "next/link";
import { LEGAL_KINDS, infoText } from "@/lib/legal";

export default function SiteFooterView({ info, live = {}, preview = false }) {
  const Doc = ({ kind }) => {
    const { title, path } = LEGAL_KINDS[kind];
    const label = kind === "privacy" ? <b>{title}</b> : title;
    if (!live[kind]) return <span className="foot-soon">{label} (준비 중)</span>;
    return preview ? <span>{label}</span> : <Link href={path}>{label}</Link>;
  };
  return (
    <footer className="site-footer">
      <nav className="foot-links" aria-label="약관">
        <Doc kind="terms" />
        <Doc kind="privacy" />
        <Doc kind="youth" />
      </nav>
      <strong>{infoText(info.name)}</strong>
      <p>대표 {infoText(info.ceo)} · 사업자등록번호 {infoText(info.bizNo)}</p>
      {info.mailOrderNo && <p>통신판매업 신고번호 {info.mailOrderNo}</p>}
      <p>주소 {infoText(info.address)}</p>
      <p>
        고객센터 {infoText(info.phone)}
        {info.hours ? ` (${info.hours})` : ""} · 이메일 {infoText(info.email)}
      </p>
      <p>개인정보 보호책임자 {infoText(info.privacyOfficer)} · 청소년 보호책임자 {infoText(info.youthOfficer)}</p>
      <p>호스팅 제공 {infoText(info.hosting)}</p>
      <p className="foot-warn">지나친 음주는 건강을 해칩니다. 만 19세 미만은 이용할 수 없어요.</p>
    </footer>
  );
}
