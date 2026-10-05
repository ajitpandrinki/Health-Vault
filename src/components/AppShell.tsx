"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  Languages,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { useVault } from "@/lib/vault-context";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/app", icon: LayoutDashboard, key: "dashboard" as const },
  { href: "/app/documents", icon: FileText, key: "documents" as const },
  { href: "/app/family", icon: Users, key: "family" as const },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { dict, state, setLocale, logout } = useVault();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (!state) return null;

  const NavLinks = () => (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active =
          item.href === "/app"
            ? pathname === "/app"
            : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-teak-700 text-white"
                : "text-ink-600 hover:bg-teak-100 hover:text-teak-900"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {dict[item.key]}
          </Link>
        );
      })}
    </nav>
  );

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-mesh bg-teak-50">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-teak-200/60 bg-white/70 px-4 py-6 backdrop-blur-md lg:flex">
          <Link href="/app" className="mb-2 px-2">
            <div className="font-display text-xl font-semibold tracking-tight text-teak-900">
              {dict.brand}
            </div>
          </Link>
          <div className="mb-6 px-2">
            <p className="truncate text-sm font-medium text-teak-800">
              {state.family.name}
            </p>
            <p className="truncate text-xs text-ink-400">
              {state.user.fullName} · {dict.roles[state.user.role]}
            </p>
          </div>
          <NavLinks />
          <div className="mt-auto space-y-2 border-t border-teak-100 pt-4">
            <button
              type="button"
              onClick={() => setLocale(state.locale === "en" ? "hi" : "en")}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-600 hover:bg-teak-50"
            >
              <Languages className="h-4 w-4" />
              {state.locale === "en" ? dict.hindi : dict.english}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-500 hover:bg-saffron-50 hover:text-saffron-700"
            >
              <LogOut className="h-4 w-4" />
              {dict.logout}
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-teak-200/50 bg-white/80 px-4 py-3 backdrop-blur-md lg:hidden">
            <div>
              <Link href="/app" className="font-display text-lg font-semibold text-teak-900">
                {dict.brand}
              </Link>
              <p className="text-xs text-ink-400">{state.family.name}</p>
            </div>
            <button
              type="button"
              aria-label="Menu"
              onClick={() => setOpen((v) => !v)}
              className="rounded-lg p-2 text-ink-700 hover:bg-teak-100"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </header>

          {open && (
            <div className="border-b border-teak-100 bg-white px-4 py-3 lg:hidden">
              <NavLinks />
              <div className="mt-3 flex gap-2 border-t border-teak-50 pt-3">
                <button
                  type="button"
                  onClick={() => setLocale(state.locale === "en" ? "hi" : "en")}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-teak-50 py-2 text-sm"
                >
                  <Languages className="h-4 w-4" />
                  {state.locale === "en" ? dict.hindi : dict.english}
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-saffron-50 py-2 text-sm text-saffron-800"
                >
                  <LogOut className="h-4 w-4" />
                  {dict.logout}
                </button>
              </div>
            </div>
          )}

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
