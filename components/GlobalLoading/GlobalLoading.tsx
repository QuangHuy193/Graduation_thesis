"use client";

import { useGlobalLoading } from "@/lib/hook/useGlobalLoading";

export default function GlobalLoading() {
  useGlobalLoading(); // Chỉ để mount và theo dõi route
  return null;
}
