"use client";

import { cn } from "@/lib/cn";

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl animate-fade-up sm:rounded-2xl sm:p-6",
          wide ? "sm:max-w-2xl" : "sm:max-w-lg"
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="font-display text-xl font-semibold text-teak-950">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-ink-400 hover:bg-teak-50 hover:text-ink-700"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-ink-500">
        {label}
      </span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-teak-200 bg-teak-50/40 px-3 py-2.5 text-sm text-ink-900 outline-none transition focus:border-teak-500 focus:bg-white focus:ring-2 focus:ring-teak-500/20";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-teak-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-teak-800 disabled:opacity-50";

export const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-teak-200 bg-white px-4 py-2.5 text-sm font-medium text-teak-800 transition hover:bg-teak-50";
