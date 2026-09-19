"use client";

/**
 * RequestAccessForm — the "ask to join" form shared by the public Shopify welcome page and the
 * in-app <TierGate>. A partner describes who they are (name, company, role, store, message); on
 * submit it emails us through the existing `/nextapi/contact` nodemailer route (role + store are
 * folded into the message so no backend change is needed). A successful request is remembered in
 * localStorage (per `storageKey`) so the form doesn't beg twice on the same device.
 *
 * Layout is mobile-first: fields stack on small screens and pair up from `sm`. Inputs are 44px tall
 * for comfortable touch targets.
 */

import { useEffect, useState } from "react";

const SpinnerIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
    <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
    </path>
  </svg>
);

const CheckIcon = (props) => (
  <svg {...props} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const inputCls =
  "h-11 w-full rounded-xl border border-border bg-popover px-3.5 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition focus:border-accent-brand/70 focus:ring-2 focus:ring-accent-brand/20";
const labelCls = "mb-1.5 block text-[13px] font-medium text-foreground";
const Req = () => <span className="text-accent-brand">*</span>;

export default function RequestAccessForm({
  featureName = "Shopify Integration",
  defaultName = "",
  defaultEmail = "",
  defaultStore = "",
  storageKey,
  onSent,
}) {
  const [form, setForm] = useState({
    name: defaultName,
    email: defaultEmail,
    company: "",
    role: "",
    store: defaultStore,
    message: "",
  });
  const [state, setState] = useState("idle"); // idle | sending | sent | error

  useEffect(() => {
    if (!storageKey) return;
    try {
      if (localStorage.getItem(storageKey)) setState("sent");
    } catch { /* private mode — just show the form */ }
  }, [storageKey]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (state === "sending" || state === "sent") return;
    if (!form.name.trim() || !form.email.trim() || !form.company.trim()) {
      setState("error");
      return;
    }
    setState("sending");
    try {
      const message =
        `Access request for "${featureName}".\n\n` +
        `Role / who they are: ${form.role || "—"}\n` +
        `Shopify store: ${form.store || "—"}\n\n` +
        `${form.message || "(no message)"}`;
      const res = await fetch("/nextapi/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, company: form.company, email: form.email, message }),
      });
      if (!res.ok) throw new Error();
      if (storageKey) {
        try { localStorage.setItem(storageKey, new Date().toISOString()); } catch { /* ignore */ }
      }
      setState("sent");
      onSent?.();
    } catch {
      setState("error");
    }
  };

  if (state === "sent") {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-left">
        <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-fg-soft" />
        <div>
          <p className="text-sm font-medium text-emerald-fg-softer">Request sent</p>
          <p className="mt-0.5 text-[13px] leading-relaxed text-emerald-fg-soft/80">
            Thanks — we&apos;ll review your details and email you once your access is enabled.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="w-full space-y-4 text-left">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Your name <Req /></label>
          <input className={inputCls} value={form.name} onChange={set("name")} placeholder="Jane Partner" autoComplete="name" />
        </div>
        <div>
          <label className={labelCls}>Email <Req /></label>
          <input className={inputCls} type="email" inputMode="email" value={form.email} onChange={set("email")} placeholder="you@company.com" autoComplete="email" />
        </div>
        <div>
          <label className={labelCls}>Company <Req /></label>
          <input className={inputCls} value={form.company} onChange={set("company")} placeholder="Company Ltd" autoComplete="organization" />
        </div>
        <div>
          <label className={labelCls}>Your role</label>
          <input className={inputCls} value={form.role} onChange={set("role")} placeholder="Owner, manager…" />
        </div>
      </div>
      <div>
        <label className={labelCls}>Shopify store</label>
        <input className={inputCls} value={form.store} onChange={set("store")} placeholder="your-store.myshopify.com" />
      </div>
      <div>
        <label className={labelCls}>About your business</label>
        <textarea
          className={`${inputCls.replace("h-11","min-h-[88px] py-2")} resize-y`}
          rows={3}
          value={form.message}
          onChange={set("message")}
          placeholder="What you sell and which Patrik brands you carry."
        />
      </div>

      {state === "error" && (
        <p className="text-[13px] text-red-fg">
          Please add your name, email and company, then try again.
        </p>
      )}

      <button
        type="submit"
        disabled={state === "sending"}
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
      >
        {state === "sending" && <SpinnerIcon className="h-4 w-4" />}
        {state === "sending" ? "Sending…" : "Request access"}
      </button>
    </form>
  );
}
