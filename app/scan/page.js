// 찍기 — 라벨을 찍으면 어떤 위스키인지 읽어 그 위스키 화면으로 이어 준다(2026-10-28, 보틀 렌즈의 라벨 판독을 옮김).
// 판독 · 찾기는 app/api/scan(lib/server/scan.js), 화면 흐름은 components/ScanFlow.js.

import ScanFlow from "@/components/ScanFlow";
import { allWhiskies } from "@/lib/whiskies";

export const metadata = { title: "찍기 — Whisky Lens" };

export default function ScanPage() {
  const total = allWhiskies().length;
  return (
    <main className="page page-narrow page-scan">
      <h1 className="display">라벨 찍기</h1>
      <p className="lead">병 앞면 라벨을 찍으면 위스키 {total.toLocaleString()}종 가운데 어떤 위스키인지 찾아 드려요.</p>
      <ScanFlow total={total} />
    </main>
  );
}
