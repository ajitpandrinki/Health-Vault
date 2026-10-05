"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useVault } from "@/lib/vault-context";
import { formatINR, formatDate } from "@/lib/i18n";
import { memberName } from "@/lib/stats";
import type { ClaimStatus } from "@/lib/types";
import { Modal, Field, inputClass, btnPrimary, btnSecondary } from "@/components/ui";
import { cn } from "@/lib/cn";

const STATUSES: ClaimStatus[] = [
  "draft",
  "submitted",
  "under_review",
  "approved",
  "rejected",
  "paid",
];

const STATUS_STYLE: Record<ClaimStatus, string> = {
  draft: "bg-ink-100 text-ink-600",
  submitted: "bg-teak-100 text-teak-800",
  under_review: "bg-saffron-100 text-saffron-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  paid: "bg-teak-700 text-white",
};

export default function ClaimsPage() {
  const { dict, state, addClaim, updateClaim, removeClaim, canDo } = useVault();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [memberId, setMemberId] = useState("");
  const [insurer, setInsurer] = useState("Star Health");
  const [policy, setPolicy] = useState("");
  const [hospital, setHospital] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<ClaimStatus>("draft");

  if (!state) return null;

  const selectedMember = memberId || state.members[0]?.id || "";

  function save() {
    if (!title.trim() || !amount) return;
    addClaim({
      title: title.trim(),
      memberId: selectedMember,
      insurer,
      policyNumber: policy,
      hospital: hospital || undefined,
      amountClaimed: Number(amount),
      status,
      documentIds: [],
      submittedAt: status !== "draft" ? new Date().toISOString().slice(0, 10) : undefined,
    });
    setOpen(false);
    setTitle("");
    setHospital("");
    setAmount("");
    setStatus("draft");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-teak-950">
            {dict.claims}
          </h1>
          <p className="mt-1 text-sm text-ink-400">{dict.trackClaims}</p>
        </div>
        {canDo("manage_claims") && (
          <button type="button" className={btnPrimary} onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            {dict.addClaim}
          </button>
        )}
      </div>

      <ul className="space-y-3">
        {state.claims.map((c) => (
          <li
            key={c.id}
            className="group rounded-2xl border border-teak-200/70 bg-white/80 p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-lg font-semibold text-teak-950">
                    {c.title}
                  </h2>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      STATUS_STYLE[c.status]
                    )}
                  >
                    {dict.claimStatuses[c.status]}
                  </span>
                </div>
                <p className="mt-1 text-sm text-ink-400">
                  {c.insurer} · {c.policyNumber} · {memberName(state, c.memberId)}
                  {c.hospital ? ` · ${c.hospital}` : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-xl font-semibold tabular-nums text-teak-800">
                  {formatINR(c.amountClaimed, state.locale)}
                </p>
                {c.amountApproved != null && (
                  <p className="text-xs text-ink-400">
                    {dict.amountApproved}:{" "}
                    {formatINR(c.amountApproved, state.locale)}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {canDo("manage_claims") ? (
                <select
                  className={cn(inputClass, "w-auto")}
                  value={c.status}
                  onChange={(e) =>
                    updateClaim(c.id, { status: e.target.value as ClaimStatus })
                  }
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {dict.claimStatuses[s]}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-xs font-medium text-ink-500">
                  {dict.claimStatuses[c.status]}
                </span>
              )}
              {c.submittedAt && (
                <span className="text-xs text-ink-400">
                  {formatDate(c.submittedAt, state.locale)}
                </span>
              )}
              {canDo("manage_claims") && (
                <button
                  type="button"
                  className="ml-auto rounded-lg p-2 text-ink-300 opacity-0 transition hover:bg-saffron-50 hover:text-saffron-700 group-hover:opacity-100"
                  onClick={() => {
                    if (confirm("Delete claim?")) removeClaim(c.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            {c.notes && (
              <p className="mt-3 text-sm text-ink-500">{c.notes}</p>
            )}
          </li>
        ))}
      </ul>

      <Modal open={open} onClose={() => setOpen(false)} title={dict.addClaim}>
        <div className="space-y-3">
          <Field label="Title">
            <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label={dict.member}>
            <select
              className={inputClass}
              value={selectedMember}
              onChange={(e) => setMemberId(e.target.value)}
            >
              {state.members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={dict.insurer}>
              <input
                className={inputClass}
                value={insurer}
                onChange={(e) => setInsurer(e.target.value)}
              />
            </Field>
            <Field label={dict.policy}>
              <input
                className={inputClass}
                value={policy}
                onChange={(e) => setPolicy(e.target.value)}
              />
            </Field>
          </div>
          <Field label={dict.hospital}>
            <input
              className={inputClass}
              value={hospital}
              onChange={(e) => setHospital(e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={dict.amountClaimed}>
              <input
                type="number"
                className={inputClass}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </Field>
            <Field label={dict.status}>
              <select
                className={inputClass}
                value={status}
                onChange={(e) => setStatus(e.target.value as ClaimStatus)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {dict.claimStatuses[s]}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className={btnSecondary} onClick={() => setOpen(false)}>
              {dict.cancel}
            </button>
            <button type="button" className={btnPrimary} onClick={save}>
              {dict.save}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
