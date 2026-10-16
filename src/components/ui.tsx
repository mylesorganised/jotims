import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { CircleAlert, CircleCheck, Info, Lightbulb, TriangleAlert } from "lucide-react";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
  extend: { theme: { color: ["brand-50", "brand-100", "brand-200", "brand-300", "brand-400", "brand-500", "brand-600", "brand-700", "brand-800", "brand-900", "teal-brand", "ink", "muted", "line", "canvas"] } },
});

/** Joins class names; later classes win over earlier conflicting ones. */
export function cn(...classes: (string | false | null | undefined)[]) {
  return twMerge(classes.filter(Boolean).join(" "));
}

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 shadow-sm shadow-brand-500/20",
  secondary: "bg-white text-ink ring-1 ring-inset ring-line hover:bg-brand-50 hover:ring-brand-200",
  ghost: "text-muted hover:bg-brand-50 hover:text-brand-700",
  danger: "bg-white text-red-600 ring-1 ring-inset ring-red-200 hover:bg-red-50",
  success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5 rounded-lg",
  md: "h-10 px-4 text-[15px] gap-2 rounded-xl",
  lg: "h-12 px-6 text-base gap-2 rounded-xl",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra?: string) {
  return cn(
    "inline-flex items-center justify-center font-semibold transition-colors duration-150 select-none",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500",
    "disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap",
    variants[variant],
    sizes[size],
    extra,
  );
}

export function Button({
  variant,
  size,
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-2xl bg-white ring-1 ring-line shadow-card", className)} {...props} />;
}

export function Pill({
  tone = "neutral",
  className,
  children,
}: {
  tone?: "neutral" | "brand" | "amber" | "green" | "red" | "blue";
  className?: string;
  children: ReactNode;
}) {
  const tones = {
    neutral: "bg-zinc-100 text-zinc-600",
    brand: "bg-brand-100 text-brand-700",
    amber: "bg-amber-100 text-amber-800",
    green: "bg-emerald-100 text-emerald-800",
    red: "bg-rose-100 text-rose-700",
    blue: "bg-sky-100 text-sky-800",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ProgressBar({ value, color = "#7413dc", className }: { value: number; color?: string; className?: string }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-zinc-100", className)}>
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }}
      />
    </div>
  );
}

export function ProgressRing({
  value,
  size = 56,
  stroke = 6,
  color = "#7413dc",
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#efeaf6" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.max(0, Math.min(100, value)) / 100)}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-xs font-bold">{children}</div>
    </div>
  );
}

const calloutTones = {
  tip: { icon: Lightbulb, cls: "bg-amber-50 ring-amber-200 text-amber-900", iconCls: "text-amber-500" },
  warning: { icon: TriangleAlert, cls: "bg-rose-50 ring-rose-200 text-rose-900", iconCls: "text-rose-500" },
  info: { icon: Info, cls: "bg-sky-50 ring-sky-200 text-sky-900", iconCls: "text-sky-500" },
  success: { icon: CircleCheck, cls: "bg-emerald-50 ring-emerald-200 text-emerald-900", iconCls: "text-emerald-600" },
  error: { icon: CircleAlert, cls: "bg-rose-50 ring-rose-200 text-rose-900", iconCls: "text-rose-500" },
};

export function Callout({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: keyof typeof calloutTones;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const t = calloutTones[tone];
  const Icon = t.icon;
  return (
    <div className={cn("flex gap-3 rounded-xl p-3.5 ring-1 ring-inset", t.cls, className)}>
      <Icon className={cn("mt-0.5 size-5 shrink-0", t.iconCls)} aria-hidden />
      <div className="min-w-0 text-[15px] leading-relaxed">
        {title && <div className="font-bold">{title}</div>}
        {children}
      </div>
    </div>
  );
}

export function PageTitle({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-zinc-200/70", className)} />;
}

export const inputClass = cn(
  "block w-full rounded-xl bg-white px-3.5 py-2.5 text-[15px] text-ink ring-1 ring-inset ring-line",
  "placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-400",
  "disabled:bg-zinc-50 disabled:text-zinc-500",
);

export function Label({ children, hint, htmlFor }: { children: ReactNode; hint?: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block">
      <span className="text-[15px] font-bold text-ink">{children}</span>
      {hint && <span className="mt-0.5 block text-sm text-muted">{hint}</span>}
    </label>
  );
}
