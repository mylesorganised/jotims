import Link from "next/link";
import { RadioTower } from "lucide-react";

export function Logo({ href = "/", subtitle = "JOTA-JOTI badges" }: { href?: string; subtitle?: string }) {
  return (
    <Link href={href} className="group flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-xl bg-brand-500 text-white shadow-sm shadow-brand-500/30 transition-transform group-hover:-rotate-6">
        <RadioTower className="size-5" strokeWidth={2.4} />
      </span>
      <span className="leading-tight">
        <span className="block text-[15px] font-extrabold tracking-tight">PG Scouts</span>
        <span className="block text-xs font-semibold text-muted">{subtitle}</span>
      </span>
    </Link>
  );
}
