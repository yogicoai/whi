// 손님 화면 맨 아래 사업자 정보 줄 — 서버에서 사업자 정보와 시행 중인 약관을 읽어 그린다(components/SiteFooterView.js).
// 보이스 동화처럼 레이아웃 전역이 아니라 화면마다 넣는다: 홈 · 약관 화면 · 시작하기 · 내 레시피 · 회원정보.

import SiteFooterView from "./SiteFooterView";
import { getBusiness, liveVersions } from "@/lib/server/legal";

export default async function SiteFooter() {
  const [info, live] = await Promise.all([getBusiness(), liveVersions()]);
  return <SiteFooterView info={info} live={live} />;
}
