"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Trash2, UserPlus, Pencil } from "lucide-react";
import { useVault } from "@/lib/vault-context";
import { formatDate } from "@/lib/i18n";
import type { UserRole } from "@/lib/types";
import { canAssignRole } from "@/lib/permissions";
import { Modal, Field, inputClass, btnPrimary, btnSecondary } from "@/components/ui";
import { cn } from "@/lib/cn";

export default function FamilyPage() {
  const {
    dict,
    state,
    canDo,
    addMember,
    removeMember,
    renameFamily,
    inviteUser,
    changeUserRole,
  } = useVault();
  const [open, setOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [name, setName] = useState("");
  const [relation, setRelation] = useState("");
  const [familyLabel, setFamilyLabel] = useState("");
  const [invName, setInvName] = useState("");
  const [invEmail, setInvEmail] = useState("");
  const [invPassword, setInvPassword] = useState("");
  const [invRelation, setInvRelation] = useState("");
  const [invRole, setInvRole] = useState<UserRole>("member");
  const [error, setError] = useState("");
  const [profileError, setProfileError] = useState("");
  const [savingMember, setSavingMember] = useState(false);

  if (!state) return null;

  async function saveMember() {
    setProfileError("");
    if (!name.trim() || !relation.trim()) {
      setProfileError("Enter a name and relationship.");
      return;
    }
    setSavingMember(true);
    try {
      const member = await addMember({
        name: name.trim(),
        relation: relation.trim(),
      });
      if (!member) {
        setProfileError("You don't have permission to add family profiles.");
        return;
      }
      setName("");
      setRelation("");
      setOpen(false);
    } catch (cause) {
      setProfileError(
        cause instanceof Error ? cause.message : "Could not create the family profile."
      );
    } finally {
      setSavingMember(false);
    }
  }

  async function saveInvite() {
    setError("");
    const res = await inviteUser({
      fullName: invName,
      email: invEmail,
      password: invPassword,
      role: invRole,
      relation: invRelation || "Family",
    });
    if (!res.ok) {
      setError(res.error ?? "Failed");
      return;
    }
    setInviteOpen(false);
    setInvName("");
    setInvEmail("");
    setInvPassword("");
    setInvRelation("");
    setInvRole("member");
  }

  function saveRename() {
    renameFamily(familyLabel);
    setRenameOpen(false);
  }

  const assignableRoles = (["admin", "member", "viewer"] as UserRole[]).filter(
    (r) => canAssignRole(state.user.role, r)
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-ink-400">{dict.yourFamily}</p>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl font-semibold text-teak-950">
              {state.family.name}
            </h1>
            {canDo("rename_family") && (
              <button
                type="button"
                className="rounded-lg p-1.5 text-ink-400 hover:bg-teak-100 hover:text-teak-800"
                onClick={() => {
                  setFamilyLabel(state.family.name);
                  setRenameOpen(true);
                }}
                aria-label={dict.renameFamily}
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="mt-1 text-sm text-ink-400">
            {dict.organiseFamily} · {dict.roles[state.user.role]}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canDo("invite_user") && (
            <button
              type="button"
              className={btnSecondary}
              onClick={() => setInviteOpen(true)}
            >
              <UserPlus className="h-4 w-4" />
              {dict.inviteUser}
            </button>
          )}
          {canDo("manage_members") && (
            <button type="button" className={btnPrimary} onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" />
              {dict.addMember}
            </button>
          )}
        </div>
      </div>

      {canDo("manage_roles") && state.familyUsers.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-lg font-semibold text-teak-900">
            {dict.accountUsers}
          </h2>
          <ul className="space-y-2 rounded-2xl border border-teak-200/70 bg-white/80 p-3">
            {state.familyUsers.map((u) => (
              <li
                key={u.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2 hover:bg-teak-50/60"
              >
                <div>
                  <p className="text-sm font-medium text-teak-950">{u.fullName}</p>
                  <p className="text-xs text-ink-400">{u.email}</p>
                </div>
                {u.role === "owner" || u.id === state.user.id ? (
                  <span className="rounded-full bg-teak-100 px-2.5 py-0.5 text-xs font-semibold text-teak-800">
                    {dict.roles[u.role]}
                  </span>
                ) : (
                  <select
                    className={cn(inputClass, "w-auto py-1.5 text-xs")}
                    value={u.role}
                    onChange={(e) =>
                      changeUserRole(u.id, e.target.value as UserRole)
                    }
                  >
                    {assignableRoles.map((r) => (
                      <option key={r} value={r}>
                        {dict.roles[r]}
                      </option>
                    ))}
                  </select>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-teak-900">
          {dict.familyMembers}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {state.members.map((m) => {
            const docs = state.documents.filter((d) => d.memberId === m.id).length;
            const linked = state.familyUsers.find((u) => u.memberId === m.id);
            return (
              <article
                key={m.id}
                className="group relative overflow-hidden rounded-2xl border border-teak-200/70 bg-white/80 p-5"
              >
                <div
                  className="absolute left-0 top-0 h-full w-1"
                  style={{ backgroundColor: m.avatarColor }}
                />
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold text-white"
                      style={{ backgroundColor: m.avatarColor }}
                    >
                      {m.name.charAt(0)}
                    </span>
                    <div>
                      <h3 className="font-display text-lg font-semibold text-teak-950">
                        {m.name}
                      </h3>
                      <p className="text-sm text-ink-400">{m.relation}</p>
                      {linked ? (
                        <span className="mt-1 inline-block rounded-md bg-teak-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teak-700">
                          {dict.roles[linked.role]}
                        </span>
                      ) : (
                        <span className="mt-1 inline-block text-[10px] uppercase tracking-wide text-ink-400">
                          {dict.profileOnly}
                        </span>
                      )}
                    </div>
                  </div>
                  {canDo("manage_members") && m.id !== state.user.memberId && (
                    <button
                      type="button"
                      className="rounded-lg p-2 text-ink-300 opacity-0 transition hover:bg-saffron-50 hover:text-saffron-700 group-hover:opacity-100"
                      onClick={() => {
                        if (confirm(`Remove ${m.name}?`)) removeMember(m.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  {m.bloodGroup && (
                    <div>
                      <dt className="text-xs text-ink-400">{dict.bloodGroup}</dt>
                      <dd className="font-medium">{m.bloodGroup}</dd>
                    </div>
                  )}
                  {m.dateOfBirth && (
                    <div>
                      <dt className="text-xs text-ink-400">{dict.date}</dt>
                      <dd className="font-medium">
                        {formatDate(m.dateOfBirth, state.locale)}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-xs text-ink-400">{dict.documents}</dt>
                    <dd className="font-medium">
                      {docs} {docs === 1 ? "record" : "records"}
                    </dd>
                  </div>
                </dl>
                <Link
                  href={`/app/documents?memberId=${encodeURIComponent(m.id)}`}
                  className="mt-4 inline-flex text-sm font-medium text-teak-700 hover:underline"
                >
                  View medical records
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      <Modal open={open} onClose={() => setOpen(false)} title={dict.addMember}>
        <div className="space-y-3">
          <Field label="Name">
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Any name — not limited to one family"
            />
          </Field>
          <Field label={dict.relation}>
            <input
              className={inputClass}
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              placeholder="Spouse, Parent, Child…"
            />
          </Field>
          {profileError && (
            <p className="rounded-lg bg-saffron-50 px-3 py-2 text-sm text-saffron-800">
              {profileError}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className={btnSecondary} onClick={() => setOpen(false)}>
              {dict.cancel}
            </button>
            <button
              type="button"
              className={btnPrimary}
              onClick={() => void saveMember()}
              disabled={savingMember}
            >
              {savingMember ? "Creating profile…" : dict.save}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title={dict.inviteUser}>
        <div className="space-y-3">
          <Field label={dict.fullName}>
            <input
              className={inputClass}
              value={invName}
              onChange={(e) => setInvName(e.target.value)}
            />
          </Field>
          <Field label={dict.relation}>
            <input
              className={inputClass}
              value={invRelation}
              onChange={(e) => setInvRelation(e.target.value)}
            />
          </Field>
          <Field label={dict.email}>
            <input
              type="email"
              className={inputClass}
              value={invEmail}
              onChange={(e) => setInvEmail(e.target.value)}
            />
          </Field>
          <Field label={dict.password}>
            <input
              type="password"
              className={inputClass}
              value={invPassword}
              onChange={(e) => setInvPassword(e.target.value)}
              minLength={6}
            />
          </Field>
          <Field label={dict.role}>
            <select
              className={inputClass}
              value={invRole}
              onChange={(e) => setInvRole(e.target.value as UserRole)}
            >
              {assignableRoles.map((r) => (
                <option key={r} value={r}>
                  {dict.roles[r]} — {dict.roleHints[r]}
                </option>
              ))}
            </select>
          </Field>
          {error && (
            <p className="rounded-lg bg-saffron-50 px-3 py-2 text-sm text-saffron-800">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className={btnSecondary}
              onClick={() => setInviteOpen(false)}
            >
              {dict.cancel}
            </button>
            <button type="button" className={btnPrimary} onClick={() => void saveInvite()}>
              {dict.save}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={renameOpen} onClose={() => setRenameOpen(false)} title={dict.renameFamily}>
        <div className="space-y-3">
          <Field label={dict.familyName}>
            <input
              className={inputClass}
              value={familyLabel}
              onChange={(e) => setFamilyLabel(e.target.value)}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className={btnSecondary}
              onClick={() => setRenameOpen(false)}
            >
              {dict.cancel}
            </button>
            <button type="button" className={btnPrimary} onClick={saveRename}>
              {dict.save}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
