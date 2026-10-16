"use client";

import { useActionState } from "react";
import { KeyRound, LogIn, UserPlus } from "lucide-react";
import {
  addLeaderAction,
  changeOwnPasswordAction,
  firstRunSetupAction,
  leaderLoginAction,
  resetLeaderPasswordAction,
  type FormState,
} from "@/app/actions/leader";
import { inputClass, Label } from "../ui";
import { FormMessage, SubmitButton } from "./form-bits";

export function LeaderLoginForm({ next }: { next: string }) {
  const [state, action] = useActionState<FormState, FormData>(leaderLoginAction, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <FormMessage state={state} />
      <div>
        <Label htmlFor="username">Username</Label>
        <input id="username" name="username" autoComplete="username" autoCapitalize="none" required className={inputClass} />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={inputClass} />
      </div>
      <SubmitButton size="lg" className="w-full">
        <LogIn className="size-5" /> Log in
      </SubmitButton>
    </form>
  );
}

export function FirstRunForm() {
  const [state, action] = useActionState<FormState, FormData>(firstRunSetupAction, {});
  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />
      <div>
        <Label htmlFor="name" hint="How scouts know you, e.g. Akela or Sam.">
          Your name
        </Label>
        <input id="name" name="name" required className={inputClass} />
      </div>
      <div>
        <Label htmlFor="username">Username</Label>
        <input id="username" name="username" autoComplete="username" autoCapitalize="none" required className={inputClass} placeholder="e.g. akela" />
      </div>
      <div>
        <Label htmlFor="password" hint="At least 8 characters.">
          Password
        </Label>
        <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} className={inputClass} />
      </div>
      <SubmitButton size="lg" className="w-full">
        <UserPlus className="size-5" /> Create my account
      </SubmitButton>
    </form>
  );
}

export function AddLeaderForm() {
  const [state, action] = useActionState<FormState, FormData>(addLeaderAction, {});
  return (
    <form action={action} className="space-y-4" key={state.ok}>
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="new-name">Name</Label>
          <input id="new-name" name="name" required className={inputClass} placeholder="Baloo" />
        </div>
        <div>
          <Label htmlFor="new-username">Username</Label>
          <input id="new-username" name="username" required autoCapitalize="none" autoComplete="off" className={inputClass} placeholder="baloo" />
        </div>
        <div>
          <Label htmlFor="new-password">Password</Label>
          <input id="new-password" name="password" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
        </div>
      </div>
      <SubmitButton>
        <UserPlus className="size-4" /> Add leader
      </SubmitButton>
    </form>
  );
}

export function ResetPasswordForm({ id, name }: { id: string; name: string }) {
  const [state, action] = useActionState<FormState, FormData>(resetLeaderPasswordAction, {});
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="id" value={id} />
      <div className="flex gap-2">
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          aria-label={`New password for ${name}`}
          placeholder="New password"
          className={inputClass}
        />
        <SubmitButton variant="secondary">
          <KeyRound className="size-4" /> Set
        </SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, action] = useActionState<FormState, FormData>(changeOwnPasswordAction, {});
  return (
    <form action={action} className="space-y-4" key={state.ok}>
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="current">Current password</Label>
          <input id="current" name="current" type="password" required autoComplete="current-password" className={inputClass} />
        </div>
        <div>
          <Label htmlFor="password">New password</Label>
          <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
        </div>
      </div>
      <SubmitButton variant="secondary">
        <KeyRound className="size-4" /> Change my password
      </SubmitButton>
    </form>
  );
}
