import SignupFlow from "@/components/SignupFlow";
import { PROVIDERS } from "@/lib/member";

export const metadata = { title: "가입하기 — Whisky Lens" };

export default async function SignupPage({ searchParams }) {
  const { p } = await searchParams;
  return <SignupFlow provider={Object.hasOwn(PROVIDERS, p || "") ? p : "email"} />;
}
