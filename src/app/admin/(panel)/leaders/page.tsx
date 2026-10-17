import type { Metadata } from "next";
import { Trash2 } from "lucide-react";
import { removeLeaderAction } from "@/app/actions/leader";
import { AddLeaderForm, ChangePasswordForm, ResetPasswordForm } from "@/components/admin/auth-forms";
import { SubmitButton } from "@/components/admin/form-bits";
import { Card, PageTitle } from "@/components/ui";
import { requireLeader } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import { listLeaders } from "@/lib/leaders";
import { requestTime } from "@/lib/data";

export const metadata: Metadata = { title: "Leaders" };
// Signed-in page: allowed to block on the session (see the panel layout).
export const instant = false;

export default async function LeadersPage() {
  const me = await requireLeader();
  const leaders = await listLeaders();
  const now = await requestTime();

  return (
    <div className="space-y-8">
      <PageTitle title="Leaders" subtitle="Everyone here can review work and sign off badges." />

      <Card className="divide-y divide-line">
        {leaders.map((l) => (
          <div key={l.id} className="flex flex-wrap items-center gap-4 p-4 sm:p-5">
            <span className="grid size-10 place-items-center rounded-full bg-teal-brand text-white font-extrabold">
              {l.displayName.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-40 flex-1">
              <p className="font-extrabold">
                {l.displayName} {l.id === me.id && <span className="text-xs font-bold text-brand-600">(you)</span>}
              </p>
              <p className="text-sm text-muted">
                @{l.username} · last login {timeAgo(l.lastLoginAt, now)}
              </p>
            </div>
            {l.id !== me.id && (
              <>
                <div className="w-full sm:w-72">
                  <ResetPasswordForm id={l.id} name={l.displayName} />
                </div>
                <form action={removeLeaderAction.bind(null, l.id)}>
                  <SubmitButton variant="danger" size="sm" confirm={`Remove ${l.displayName}? They won't be able to log in.`}>
                    <Trash2 className="size-4" /> Remove
                  </SubmitButton>
                </form>
              </>
            )}
          </div>
        ))}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-extrabold">Add a leader</h2>
          <AddLeaderForm />
        </Card>
        <Card className="p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-extrabold">Your password</h2>
          <ChangePasswordForm />
        </Card>
      </div>
    </div>
  );
}
