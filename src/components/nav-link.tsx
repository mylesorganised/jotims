"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { cn } from "./ui";

type Props = {
  href: string;
  match?: string;
  exact?: boolean;
  children: ReactNode;
  badge?: ReactNode;
};

const base = "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold transition-colors";
const idle = "text-muted hover:bg-zinc-100 hover:text-ink";

/**
 * Header link that highlights itself on its own route (and any `match` prefix).
 * The pathname is request data, so the highlight streams in behind Suspense.
 */
export function NavLink(props: Props) {
  return (
    <Suspense
      fallback={
        <Link href={props.href} className={cn(base, idle)}>
          {props.children}
          {props.badge}
        </Link>
      }
    >
      <ActiveNavLink {...props} />
    </Suspense>
  );
}

function ActiveNavLink({ href, match, exact = false, children, badge }: Props) {
  const pathname = usePathname();
  const active = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`) || (match ? pathname.startsWith(match) : false);
  return (
    <Link href={href} className={cn(base, active ? "bg-brand-50 text-brand-700" : idle)}>
      {children}
      {badge}
    </Link>
  );
}
