"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, Sparkles, Loader2, CheckCircle2, FolderPlus } from "lucide-react";
import { useVault } from "@/lib/vault-context";
import { extractFromFile } from "@/lib/ai-extract";
import type { AiExtractionResult, BillCategory, DocumentType } from "@/lib/types";
import { formatINR, formatDate } from "@/lib/i18n";
import { Modal, Field, inputClass, btnPrimary, btnSecondary } from "./ui";
import { cn } from "@/lib/cn";

const CAT_KEYS: BillCategory[] = [
  "consultation",
  "diagnostics",
  "medicines",
  "room",
  "other",
];

export function UploadDocumentModal({
  open,
  onClose,
  defaultType = "bill",
  initialMemberId,
}: {
  open: boolean;
  onClose: () => void;
  defaultType?: DocumentType;
  initialMemberId?: string;
}) {
  const { dict, state, addDocument, addMember, canDo } = useVault();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"member" | "record">("member");
  const [type, setType] = useState<DocumentType>(defaultType);
  const [title, setTitle] = useState("");
  const [memberId, setMemberId] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRelation, setNewMemberRelation] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const [memberError, setMemberError] = useState("");
  const [hospital, setHospital] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [fileName, setFileName] = useState<string>();
  const [fileDataUrl, setFileDataUrl] = useState<string>();
  const [categories, setCategories] = useState<
    { category: BillCategory; amount: number }[]
  >([]);
  const [extracting, setExtracting] = useState(false);
  const [extraction, setExtraction] = useState<AiExtractionResult | null>(null);

  useEffect(() => {
    if (!open) return;
    if (initialMemberId) {
      setMemberId(initialMemberId);
      setStep("record");
    } else {
      setMemberId("");
      setStep("member");
    }
  }, [open, initialMemberId]);

  if (!state) return null;

  const activeStep = initialMemberId ? "record" : step;
  const selectedMember = initialMemberId || memberId;
  const selectedMemberName = state.members.find(
    (member) => member.id === selectedMember
  )?.name;

  function resetForm() {
    setStep("member");
    setMemberId("");
    setNewMemberName("");
    setNewMemberRelation("");
    setAddingMember(false);
    setMemberError("");
    setTitle("");
    setHospital("");
    setDate(new Date().toISOString().slice(0, 10));
    setAmount("");
    setNotes("");
    setTags("");
    setFileName(undefined);
    setFileDataUrl(undefined);
    setCategories([]);
    setExtraction(null);
    setType(defaultType);
  }

  function closeModal() {
    resetForm();
    onClose();
  }

  async function createMember() {
    setMemberError("");
    const name = newMemberName.trim();
    const relation = newMemberRelation.trim();
    if (!name || !relation) {
      setMemberError("Enter the person's name and relationship.");
      return;
    }

    setAddingMember(true);
    const member = await addMember({ name, relation });
    setAddingMember(false);
    if (!member) {
      setMemberError("You don't have permission to add a family profile.");
      return;
    }
    setMemberId(member.id);
    setNewMemberName("");
    setNewMemberRelation("");
    setStep("record");
  }

  async function onFile(file: File) {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setFileDataUrl(String(reader.result));
    reader.readAsDataURL(file);

    if (type === "bill" || file.type.startsWith("image/") || file.type === "application/pdf") {
      setExtracting(true);
      setExtraction(null);
      try {
        const result = await extractFromFile(file);
        setExtraction(result);
        setHospital(result.hospital);
        setDate(result.date);
        setAmount(String(result.total));
        setCategories(result.categories);
        if (!title) {
          setTitle(`${result.hospital} — ${dict.bill}`);
        }
      } finally {
        setExtracting(false);
      }
    }
  }

  function handleSave() {
    if (!title.trim() || !selectedMember) return;
    addDocument({
      title: title.trim(),
      type,
      memberId: selectedMember,
      hospital: hospital || undefined,
      date,
      amount: amount ? Number(amount) : undefined,
      categories: categories.length ? categories : undefined,
      notes: notes || undefined,
      fileName,
      fileDataUrl,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      extractedByAi: Boolean(extraction),
    });
    closeModal();
  }

  return (
    <Modal
      open={open}
      onClose={closeModal}
      title={
        activeStep === "member"
          ? "Who is this record for?"
          : selectedMemberName
            ? `Upload for ${selectedMemberName}`
            : dict.upload
      }
      wide
    >
      {activeStep === "member" ? (
        <div className="space-y-5">
          <p className="text-sm text-ink-500">
            Choose a person first. Their medical records will be grouped together in their profile.
          </p>
          {state.members.length > 0 && (
            <Field label="Choose a family member">
              <select
                className={inputClass}
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
              >
                <option value="">Select a person</option>
                {state.members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} · {member.relation}
                  </option>
                ))}
              </select>
            </Field>
          )}

          {canDo("manage_members") && (
            <div className="rounded-xl border border-teak-200 bg-teak-50/60 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-teak-900">
                <FolderPlus className="h-4 w-4" />
                Add a new person&apos;s profile
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Name">
                  <input
                    className={inputClass}
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder="e.g. Rajesh Kumar"
                  />
                </Field>
                <Field label="Relationship">
                  <input
                    className={inputClass}
                    value={newMemberRelation}
                    onChange={(e) => setNewMemberRelation(e.target.value)}
                    placeholder="e.g. Father"
                  />
                </Field>
              </div>
              <button
                type="button"
                className={`${btnSecondary} mt-3`}
                onClick={() => void createMember()}
                disabled={addingMember}
              >
                {addingMember ? "Creating profile…" : "Create profile and continue"}
              </button>
            </div>
          )}

          {memberError && (
            <p className="rounded-lg bg-saffron-50 px-3 py-2 text-sm text-saffron-800">
              {memberError}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              className={btnPrimary}
              onClick={() => setStep("record")}
              disabled={!selectedMember}
            >
              Continue
            </button>
          </div>
        </div>
      ) : (
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-xl bg-teak-50 px-3 py-2 text-sm">
          <span className="text-ink-500">
            Saving to{" "}
            <strong className="text-teak-900">
              {selectedMemberName}&apos;s profile
            </strong>
          </span>
          {!initialMemberId && (
            <button
              type="button"
              className="font-medium text-teak-700 hover:underline"
              onClick={() => setStep("member")}
            >
              Change person
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {(["bill", "prescription", "report", "insurance"] as DocumentType[]).map(
            (t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition",
                  type === t
                    ? "bg-teak-700 text-white"
                    : "bg-teak-100 text-teak-800 hover:bg-teak-200"
                )}
              >
                {t === "insurance" ? "Insurance card" : dict[t]}
              </button>
            )
          )}
        </div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) void onFile(f);
          }}
          onClick={() => fileRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-teak-300 bg-teak-50/50 px-4 py-8 text-center transition hover:border-teak-500 hover:bg-teak-50"
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
            }}
          />
          {extracting ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-teak-600" />
              <p className="text-sm font-medium text-teak-800">{dict.extracting}</p>
              <div className="mt-2 h-1.5 w-48 overflow-hidden rounded-full bg-teak-200">
                <div className="h-full w-1/2 animate-shimmer rounded-full bg-gradient-to-r from-teak-400 via-saffron-400 to-teak-400 bg-[length:200%_100%]" />
              </div>
            </>
          ) : fileName ? (
            <>
              <CheckCircle2 className="h-8 w-8 text-teak-600" />
              <p className="text-sm font-medium text-teak-900">{fileName}</p>
              {extraction && (
                <p className="flex items-center gap-1 text-xs text-saffron-700">
                  <Sparkles className="h-3 w-3" />
                  {dict.extractDone} · {dict.confidence}{" "}
                  {Math.round(extraction.confidence * 100)}%
                </p>
              )}
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-teak-500" />
              <p className="text-sm text-ink-600">{dict.dropHint}</p>
              <p className="flex items-center gap-1 text-xs text-saffron-600">
                <Sparkles className="h-3 w-3" />
                {dict.aiPower}
              </p>
            </>
          )}
        </div>

        {extraction && (
          <div className="rounded-2xl border border-teak-200 bg-gradient-to-br from-teak-50 to-white p-4 animate-fade-up">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-teak-900">
              <Sparkles className="h-4 w-4 text-saffron-600" />
              AI · {extraction.hospital}
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <div>
                <div className="text-xs text-ink-400">{dict.hospital}</div>
                <div className="font-medium">{extraction.hospital}</div>
              </div>
              <div>
                <div className="text-xs text-ink-400">{dict.date}</div>
                <div className="font-medium">
                  {formatDate(extraction.date, state.locale)}
                </div>
              </div>
              <div>
                <div className="text-xs text-ink-400">{dict.total}</div>
                <div className="font-display text-lg font-semibold text-teak-800">
                  {formatINR(extraction.total, state.locale)}
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="text-xs font-medium uppercase tracking-wide text-ink-400">
                {dict.categories}
              </div>
              {extraction.categories.map((c) => (
                <div
                  key={c.category}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-ink-700">{dict[c.category]}</span>
                  <span className="font-medium tabular-nums">
                    {formatINR(c.amount, state.locale)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={dict.documents}>
            <input
              className={inputClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
            />
          </Field>
          <Field label={dict.hospital}>
            <input
              className={inputClass}
              value={hospital}
              onChange={(e) => setHospital(e.target.value)}
            />
          </Field>
          <Field label={dict.date}>
            <input
              type="date"
              className={inputClass}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
          <Field label={dict.amount}>
            <input
              type="number"
              className={inputClass}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="₹"
            />
          </Field>
          <Field label={dict.tags}>
            <input
              className={inputClass}
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="ipd, delhi"
            />
          </Field>
        </div>

        {type === "bill" && categories.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2">
            {CAT_KEYS.map((key) => {
              const row = categories.find((c) => c.category === key);
              return (
                <Field key={key} label={dict[key]}>
                  <input
                    type="number"
                    className={inputClass}
                    value={row?.amount ?? ""}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setCategories((prev) => {
                        const next = prev.filter((c) => c.category !== key);
                        if (val > 0) next.push({ category: key, amount: val });
                        return next;
                      });
                      setAmount(
                        String(
                          (() => {
                            const next = categories.filter((c) => c.category !== key);
                            if (val > 0) next.push({ category: key, amount: val });
                            return next.reduce((s, c) => s + c.amount, 0);
                          })()
                        )
                      );
                    }}
                  />
                </Field>
              );
            })}
          </div>
        )}

        <Field label={dict.notes}>
          <textarea
            className={cn(inputClass, "min-h-[80px] resize-y")}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className={btnSecondary} onClick={closeModal}>
            {dict.cancel}
          </button>
          <button
            type="button"
            className={btnPrimary}
            onClick={handleSave}
            disabled={!title.trim()}
          >
            {dict.save}
          </button>
        </div>
      </div>
      )}
    </Modal>
  );
}
