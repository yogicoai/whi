import SearchBox from "@/components/SearchBox";
import BackButton from "@/components/BackButton";

export const metadata = { title: "위스키 찾기 — Whisky Lens" };

export default function SearchPage() {
  return (
    <main className="page page-detail page-narrow">
      <BackButton fallback="/" />
      <h1 className="display">위스키 찾기</h1>
      <p className="lead">이름을 적으면 그 위스키에 맞는 섞는 법을 알려 드려요.</p>
      <SearchBox autoFocus />
    </main>
  );
}
