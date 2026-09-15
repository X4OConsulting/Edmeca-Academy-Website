import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import type { RespondentMode } from "@/data/aiMap";

export type UnlockFormValues = { name: string; email: string; organisation: string; wantsCall: boolean; website: string };
export type UnlockState = "idle" | "submitting" | "done" | "error";

type Props = { mode: RespondentMode; state: UnlockState; error?: string; onSubmit: (values: UnlockFormValues) => void };

const emailPattern = /^\S+@\S+\.\S+$/;

export function UnlockForm({ mode, state, error, onSubmit }: Props) {
  const [values, setValues] = useState<UnlockFormValues>({ name: "", email: "", organisation: "", wantsCall: false, website: "" });
  const [localError, setLocalError] = useState("");
  const field = "rounded-lg border border-edmeca-green-soft bg-white px-3 py-3 text-sm text-edmeca-grey focus:border-edmeca-purple focus:outline-none";

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (state === "submitting") return;
    if (!values.name.trim() || !emailPattern.test(values.email)) { setLocalError("Enter your name and a valid email address."); return; }
    setLocalError("");
    onSubmit({ ...values, name: values.name.trim(), email: values.email.trim(), organisation: values.organisation.trim() });
  };

  if (state === "done") {
    return <p className="mt-3 text-sm leading-relaxed text-edmeca-grey">Your AI Enablement Report is on its way to <strong className="text-edmeca-purple">{values.email}</strong>. The email carries your re-test link. If nothing arrives in a few minutes, check your spam folder.</p>;
  }

  return (
    <form onSubmit={submit} className="mt-4 grid gap-3" noValidate>
      <label className="sr-only" htmlFor="ai-map-name">Name</label>
      <input id="ai-map-name" required autoComplete="name" placeholder="Name" value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} className={field} />
      <label className="sr-only" htmlFor="ai-map-email">Email</label>
      <input id="ai-map-email" required type="email" autoComplete="email" placeholder="Email" value={values.email} onChange={(event) => setValues({ ...values, email: event.target.value })} className={field} />
      <label className="sr-only" htmlFor="ai-map-organisation">{mode === "business" ? "Business name" : "Organisation (optional)"}</label>
      <input id="ai-map-organisation" autoComplete="organization" placeholder={mode === "business" ? "Business name" : "Organisation (optional)"} value={values.organisation} onChange={(event) => setValues({ ...values, organisation: event.target.value })} className={field} />
      {/* Honeypot: hidden from people, filled by bots. The function stores nothing when it has a value. */}
      <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="ai-map-website">Website</label>
        <input id="ai-map-website" tabIndex={-1} autoComplete="off" value={values.website} onChange={(event) => setValues({ ...values, website: event.target.value })} />
      </div>
      <label className="flex items-center gap-2 text-sm text-edmeca-grey"><input type="checkbox" checked={values.wantsCall} onChange={(event) => setValues({ ...values, wantsCall: event.target.checked })} className="accent-edmeca-purple" /> I would like a conversation with Edmeca</label>
      {(localError || (state === "error" && error)) && <p className="text-sm text-red-600" role="alert">{localError || error}</p>}
      <Button disabled={state === "submitting"} className="bg-edmeca-purple text-white hover:bg-edmeca-purple/90 disabled:opacity-70">{state === "submitting" ? "Writing your report…" : "Send my report"}</Button>
      <p className="text-xs leading-relaxed text-edmeca-grey">We use your details to send your report and, if you tick the box, to arrange a call. We do not share them.</p>
    </form>
  );
}
