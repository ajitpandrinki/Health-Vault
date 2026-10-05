"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FolderPlus, Plus } from "lucide-react";
import { useVault } from "@/lib/vault-context";
import { Field, inputClass, btnPrimary, btnSecondary } from "@/components/ui";

export default function ProfileSetupPage() {
  const { state, addMember } = useVault();
  const router = useRouter();
  const [name, setName] = useState("");
  const [relation, setRelation] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (!state) return null;

  async function createProfile() {
    setError("");
    if (!name.trim() || !relation.trim()) {
      setError("Enter the person's name and relationship.");
      return;
    }

    setSaving(true);
    try {
      const member = await addMember({
        name: name.trim(),
        relation: relation.trim(),
      });
      if (!member) {
        setError("You don't have permission to add family profiles.");
        return;
      }
      setName("");
      setRelation("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6">
      <header className="rounded-2xl border border-teak-200/70 bg-white/80 p-6 sm:p-8">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-teak-100 text-teak-700">
          <FolderPlus className="h-5 w-5" />
        </div>
        <h1 className="font-display text-2xl font-semibold text-teak-950 sm:text-3xl">
          Set up family profiles
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-ink-500">
          Your profile is ready. Add a profile for each family member whose
          medical records you want to organize. You can add more profiles later.
        </p>
      </header>

      <section className="rounded-2xl border border-teak-200/70 bg-white/80 p-5 sm:p-6">
        <h2 className="mb-4 font-display text-lg font-semibold text-teak-900">
          Create a family member profile
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Person's name">
            <input
              className={inputClass}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Rajesh Kumar"
            />
          </Field>
          <Field label="Relationship to you">
            <input
              className={inputClass}
              value={relation}
              onChange={(event) => setRelation(event.target.value)}
              placeholder="e.g. Father"
            />
          </Field>
        </div>
        {error && (
          <p className="mt-3 rounded-lg bg-saffron-50 px-3 py-2 text-sm text-saffron-800">
            {error}
          </p>
        )}
        <button
          type="button"
          className={`${btnSecondary} mt-4`}
          onClick={() => void createProfile()}
          disabled={saving}
        >
          <Plus className="h-4 w-4" />
          {saving ? "Creating profile…" : "Add profile"}
        </button>
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-teak-900">
          Profiles in {state.family.name}
        </h2>
        <ul className="space-y-2">
          {state.members.map((member) => (
            <li
              key={member.id}
              className="flex items-center gap-3 rounded-xl border border-teak-200/70 bg-white/80 p-3"
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                style={{ backgroundColor: member.avatarColor }}
              >
                {member.name.charAt(0)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-teak-950">
                  {member.name}
                </span>
                <span className="block text-xs text-ink-400">{member.relation}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <footer className="flex flex-col-reverse gap-3 border-t border-teak-200/70 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-ink-400">
          You can add or manage profiles at any time from the Family page.
        </p>
        <button
          type="button"
          className={btnPrimary}
          disabled={state.members.length === 0}
          onClick={() => router.replace("/app")}
        >
          Continue to dashboard
        </button>
      </footer>
    </main>
  );
}
