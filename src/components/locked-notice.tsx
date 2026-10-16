import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { badgeName, type BadgeDef } from "@/content";
import { buttonClass } from "./ui";

/** Shown on a stage that can't be started until the one before it is finished. */
export function LockedNotice({ before }: { before: BadgeDef }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-zinc-900 p-5 text-white sm:flex-row sm:items-center sm:p-6">
      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-white/10">
        <Lock className="size-6" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-lg font-extrabold">This stage is locked</p>
        <p className="text-white/75">
          Finish {badgeName(before)} first and this stage opens up. Already done it at another time? Ask a leader to tick it
          off for you.
        </p>
      </div>
      <Link href={`/badges/${before.id}`} className={buttonClass("secondary", "md", "shrink-0")}>
        Go to {badgeName(before)} <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}
