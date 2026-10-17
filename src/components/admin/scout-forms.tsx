"use client";

import { useActionState } from "react";
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

export function SettingsForm({ settings }: { settings: Settings }) {
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
      <SubmitButton>
        <Save className="size-4" /> Save settings
      </SubmitButton>
    </form>
  );
}
