import "./fonts/pretendard/pretendard.css";
import "./globals.css";
import TabBar from "@/components/TabBar";
import AccountDrawer from "@/components/AccountDrawer";

// 미리보기 카드(og:image) 같은 주소를 절대 주소로 만드는 기준 — 배포하면 NEXT_PUBLIC_SITE_URL 이나
// Vercel 의 운영 주소를 쓴다. 카톡은 localhost 를 열 수 없어서 미리보기는 배포한 뒤에야 보인다.
const SITE =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:5710");

export const metadata = {
  metadataBase: new URL(SITE),
  title: "Whisky Lens — 섞어 마시는 위스키",
  description: "가진 위스키와 재료로 오늘 한 잔. 하이볼·잭콕·진저 하이볼 비율과 만드는 순서를 한눈에.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        {/* 위스키 병 사진은 회사 Cafe24 서버에 있다 — 첫 화면에 병이 보이는 곳(위스키 상세 등)에서 연결을 미리 열어 둔다 */}
        <link rel="preconnect" href="https://yogibo.openhost.cafe24.com" />
      </head>
      <body>
        <div className="app">{children}</div>
        <TabBar />
        {/* 내 정보 서랍 — 홈 프로필 단추 · PC 위쪽 메뉴의 프로필 단추가 연다 */}
        <AccountDrawer />
      </body>
    </html>
  );
}
