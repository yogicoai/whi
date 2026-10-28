// 찍기 — 라벨 촬영은 다음 단계에서 옮긴다(보틀 렌즈의 판독·분석을 이 앱에 맞게 다시 붙이는 일).
// 그때까지 막다른 화면이 되지 않게, 이름으로 찾는 길을 바로 열어 둔다.

import SearchBox from "@/components/SearchBox";
import Icon from "@/components/Icon";

export const metadata = { title: "찍기 — Whisky Lens" };

export default function ScanPage() {
  return (
    <main className="page page-narrow">
      <h1 className="display">라벨 찍기</h1>
      <div className="scan-frame" aria-hidden="true">
        <Icon name="scan" size={56} />
      </div>
      <p className="lead">병 앞면 라벨을 찍으면 어떤 위스키인지 읽고, 바로 섞는 법을 알려 드려요.</p>
      <p className="note warn">라벨 촬영은 다음 업데이트에서 연결됩니다. 지금은 이름으로 찾아 주세요.</p>
      <SearchBox placeholder="위스키 이름으로 찾기" />
    </main>
  );
}
