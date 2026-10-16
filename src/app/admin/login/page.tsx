import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { FirstRunForm, LeaderLoginForm } from "@/components/admin/auth-forms";
import { Logo } from "@/components/logo";
import { Callout, Card, Skeleton } from "@/components/ui";
import { getLeader } from "@/lib/auth";
import { leaderSetupState } from "@/lib/leaders";

export const metadata: Metadata = { title: "Leader login" };

export default function LeaderLoginPage({ searchParams }: PageProps<"/admin/login">) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[radial-gradient(50rem_30rem_at_50%_-10%,#ead9fc,transparent)] px-4 py-10">
      <div className="mb-8">
        <Logo subtitle="Leaders' area" />
      </div>
      <Card className="w-full max-w-md p-6 shadow-lift sm:p-8">
        <Suspense fallback={<Skeleton className="h-72" />}>
          <LoginContent searchParams={searchParams} />
        </Suspense>
      </Card>
      <Link href="/" className="mt-6 text-sm font-bold text-muted hover:text-brand-600">
        ← Back to the scout login
      </Link>
    </div>
  );
}

async function LoginContent({ searchParams }: { searchParams: PageProps<"/admin/login">["searchParams"] }) {
  const [leader, state, params] = await Promise.all([getLeader(), leaderSetupState(), searchParams]);
  const next = typeof params.next === "string" ? params.next : "/admin";
  if (leader) redirect(next.startsWith("/admin") ? next : "/admin");

  if (state === "first-run") {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-extrabold">Welcome! Set up your leader account</h1>
          <p className="mt-1 text-muted">
            There are no leader accounts yet. Create yours now, then you can add other leaders from the Leaders page.
          </p>
        </div>
        <FirstRunForm />
      </div>
    );
  }

  if (state === "needs-env") {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-extrabold">Leader accounts aren&apos;t set up yet</h1>
        <Callout tone="info">
          In your Vercel project settings, add the environment variables <code className="prose-code">ADMIN_USERNAME</code> and{" "}
          <code className="prose-code">ADMIN_PASSWORD</code> (and optionally <code className="prose-code">ADMIN_NAME</code>), then
          redeploy. That creates the first leader account. You can add more leaders once you&apos;re logged in.
        </Callout>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">Leader login</h1>
        <p className="mt-1 text-muted">Review submissions, sign off badges and see how everyone is doing.</p>
      </div>
      <LeaderLoginForm next={next} />
    </div>
  );
}
