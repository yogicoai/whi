import AccountClient from "@/components/AccountClient";
import BackButton from "@/components/BackButton";
import SiteFooter from "@/components/SiteFooter";

export const metadata = { title: "회원정보 — Whisky Lens" };

// 푸터의 약관 링크가 시행일에 맞춰 바뀌게 한 시간마다 새로 그린다(어드민에서 고치면 바로 새로 그린다)
export const revalidate = 3600;

export default function AccountPage() {
  return (
    <main className="page page-detail page-narrow">
      <BackButton fallback="/me" />
      <h1 className="display">회원정보</h1>
      <AccountClient />
      <SiteFooter />
    </main>
  );
}
