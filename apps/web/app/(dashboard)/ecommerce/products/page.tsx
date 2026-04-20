"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProductsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/ecommerce");
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500/30 border-t-cyan-500" />
      <span className="font-mono text-xs uppercase tracking-widest text-slate-500">
        Redirecting to Products Hub...
      </span>
    </div>
  );
}
