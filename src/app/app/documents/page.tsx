"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Trash2, Sparkles, FileText, ExternalLink } from "lucide-react";
import { useVault } from "@/lib/vault-context";
import { formatINR, formatDate } from "@/lib/i18n";
import { searchDocuments, memberName, sortByDateDesc } from "@/lib/stats";
import type { DocumentType } from "@/lib/types";
import { UploadDocumentModal } from "@/components/UploadDocumentModal";
import { btnPrimary, inputClass } from "@/components/ui";
import { cn } from "@/lib/cn";

export default function DocumentsPage() {
  const { dict, state, removeDocument, canDo } = useVault();
  const [q, setQ] = useState("");
  const [type, setType] = useState<DocumentType | "all">("all");
  const [memberId, setMemberId] = useState("all");
  const [uploadOpen, setUploadOpen] = useState(false);

  useEffect(() => {
    const requestedMemberId = new URLSearchParams(window.location.search).get("memberId");
    if (requestedMemberId && state?.members.some((member) => member.id === requestedMemberId)) {
      setMemberId(requestedMemberId);
    }
  }, [state?.members]);

  const filtered = useMemo(() => {
    if (!state) return [];
    let docs = searchDocuments(state.documents, q);
    if (type !== "all") docs = docs.filter((d) => d.type === type);
    if (memberId !== "all") docs = docs.filter((d) => d.memberId === memberId);
    return sortByDateDesc(docs);
  }, [state, q, type, memberId]);

  if (!state) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-teak-950">
            {dict.documents}
          </h1>
          <p className="mt-1 text-sm text-ink-400">
            {filtered.length} saved bills, insurance cards, and other medical records
          </p>
        </div>
        {canDo("upload") && (
          <button type="button" className={btnPrimary} onClick={() => setUploadOpen(true)}>
            <Plus className="h-4 w-4" />
            {dict.upload}
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            className={cn(inputClass, "pl-10")}
            placeholder={dict.search}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          className={cn(inputClass, "sm:w-40")}
          value={type}
          onChange={(e) => setType(e.target.value as DocumentType | "all")}
        >
          <option value="all">{dict.allTypes}</option>
          <option value="bill">{dict.bill}</option>
          <option value="prescription">{dict.prescription}</option>
          <option value="report">{dict.report}</option>
          <option value="insurance">Insurance card</option>
        </select>
        <select
          className={cn(inputClass, "sm:w-48")}
          value={memberId}
          onChange={(e) => setMemberId(e.target.value)}
        >
          <option value="all">{dict.familyMembers}</option>
          {state.members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-ink-400">{dict.noResults}</p>
      ) : (
        <ul className="grid gap-3">
          {filtered.map((d) => (
            <li
              key={d.id}
              className="group flex flex-col gap-3 rounded-2xl border border-teak-200/70 bg-white/80 p-4 sm:flex-row sm:items-center"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teak-100 text-teak-700">
                {d.extractedByAi ? (
                  <Sparkles className="h-5 w-5 text-saffron-600" />
                ) : (
                  <FileText className="h-5 w-5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-teak-950">{d.title}</p>
                <p className="mt-0.5 text-xs text-ink-400">
                  {d.type === "insurance" ? "Insurance card" : dict[d.type]}
                  {d.hospital ? ` · ${d.hospital}` : ""} ·{" "}
                  {memberName(state, d.memberId)} ·{" "}
                  {formatDate(d.date, state.locale)}
                </p>
                {d.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {d.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-md bg-teak-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-teak-700"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                {d.categories && d.categories.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500">
                    {d.categories.map((c) => (
                      <span key={c.category}>
                        {dict[c.category]}{" "}
                        <span className="font-medium text-ink-700">
                          {formatINR(c.amount, state.locale)}
                        </span>
                      </span>
                    ))}
                  </div>
                )}
                {d.fileDataUrl && (
                  <a
                    href={d.fileDataUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-teak-700 hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open saved file{d.fileName ? ` · ${d.fileName}` : ""}
                  </a>
                )}
              </div>
              <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                {d.amount != null && (
                  <span className="font-display text-lg font-semibold tabular-nums text-teak-800">
                    {formatINR(d.amount, state.locale)}
                  </span>
                )}
                  {canDo("delete_docs") && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Delete this document?")) removeDocument(d.id);
                      }}
                      className="rounded-lg p-2 text-ink-300 opacity-0 transition hover:bg-saffron-50 hover:text-saffron-700 group-hover:opacity-100"
                      aria-label={dict.delete}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <UploadDocumentModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        initialMemberId={uploadOpen && memberId !== "all" ? memberId : undefined}
      />
    </div>
  );
}
