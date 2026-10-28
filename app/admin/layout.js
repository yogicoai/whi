// 어드민(/admin) — 대시보드 · 회원 · 레시피·추천 · 공지·배너 · 사업자 정보·약관. 마스터 아이디 + 비밀번호로 들어온다(.env.local ADMIN_ID · ADMIN_PASSWORD).
// 손님 앱의 탭바는 내린다(components/TabBar.js). 검색엔진에는 올리지 않는다.

import AdminShell from "@/components/admin/AdminShell";

export const metadata = { title: "어드민 — Whisky Lens", robots: { index: false, follow: false } };

export default function AdminLayout({ children }) {
  return <AdminShell>{children}</AdminShell>;
}
