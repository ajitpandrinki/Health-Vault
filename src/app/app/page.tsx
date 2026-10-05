"use client";

import { useState } from "react";
import Link from "next/link";
import { FolderHeart, Plus, Users } from "lucide-react";
import { useVault } from "@/lib/vault-context";
import { UploadDocumentModal } from "@/components/UploadDocumentModal";
import { btnPrimary, btnSecondary } from "@/components/ui";

export default function DashboardPage() {
  const { dict, state, canDo } = useVault();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string>();

  if (!state) return null;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="text-center">
        <div>
          <p className="text-sm text-ink-400">{dict.welcome}, {state.user.fullName}</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-teak-950">
            Family Records
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            Keep each person&apos;s medical bills and insurance cards together.
          </p>
        </div>
      </header>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-teak-900">
              Family profiles
            </h2>
            <p className="mt-1 text-sm text-ink-400">
              Choose a person to view or add their records.
            </p>
          </div>
          {canDo("manage_members") && (
            <Link href="/app/family" className={btnSecondary}>
              <Users className="h-4 w-4" />
              Add family member
            </Link>
          )}
        </div>

        {state.members.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-teak-300 bg-white/70 px-5 py-12 text-center">
            <Users className="mx-auto h-8 w-8 text-teak-500" />
            <p className="mt-3 font-medium text-teak-900">Add your first family profile</p>
            <p className="mt-1 text-sm text-ink-500">
              Create a profile before saving bills or insurance cards.
            </p>
            {canDo("manage_members") && (
              <Link href="/app/family" className={`${btnPrimary} mt-4`}>
                <Plus className="h-4 w-4" />
                Add family member
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {state.members.map((member) => {
              const records = state.documents.filter((doc) => doc.memberId === member.id);
              return (
                <article
                  key={member.id}
                  className="rounded-2xl border border-teak-200/70 bg-white/85 p-5"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-white"
                      style={{ backgroundColor: member.avatarColor }}
                    >
                      {member.name.charAt(0)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-display text-lg font-semibold text-teak-950">
                        {member.name}
                      </h3>
                      <p className="text-sm text-ink-400">{member.relation}</p>
                    </div>
                    <FolderHeart className="h-5 w-5 text-teak-500" />
                  </div>
                  <p className="mt-4 text-sm text-ink-500">
                    {records.length} saved {records.length === 1 ? "record" : "records"}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-teak-100 pt-4">
                    <Link
                      href={`/app/documents?memberId=${encodeURIComponent(member.id)}`}
                      className={`${btnSecondary} flex-1`}
                    >
                      View records
                    </Link>
                    {canDo("upload") && (
                      <button
                        type="button"
                        className={`${btnPrimary} flex-1`}
                        onClick={() => {
                          setSelectedMemberId(member.id);
                          setUploadOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                        Add bill or card
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <UploadDocumentModal
        open={uploadOpen}
        onClose={() => {
          setUploadOpen(false);
          setSelectedMemberId(undefined);
        }}
        initialMemberId={uploadOpen ? selectedMemberId : undefined}
      />
    </div>
  );
}
