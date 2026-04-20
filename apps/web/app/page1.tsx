"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/providers/auth-provider";
// import { KalpazeroHome } from "@/components/kalpazero/kalpazero-home";

export default function HomePage() {
  const router = useRouter();
  const { session, status } = useAuth();

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    router.replace(session?.role === "platform_admin" ? "/dashboard" : "/tenant");
  }, [router, session?.role, status]);

  if (status === "loading") {
    return <div className="min-h-screen bg-background" />;
  }

  // if (status === "anonymous") {
  //   return <KalpazeroHome />;
  // }

  return <div className="min-h-screen bg-background" />;
}
