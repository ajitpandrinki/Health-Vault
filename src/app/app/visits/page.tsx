"use client";

import { useState } from "react";
import { Plus, Trash2, Calendar } from "lucide-react";
import { useVault } from "@/lib/vault-context";
import { formatINR, formatDate } from "@/lib/i18n";
import { memberName, sortVisits } from "@/lib/stats";
import type { VisitType } from "@/lib/types";
import { Modal, Field, inputClass, btnPrimary, btnSecondary } from "@/components/ui";

const TYPES: VisitType[] = ["opd", "ipd", "emergency", "lab", "teleconsult"];

export default function VisitsPage() {
  const { dict, state, addVisit, removeVisit, canDo } = useVault();
  const [open, setOpen] = useState(false);
  const [memberId, setMemberId] = useState("");
  const [hospital, setHospital] = useState("");
  const [doctor, setDoctor] = useState("");
  const [department, setDepartment] = useState("");
  const [visitType, setVisitType] = useState<VisitType>("opd");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [amount, setAmount] = useState("");

  if (!state) return null;

  const selectedMember = memberId || state.members[0]?.id || "";
  const visits = sortVisits(state.visits);

  function save() {
    if (!hospital.trim()) return;
    addVisit({
      memberId: selectedMember,
      hospital: hospital.trim(),
      doctor: doctor || undefined,
      department: department || undefined,
      visitType,
      date,
      reason: reason || undefined,
      followUpDate: followUp || undefined,
      documentIds: [],
      amount: amount ? Number(amount) : undefined,
    });
    setOpen(false);
    setHospital("");
    setDoctor("");
    setDepartment("");
    setReason("");
    setFollowUp("");
    setAmount("");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-teak-950">
            {dict.visits}
          </h1>
          <p className="mt-1 text-sm text-ink-400">{dict.trackVisits}</p>
        </div>
        {canDo("manage_visits") && (
          <button type="button" className={btnPrimary} onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            {dict.addVisit}
          </button>
        )}
      </div>

      <ol className="relative ml-3 space-y-0 border-l border-teak-200">
        {visits.map((v) => (
          <li key={v.id} className="group relative pb-8 pl-8 last:pb-0">
            <span className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-white bg-teak-600" />
            <div className="rounded-2xl border border-teak-200/70 bg-white/80 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="flex items-center gap-2 text-xs text-ink-400">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(v.date, state.locale)}
                    <span className="rounded-md bg-teak-100 px-1.5 py-0.5 font-medium text-teak-800">
                      {dict.visitTypes[v.visitType]}
                    </span>
                  </p>
                  <h2 className="mt-1 font-display text-lg font-semibold text-teak-950">
                    {v.hospital}
                  </h2>
                  <p className="text-sm text-ink-500">
                    {memberName(state, v.memberId)}
                    {v.doctor ? ` · ${v.doctor}` : ""}
                    {v.department ? ` · ${v.department}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {v.amount != null && (
                    <span className="font-semibold tabular-nums text-teak-800">
                      {formatINR(v.amount, state.locale)}
                    </span>
                  )}
                  {canDo("manage_visits") && (
                    <button
                      type="button"
                      className="rounded-lg p-2 text-ink-300 opacity-0 transition hover:bg-saffron-50 hover:text-saffron-700 group-hover:opacity-100"
                      onClick={() => {
                        if (confirm("Delete visit?")) removeVisit(v.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              {v.reason && <p className="mt-2 text-sm text-ink-600">{v.reason}</p>}
              {v.followUpDate && (
                <p className="mt-2 text-xs font-medium text-saffron-700">
                  Follow-up: {formatDate(v.followUpDate, state.locale)}
                </p>
              )}
            </div>
          </li>
        ))}
        {visits.length === 0 && (
          <p className="pl-8 text-sm text-ink-400">No visits logged yet.</p>
        )}
      </ol>

      <Modal open={open} onClose={() => setOpen(false)} title={dict.addVisit}>
        <div className="space-y-3">
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
          <Field label={dict.hospital}>
            <input
              className={inputClass}
              value={hospital}
              onChange={(e) => setHospital(e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={dict.doctor}>
              <input
                className={inputClass}
                value={doctor}
                onChange={(e) => setDoctor(e.target.value)}
              />
            </Field>
            <Field label={dict.department}>
              <input
                className={inputClass}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <select
                className={inputClass}
                value={visitType}
                onChange={(e) => setVisitType(e.target.value as VisitType)}
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {dict.visitTypes[t]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={dict.date}>
              <input
                type="date"
                className={inputClass}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
          </div>
          <Field label={dict.reason}>
            <input
              className={inputClass}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Follow-up">
              <input
                type="date"
                className={inputClass}
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
              />
            </Field>
            <Field label={dict.amount}>
              <input
                type="number"
                className={inputClass}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
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
