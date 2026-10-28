"use client";

// 뒤로 — 앱 안에서 들어왔으면 이전 화면으로, 링크로 바로 들어왔으면 갈 곳(fallback)으로.

import { useRouter } from "next/navigation";
import Icon from "./Icon";

export default function BackButton({ fallback = "/" }) {
  const router = useRouter();
  return (
    <button
      className="back"
      aria-label="뒤로"
      onClick={() => (window.history.length > 1 ? router.back() : router.push(fallback))}
    >
      <Icon name="back" size={22} />
    </button>
  );
}
