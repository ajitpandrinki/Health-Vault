"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useVault } from "@/lib/vault-context";
import { Field, inputClass, btnPrimary } from "@/components/ui";

export default function LoginPage() {
  const { dict, login, authenticated, ready } = useVault();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && authenticated) router.replace("/app");
  }, [ready, authenticated, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? "Login failed");
      return;
    }
    router.push("/app");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-mesh bg-teak-50 px-4">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-8 block text-center font-display text-2xl font-semibold text-teak-950"
        >
          {dict.brand}
        </Link>
        <div className="rounded-2xl border border-teak-200/70 bg-white/90 p-6 shadow-sm backdrop-blur sm:p-8">
          <h1 className="font-display text-2xl font-semibold text-teak-950">
            {dict.login}
          </h1>
          <p className="mt-1 text-sm text-ink-400">{dict.hasAccount}</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <Field label={dict.email}>
              <input
                type="email"
                autoComplete="email"
                required
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label={dict.password}>
              <input
                type="password"
                autoComplete="current-password"
                required
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            {error && (
              <p className="rounded-lg bg-saffron-50 px-3 py-2 text-sm text-saffron-800">
                {error}
              </p>
            )}
            <button type="submit" className={`${btnPrimary} w-full`} disabled={loading}>
              {loading ? dict.signingIn : dict.login}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-500">
            {dict.noAccount}{" "}
            <Link href="/register" className="font-medium text-teak-700 hover:underline">
              {dict.register}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
