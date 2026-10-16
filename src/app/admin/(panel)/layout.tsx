import { Suspense } from "react";
import { LogOut } from "lucide-react";
import { leaderLogoutAction } from "@/app/actions/leader";
import { Logo } from "@/components/logo";
import { NavLink } from "@/components/nav-link";
import { getLeader } from "@/lib/auth";
import { getReviewQueue } from "@/lib/data";

// Signed-in pages read the session on every navigation, so they're allowed to
// block rather than be prefetched as instant static shells.
export const instant = false;

const NAV = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/review", label: "Review", count: true },
  { href: "/admin/scouts", label: "Young people" },
  { href: "/admin/badges", label: "Badge tracker" },
  { href: "/admin/leaders", label: "Leaders" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-line/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6">
          <Logo href="/admin" subtitle="Leaders' area" />
          <div className="ml-auto">
            <Suspense fallback={<div className="h-9 w-32" />}>
              <LeaderChip />
            </Suspense>
          </div>
        </div>
        <nav className="mx-auto flex w-full max-w-7xl gap-1 overflow-x-auto px-3 pb-2 sm:px-5">
          {NAV.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              exact={item.exact}
              badge={
                item.count ? (
                  <Suspense fallback={null}>
                    <QueueCount />
                  </Suspense>
                ) : undefined
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}

async function LeaderChip() {
  const leader = await getLeader();
  if (!leader) return null;
  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-right leading-tight sm:block">
        <span className="block text-sm font-bold">{leader.name}</span>
        <span className="block text-xs text-muted">@{leader.username}</span>
      </span>
      <span className="grid size-9 place-items-center rounded-full bg-teal-brand text-sm font-extrabold text-white">
        {leader.name.slice(0, 1).toUpperCase()}
      </span>
      <form action={leaderLogoutAction}>
        <button
          type="submit"
          className="grid size-9 place-items-center rounded-full text-muted hover:bg-brand-50 hover:text-brand-700"
          title="Log out"
          aria-label="Log out"
        >
          <LogOut className="size-4" />
        </button>
      </form>
    </div>
  );
}

async function QueueCount() {
  const leader = await getLeader();
  if (!leader) return null;
  const n = (await getReviewQueue()).length;
  if (!n) return null;
  return <span className="grid min-w-5 place-items-center rounded-full bg-rose-500 px-1.5 text-[11px] font-black text-white">{n}</span>;
}
