import MeProfile from "@/components/MeProfile";
import SavedClient from "@/components/SavedClient";
import SiteFooter from "@/components/SiteFooter";
import BoardTabs from "@/components/BoardTabs";

export const metadata = { title: "내 레시피 — Whisky Lens" };

// 푸터의 약관 링크가 시행일에 맞춰 바뀌게 한 시간마다 새로 그린다(어드민에서 고치면 바로 새로 그린다)
export const revalidate = 3600;

export default function MePage() {
  return (
    <main className="page page-narrow">
      <h1 className="display">내 레시피</h1>
      <BoardTabs on="me" />
      <MeProfile />
      <p className="lead saved-lead">내 입에 맞는 비율을 모아 두는 곳이에요.</p>
      <SavedClient />
      <SiteFooter />
    </main>
  );
}
