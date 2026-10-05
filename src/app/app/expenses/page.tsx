"use client";

import { useVault } from "@/lib/vault-context";
import { formatINR } from "@/lib/i18n";
import {
  sumAmounts,
  isSameMonth,
  spendByCategory,
  spendByMember,
} from "@/lib/stats";
import type { BillCategory } from "@/lib/types";
import { StatCard } from "@/components/StatCard";

const CAT_ORDER: BillCategory[] = [
  "consultation",
  "diagnostics",
  "medicines",
  "room",
  "other",
];

const CAT_COLORS: Record<BillCategory, string> = {
  consultation: "#557a5d",
  diagnostics: "#f05f06",
  medicines: "#3a4352",
  room: "#8694ab",
  other: "#c74607",
};

export default function ExpensesPage() {
  const { dict, state } = useVault();
  if (!state) return null;

  const total = sumAmounts(state.documents);
  const month = sumAmounts(state.documents.filter((d) => isSameMonth(d.date)));
  const byCat = spendByCategory(state.documents);
  const catTotal = Object.values(byCat).reduce((s, n) => s + n, 0) || 1;
  const byMember = spendByMember(state).sort((a, b) => b.total - a.total);
  const maxMember = Math.max(...byMember.map((m) => m.total), 1);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold text-teak-950">
          {dict.expenses}
        </h1>
        <p className="mt-1 text-sm text-ink-400">{dict.trackExpenses}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label={dict.totalSpent}
          value={formatINR(total, state.locale)}
          accent="teal"
        />
        <StatCard
          label={dict.thisMonth}
          value={formatINR(month, state.locale)}
          accent="warm"
        />
      </div>

      <section>
        <h2 className="mb-4 font-display text-lg font-semibold text-teak-900">
          {dict.spentByCategory}
        </h2>
        <div className="overflow-hidden rounded-2xl border border-teak-200/70 bg-white/80 p-5">
          <div className="mb-6 flex h-4 w-full overflow-hidden rounded-full bg-teak-100">
            {CAT_ORDER.map((key) => {
              const pct = (byCat[key] / catTotal) * 100;
              if (pct < 0.5) return null;
              return (
                <div
                  key={key}
                  style={{
                    width: `${pct}%`,
                    backgroundColor: CAT_COLORS[key],
                  }}
                  title={`${dict[key]}: ${formatINR(byCat[key], state.locale)}`}
                />
              );
            })}
          </div>
          <ul className="space-y-3">
            {CAT_ORDER.map((key) => (
              <li key={key} className="flex items-center gap-3 text-sm">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: CAT_COLORS[key] }}
                />
                <span className="flex-1 text-ink-700">{dict[key]}</span>
                <span className="font-semibold tabular-nums text-teak-900">
                  {formatINR(byCat[key], state.locale)}
                </span>
                <span className="w-12 text-right text-xs text-ink-400">
                  {Math.round((byCat[key] / catTotal) * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-lg font-semibold text-teak-900">
          {dict.spentByMember}
        </h2>
        <ul className="space-y-4">
          {byMember.map(({ member, total: amt }) => (
            <li key={member.id}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: member.avatarColor }}
                  >
                    {member.name.charAt(0)}
                  </span>
                  <span className="font-medium text-teak-900">{member.name}</span>
                  <span className="text-xs text-ink-400">{member.relation}</span>
                </div>
                <span className="font-semibold tabular-nums">
                  {formatINR(amt, state.locale)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-teak-100">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${(amt / maxMember) * 100}%`,
                    backgroundColor: member.avatarColor,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
