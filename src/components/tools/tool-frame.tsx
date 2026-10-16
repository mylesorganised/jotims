"use client";

import { useState, type ReactNode } from "react";
import { cn } from "../ui";

/** Card wrapper with optional tabs, shared by every tool. */
export function ToolFrame({
  title,
  icon,
  tabs,
  children,
}: {
  title: string;
  icon: ReactNode;
  tabs?: { id: string; label: string; content: ReactNode }[];
  children?: ReactNode;
}) {
  const [tab, setTab] = useState(tabs?.[0]?.id);
  return (
    <div className="overflow-hidden rounded-2xl bg-gradient-to-b from-brand-50/70 to-white ring-1 ring-brand-100">
      <div className="flex flex-wrap items-center gap-2 border-b border-brand-100 px-4 py-2.5">
        <span className="text-brand-600">{icon}</span>
        <span className="text-sm font-extrabold text-brand-800">{title}</span>
        {tabs && (
          <div className="ml-auto flex gap-1 rounded-lg bg-white/80 p-0.5 ring-1 ring-brand-100" role="tablist">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-bold transition",
                  tab === t.id ? "bg-brand-500 text-white" : "text-muted hover:text-brand-700",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="p-4">{tabs ? tabs.find((t) => t.id === tab)?.content : children}</div>
    </div>
  );
}
