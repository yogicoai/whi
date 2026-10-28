// 시작하기(로그인) — 가입 방법을 고르는 첫 화면.
//
// 실제 로그인(카카오·네이버·Google)은 아직 붙이지 않았다(클라이언트 결정 대기). 지금은 어느 단추를 눌러도
// 같은 가입 과정(/signup)을 지나 이 기기에 회원정보를 남긴다 — lib/member.js, docs/member-data.md.
// 브랜드 로고는 쓰지 않고 이름과 색만 쓴다(정식 연동 때 각 사의 단추 규정에 맞춰 바꾼다).

import Link from "next/link";
import BackButton from "@/components/BackButton";
import SiteFooter from "@/components/SiteFooter";
import { PROVIDERS } from "@/lib/member";
import { drinkPhoto } from "@/lib/photos";

export const metadata = { title: "시작하기 — Whisky Lens" };

// 푸터의 약관 링크가 시행일에 맞춰 바뀌게 한 시간마다 새로 그린다(어드민에서 고치면 바로 새로 그린다)
export const revalidate = 3600;

export default function LoginPage() {
  return (
    <main className="page page-detail page-narrow">
      <BackButton fallback="/" />
      <div className="auth-art" aria-hidden="true">
        {["highball", "cola", "oldfashioned"].map((k) => (
          <img key={k} src={drinkPhoto(k)} alt="" />
        ))}
      </div>
      <h1 className="display">
        나만의 한 잔,
        <br />
        저장하고 나눠요
      </h1>
      <p className="lead">가입하면 내 레시피를 어느 기기에서나 보고, 친구에게 보낼 때 내 이름이 붙어요.</p>

      <div className="auth-buttons">
        {Object.entries(PROVIDERS).map(([key, p]) => (
          <Link key={key} href={`/signup?p=${key}`} className={`auth-btn ${key}`}>
            {p.name}로 시작하기
          </Link>
        ))}
      </div>
      <Link href="/" className="auth-skip">둘러보기만 할게요</Link>
      <p className="note dim center">
        만 19세 이상만 이용할 수 있어요.
        <br />
        지금은 시연용이라 실제 계정에 연결하지 않고 이 기기에만 저장해요.
      </p>
      <SiteFooter />
    </main>
  );
}
