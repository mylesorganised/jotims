import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Globe, Lightbulb, RadioTower, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { Logo } from "@/components/logo";
import { Card, Skeleton } from "@/components/ui";
import { getCurrentScout } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export default function WelcomePage() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(60rem_30rem_at_20%_-10%,#d4b3f8_0%,transparent_60%),radial-gradient(40rem_24rem_at_100%_0%,#b8ecec_0%,transparent_55%)]"
      />
      <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <nav className="flex items-center gap-4">
          <Link href="/chat" className="text-sm font-bold text-muted hover:text-brand-600">
            JOTI chat
          </Link>
          <Link href="/toolbox" className="text-sm font-bold text-muted hover:text-brand-600">
            Code toolbox
          </Link>
        </nav>
      </header>

      <main className="relative mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-5 pb-16 pt-4 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <section>
          <Suspense fallback={<p className="mb-3 h-5" />}>
            <EventName />
          </Suspense>
          <h1 className="text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Talk to the world.
            <br />
            <span className="bg-gradient-to-r from-brand-500 to-teal-brand bg-clip-text text-transparent">
              Earn your badges.
            </span>
          </h1>
          <p className="mt-5 max-w-lg text-lg text-muted">
            Every badge task is broken into small steps with help along the way. Tick things off as you go, and a
            leader will check your work.
          </p>
          <ul className="mt-8 grid max-w-lg gap-3 sm:grid-cols-3">
            {[
              { icon: RadioTower, label: "Communicator", color: "#0a4ea2" },
              { icon: ShieldCheck, label: "Digital Citizen", color: "#1a6fc4" },
              { icon: Lightbulb, label: "Digital Maker", color: "#4b2c94" },
            ].map(({ icon: Icon, label, color }) => (
              <li key={label} className="flex items-center gap-2.5 rounded-2xl bg-white/70 p-3 ring-1 ring-line backdrop-blur">
                <span className="grid size-9 place-items-center rounded-xl text-white" style={{ background: color }}>
                  <Icon className="size-5" />
                </span>
                <span className="text-sm font-bold leading-tight">{label}</span>
              </li>
            ))}
          </ul>
        </section>

        <Card className="p-6 shadow-lift sm:p-8">
          <Suspense fallback={<LoginSkeleton />}>
            <Login />
          </Suspense>
        </Card>
      </main>

      <footer className="relative mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-5 pb-6 text-sm text-muted">
        <span className="flex items-center gap-1.5">
          <Globe className="size-4" /> Jamboree On The Air · Jamboree On The Internet
        </span>
        <Link href="/admin/login" className="font-bold hover:text-brand-600">
          Leaders: log in →
        </Link>
      </footer>
    </div>
  );
}

async function EventName() {
  const settings = await getSettings();
  return <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.18em] text-brand-600">{settings.eventName}</p>;
}

async function Login() {
  const [scout, settings] = await Promise.all([getCurrentScout(), getSettings()]);
  if (scout) redirect("/home");
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => thisYear - 4 - i);
  return <LoginForm needsCode={Boolean(settings.groupCode)} years={years} />;
}

function LoginSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-11" />
      <Skeleton className="h-11" />
      <Skeleton className="h-11" />
      <Skeleton className="h-12" />
    </div>
  );
}
