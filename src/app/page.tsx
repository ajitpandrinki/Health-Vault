"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useVault } from "@/lib/vault-context";

export default function LandingPage() {
  const { dict, authenticated, ready } = useVault();
  const router = useRouter();

  useEffect(() => {
    if (ready && authenticated) router.replace("/app");
  }, [ready, authenticated, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-mesh bg-teak-50 px-4">
      <section className="w-full max-w-md rounded-2xl border border-teak-200/70 bg-white/90 p-8 text-center shadow-sm backdrop-blur sm:p-10">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-teak-950">
          {dict.brand}
        </h1>
        <p className="mt-3 text-sm text-ink-500">
          Sign in or create an account to continue.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center rounded-xl bg-teak-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teak-900"
          >
            {dict.login}
          </Link>
          <Link
            href="/register"
            className="inline-flex w-full items-center justify-center rounded-xl border border-teak-200 bg-white px-4 py-3 text-sm font-semibold text-teak-800 transition hover:bg-teak-50"
          >
            {dict.register}
          </Link>
        </div>
      </section>
    </main>
  );
}
