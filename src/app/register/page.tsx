"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useVault } from "@/lib/vault-context";
import { Field, inputClass, btnPrimary } from "@/components/ui";

export default function RegisterPage() {
  const { dict, register, authenticated, ready } = useVault();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  useEffect(() => {
    if (ready && authenticated && !registrationComplete) router.replace("/app");
  }, [ready, authenticated, registrationComplete, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const res = await register({ fullName, email, password, familyName });
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? "Registration failed");
      return;
    }
    setRegistrationComplete(true);
    router.push("/app/setup");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-mesh bg-teak-50 px-4 py-10">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-8 block text-center font-display text-2xl font-semibold text-teak-950"
        >
          {dict.brand}
        </Link>
        <div className="rounded-2xl border border-teak-200/70 bg-white/90 p-6 shadow-sm backdrop-blur sm:p-8">
          <h1 className="font-display text-2xl font-semibold text-teak-950">
            {dict.register}
          </h1>
          <p className="mt-1 text-sm text-ink-400">
            Start your own family vault — any surname you like.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <Field label={dict.fullName}>
              <input
                required
                className={inputClass}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ananya Reddy"
              />
            </Field>
            <Field label={dict.familyName}>
              <input
                required
                className={inputClass}
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="Reddy Family"
              />
              <span className="mt-1 block text-xs text-ink-400">
                {dict.familyNameHint}
              </span>
            </Field>
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
                autoComplete="new-password"
                required
                minLength={6}
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <Field label={dict.confirmPassword}>
              <input
                type="password"
                autoComplete="new-password"
                required
                className={inputClass}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </Field>
            {error && (
              <p className="rounded-lg bg-saffron-50 px-3 py-2 text-sm text-saffron-800">
                {error}
              </p>
            )}
            <button type="submit" className={`${btnPrimary} w-full`} disabled={loading}>
              {loading ? dict.creatingAccount : dict.register}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-500">
            {dict.hasAccount}{" "}
            <Link href="/login" className="font-medium text-teak-700 hover:underline">
              {dict.login}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
