"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";
import type { FormState } from "@/app/actions/leader";
import { buttonClass, Callout } from "../ui";

type Variant = Parameters<typeof buttonClass>[0];
type Size = Parameters<typeof buttonClass>[1];

export function SubmitButton({
  children,
  variant = "primary",
  size = "md",
  className,
  confirm,
  name,
  value,
  formAction,
}: {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
  /** ask "are you sure?" first */
  confirm?: string;
  name?: string;
  value?: string;
  /** use a different server action than the form's own */
  formAction?: (formData: FormData) => void | Promise<void>;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name={name}
      value={value}
      formAction={formAction}
      disabled={pending}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
      className={buttonClass(variant, size, className)}
    >
      {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  return (
    <>
      {state.ok && <Callout tone="success">{state.ok}</Callout>}
      {state.error && <Callout tone="error">{state.error}</Callout>}
    </>
  );
}

/** Re-fetches the page every so often so new submissions show up by themselves. */
export function AutoRefresh({ seconds = 20 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);
  return null;
}
