import { cn } from "@/lib/cn";

export function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "teal" | "warm" | "ink";
}) {
  const ring =
    accent === "warm"
      ? "from-saffron-500/15 to-transparent"
      : accent === "ink"
        ? "from-ink-500/10 to-transparent"
        : "from-teak-500/15 to-transparent";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-teak-200/60 bg-white/80 p-5 shadow-sm backdrop-blur-sm animate-fade-up"
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-80",
          ring
        )}
      />
      <div className="relative">
        <p className="text-xs font-medium uppercase tracking-wider text-ink-400">
          {label}
        </p>
        <p className="mt-2 font-display text-2xl font-semibold tracking-tight text-teak-950 sm:text-3xl">
          {value}
        </p>
        {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
      </div>
    </div>
  );
}
