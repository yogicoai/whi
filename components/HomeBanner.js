// 홈 공지·배너 — 어드민(/admin/banners)에서 켠 것 가운데 기간 안인 것(lib/server/settings.js getActiveBanners).
// 링크가 있으면 눌러서 이동한다(앱 안 주소 /… 또는 https://…).

import Link from "next/link";

export default function HomeBanner({ banners }) {
  if (!banners?.length) return null;
  return (
    <div className="banners">
      {banners.map((b) => {
        const inner = (
          <>
            <strong>{b.title}</strong>
            {b.body && <span>{b.body}</span>}
          </>
        );
        return b.link ? (
          <Link key={b.id} href={b.link} className={`banner tone-${b.tone}`}>
            {inner}
            <span className="banner-go">자세히 ›</span>
          </Link>
        ) : (
          <div key={b.id} className={`banner tone-${b.tone}`}>{inner}</div>
        );
      })}
    </div>
  );
}
