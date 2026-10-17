"use client";

import { useActionState, type ReactNode } from "react";
import { Save, Upload, UserPlus } from "lucide-react";
import {
  addScoutAction,
  importScoutsAction,
  saveSettingsAction,
  updateScoutAction,
  type FormState,
} from "@/app/actions/leader";
import { SECTIONS } from "@/content";
import type { Section } from "@/lib/db/schema";
import type { Settings } from "@/lib/settings";
import { inputClass, Label } from "../ui";
import { FormMessage, SubmitButton } from "./form-bits";

function SectionSelect({ id, defaultValue }: { id: string; defaultValue?: Section }) {
  return (
    <select id={id} name="section" required defaultValue={defaultValue ?? ""} className={inputClass}>
      <option value="" disabled>
        Choose…
      </option>
      {SECTIONS.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </select>
  );
}

export function AddScoutForm() {
  const [state, action] = useActionState<FormState, FormData>(addScoutAction, {});
  return (
    <form action={action} className="space-y-4" key={state.ok}>
      <FormMessage state={state} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label htmlFor="add-first">First name</Label>
          <input id="add-first" name="first" required className={inputClass} />
        </div>
        <div>
          <Label htmlFor="add-last">Last name</Label>
          <input id="add-last" name="last" required className={inputClass} />
        </div>
        <div>
          <Label htmlFor="add-dob">Date of birth</Label>
          <input id="add-dob" name="dob" required placeholder="DD/MM/YYYY" className={inputClass} />
        </div>
        <div>
          <Label htmlFor="add-section">Section</Label>
          <SectionSelect id="add-section" />
        </div>
      </div>
      <SubmitButton>
        <UserPlus className="size-4" /> Add
      </SubmitButton>
    </form>
  );
}

export function ImportScoutsForm() {
  const [state, action] = useActionState<FormState, FormData>(importScoutsAction, {});
  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />
      <div>
        <Label
          htmlFor="rows"
          hint="One person per line: First name, Last name, Date of birth, Section. You can paste straight from a spreadsheet or an OSM export."
        >
          Paste your list
        </Label>
        <textarea
          id="rows"
          name="rows"
          rows={6}
          required
          placeholder={"Sam, Smith, 05/09/2016, Cubs\nAva, Jones, 12/01/2018, Beavers"}
          className={`${inputClass} font-mono text-sm`}
        />
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-56">
          <Label htmlFor="import-section" hint="Used when a line has no section">
            Default section
          </Label>
          <select id="import-section" name="section" defaultValue="" className={inputClass}>
            <option value="">None</option>
            {SECTIONS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <SubmitButton>
          <Upload className="size-4" /> Import
        </SubmitButton>
      </div>
    </form>
  );
}

export function EditScoutForm({
  scout,
}: {
  scout: { id: string; firstName: string; lastName: string; dob: string; section: Section; notes: string | null };
}) {
  const [state, action] = useActionState<FormState, FormData>(updateScoutAction, {});
  const [y, m, d] = scout.dob.split("-");
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={scout.id} />
      <FormMessage state={state} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="edit-first">First name</Label>
          <input id="edit-first" name="first" defaultValue={scout.firstName} required className={inputClass} />
        </div>
        <div>
          <Label htmlFor="edit-last">Last name</Label>
          <input id="edit-last" name="last" defaultValue={scout.lastName} required className={inputClass} />
        </div>
        <div>
          <Label htmlFor="edit-dob" hint="They log in with this">
            Date of birth
          </Label>
          <input id="edit-dob" name="dob" defaultValue={`${d}/${m}/${y}`} required className={inputClass} />
        </div>
        <div>
          <Label htmlFor="edit-section">Section</Label>
          <SectionSelect id="edit-section" defaultValue={scout.section} />
        </div>
      </div>
      <div>
        <Label htmlFor="edit-notes" hint="Only leaders can see this">
          Notes
        </Label>
        <textarea id="edit-notes" name="notes" rows={2} defaultValue={scout.notes ?? ""} className={inputClass} />
      </div>
      <SubmitButton>
        <Save className="size-4" /> Save changes
      </SubmitButton>
    </form>
  );
}

function Toggle({ name, checked, disabled, title, children }: { name: string; checked: boolean; disabled?: boolean; title: string; children: ReactNode }) {
  return (
    <label className={`flex items-start gap-3 rounded-xl bg-canvas p-3.5 ring-1 ring-line ${disabled ? "opacity-60" : ""}`}>
      <input type="checkbox" name={name} defaultChecked={checked} disabled={disabled} className="mt-1 size-4 accent-brand-500" />
      <span>
        <span className="block font-bold">{title}</span>
        <span className="block text-sm text-muted">{children}</span>
      </span>
    </label>
  );
}

export function SettingsForm({ settings, ai }: { settings: Settings; ai: { reviewer: boolean; writer: boolean } }) {
  const [state, action] = useActionState<FormState, FormData>(saveSettingsAction, {});
  return (
    <form action={action} className="space-y-5">
      <FormMessage state={state} />
      <div>
        <Label htmlFor="eventName" hint="Shown on the scout login page">
          Event name
        </Label>
        <input id="eventName" name="eventName" defaultValue={settings.eventName} className={inputClass} />
      </div>
      <label className="flex items-start gap-3 rounded-xl bg-canvas p-3.5 ring-1 ring-line" data-tour="settings-signup">
        <input type="checkbox" name="allowSignup" defaultChecked={settings.allowSignup} className="mt-1 size-4 accent-brand-500" />
        <span>
          <span className="block font-bold">Let new young people add themselves</span>
          <span className="block text-sm text-muted">
            If someone isn&apos;t on your list, they can pick their section and join. Turn this off once everyone is added, so only
            people on your list can log in.
          </span>
        </span>
      </label>
      <div>
        <Label
          htmlFor="groupCode"
          hint="Optional. If set, young people also need this code to log in, e.g. one written on the wall at the event. Leave empty for no code."
        >
          Group code
        </Label>
        <input id="groupCode" name="groupCode" defaultValue={settings.groupCode} autoComplete="off" className={inputClass} placeholder="e.g. RADIO26" />
      </div>
      <div>
        <Label htmlFor="groupJid" hint="Optional. Your group's JOTA-JOTI Jamboree ID, from your JOTA-JOTI registration. Shown in the JOTI chat guide so young people can share it in the JID Exchange room.">
          Group JID
        </Label>
        <input id="groupJid" name="groupJid" defaultValue={settings.groupJid} autoComplete="off" className={inputClass} placeholder="e.g. 6GB12X" />
      </div>
      <div className="space-y-3 border-t border-line pt-5" data-tour="settings-ai">
        {ai.reviewer && <input type="hidden" name="aiShown" value="1" />}
        <div>
          <h3 className="text-lg font-extrabold">🤖 AI leader</h3>
          <p className="text-sm text-muted">
            {ai.reviewer
              ? "Checks work as it comes in, so young people hear back in seconds. Everything it decides is logged, and you can always reopen a task or remove a sign-off."
              : "Add JEV_API_KEY (TypeSafe) to switch the AI leader on."}
            {ai.reviewer && !ai.writer && " Add OPENROUTER_API_KEY too for personal feedback and for reading screenshots."}
          </p>
        </div>
        <Toggle name="aiReview" checked={settings.aiReview} disabled={!ai.reviewer} title="Review work sent to a leader">
          Approves work that clearly meets the requirement, sends back work that clearly isn&apos;t finished (with kind, specific
          feedback), and leaves anything unclear, worrying or containing personal details for you.
        </Toggle>
        <Toggle name="aiSignOff" checked={settings.aiSignOff} disabled={!ai.reviewer} title="Sign badges off when every task is done">
          Checks the self-check tasks were done properly, then signs the badge off. If one clearly wasn&apos;t done, it reopens it
          with feedback.
        </Toggle>
        <Toggle
          name="aiApproveInPerson"
          checked={settings.aiApproveInPerson}
          disabled={!ai.reviewer}
          title="Also approve tasks a leader would normally see or receive"
        >
          Off: for tasks like phone calls, talking to a leader or sending a leader a message, the AI only checks the written part and
          leaves the final tick for a leader. On: it approves those from the written answers alone.
        </Toggle>
      </div>
      <SubmitButton>
        <Save className="size-4" /> Save settings
      </SubmitButton>
    </form>
  );
}
