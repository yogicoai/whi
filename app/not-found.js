import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page">
      <div className="empty">
        <strong>찾는 화면이 없어요</strong>
        <p>주소가 바뀌었거나 사라진 항목이에요.</p>
        <Link href="/" className="btn-primary">홈으로</Link>
      </div>
    </main>
  );
}
