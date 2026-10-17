"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { SECTIONS } from "@/content";
import type { Section } from "@/lib/db/schema";
import { cn, inputClass, ProgressBar } from "../ui";

export type ScoutTableRow = {
  id: string;
  name: string;
  section: Section;
  age: number;
  dob: string;
  tasksDone: number;
  waiting: number;
  awarded: number;
  ready: number;
  badgeCount: number;
  percent: number;
  lastSeen: string;
};

export function ScoutTable({ rows }: { rows: ScoutTableRow[] }) {
  const [q, setQ] = useState("");
  const [section, setSection] = useState<Section | "all">("all");
  const filtered = useMemo(
    () =>
      rows.filter(
        (r) => (section === "all" || r.section === section) && r.name.toLowerCase().includes(q.trim().toLowerCase()),
      ),
    [rows, q, section],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3" data-tour="scouts-search">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name" className={cn(inputClass, "pl-9")} />
        </div>
        <div className="flex gap-1 rounded-xl bg-white p-1 ring-1 ring-line">
          {[{ id: "all" as const, name: "All" }, ...SECTIONS].map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSection(s.id)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-bold",
                section === s.id ? "bg-brand-500 text-white" : "text-muted hover:text-ink",
              )}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-line shadow-card" data-tour="scouts-table">
        <table className="w-full min-w-[44rem] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs font-black uppercase tracking-wider text-muted">
              <th className="px-4 py-3">Name</th>
              <th className="px-3 py-3">Section</th>
              <th className="px-3 py-3">Age</th>
              <th className="px-3 py-3">Tasks done</th>
              <th className="px-3 py-3">Badges</th>
              <th className="w-40 px-3 py-3">Progress</th>
              <th className="px-4 py-3 text-right">Last seen</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const s = SECTIONS.find((x) => x.id === r.section)!;
              return (
                <tr key={r.id} className="border-b border-line/70 last:border-0 hover:bg-brand-50/40">
                  <td className="px-4 py-3">
                    <Link href={`/admin/scouts/${r.id}`} className="font-bold text-ink hover:text-brand-600 hover:underline">
                      {r.name}
                    </Link>
                    {r.waiting > 0 && (
                      <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                        {r.waiting} to review
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <span className="font-bold" style={{ color: s.color }}>
                      {s.name}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-muted" title={r.dob}>
                    {r.age}
                  </td>
                  <td className="px-3 py-3 font-semibold">{r.tasksDone}</td>
                  <td className="px-3 py-3">
                    <span className="font-bold text-emerald-700">{r.awarded}</span>
                    <span className="text-muted"> / {r.badgeCount}</span>
                    {r.ready > 0 && <span className="ml-1.5 text-xs font-bold text-sky-700">+{r.ready} ready</span>}
                  </td>
                  <td className="px-3 py-3">
                    <ProgressBar value={r.percent} />
                  </td>
                  <td className="px-4 py-3 text-right text-muted">{r.lastSeen}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted">
                  {rows.length === 0 ? "No young people yet. Add them below, or they can join from the login page." : "No one matches."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
