import Link from "next/link";
import { Suspense } from "react";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions/scout";
import { Logo } from "@/components/logo";
import { NavLink } from "@/components/nav-link";
import { ButtonLink } from "@/components/ui";
import { getCurrentScout } from "@/lib/auth";

// Signed-in pages read the session on every navigation, so they're allowed to
// block rather than be prefetched as instant static shells.
export const instant = false;

export default function ScoutLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-line/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center gap-3 px-4 sm:px-6">
          <Logo href="/home" />
          <nav className="ml-4 hidden items-center gap-1 sm:flex">
            <NavLink href="/home" match="/badges">
              My badges
            </NavLink>
            <NavLink href="/toolbox">Code toolbox</NavLink>
          </nav>
          <div className="ml-auto">
            <Suspense fallback={<div className="h-9 w-28" />}>
              <ScoutChip />
            </Suspense>
          </div>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 px-3 pb-2 sm:hidden">
          <NavLink href="/home" match="/badges">
            My badges
          </NavLink>
          <NavLink href="/toolbox">Code toolbox</NavLink>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}

async function ScoutChip() {
  const scout = await getCurrentScout();
  if (!scout) {
    return (
      <ButtonLink href="/" size="sm">
        Log in
      </ButtonLink>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-right leading-tight sm:block">
        <span className="block text-sm font-bold">
          {scout.firstName} {scout.lastName}
        </span>
        <Link href="/home" className="block text-xs capitalize text-muted">
          {scout.section}
        </Link>
      </span>
      <span className="grid size-9 place-items-center rounded-full bg-brand-100 text-sm font-extrabold text-brand-700">
        {scout.firstName[0]}
        {scout.lastName[0]}
      </span>
      <form action={logoutAction}>
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
