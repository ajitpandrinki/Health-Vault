"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useVault } from "@/lib/vault-context";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { ready, authenticated } = useVault();
  const router = useRouter();

  useEffect(() => {
    if (ready && !authenticated) {
      router.replace("/login");
    }
  }, [ready, authenticated, router]);

  if (!ready || !authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-teak-50 text-teak-800">
        <div className="animate-pulse-soft font-display text-xl tracking-wide">
          HealthVault India
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
