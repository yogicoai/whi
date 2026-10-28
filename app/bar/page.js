import BarClient from "@/components/BarClient";

export const metadata = { title: "내 바 — Whisky Lens" };

export default function BarPage() {
  return (
    <main className="page">
      <h1 className="display">내 바</h1>
      <p className="lead">집에 있는 것만 고르세요. 지금 만들 수 있는 레시피를 골라 드려요.</p>
      <BarClient />
    </main>
  );
}
