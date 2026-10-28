// /privacy — 약관 화면(components/LegalPage.js). 어드민 '사업자 정보·약관'에서 게시한 판을 보여 준다.

import LegalPage, { legalMetadata } from "@/components/LegalPage";

export const revalidate = 300; // 게시하면 바로 새로 그린다(revalidatePath) — 그 밖에는 5분마다 시행일을 다시 본다

export const generateMetadata = () => legalMetadata("privacy");

export default function Page() {
  return <LegalPage kind="privacy" />;
}
