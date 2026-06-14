"use client";

/**
 * RequestAccessForm — the "ask to join" form shared by the public Shopify welcome page and the
 * in-app <TierGate>. A partner describes who they are (name, company, role, store, message); on
 * submit it emails us through the existing `/nextapi/contact` nodemailer route (role + store are
 * folded into the message so no backend change is needed). A successful request is remembered in
 * localStorage (per `storageKey`) so the form doesn't beg twice on the same device.
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
  "w-full rounded-xl border border-neutral-800 bg-neutral-950/60 px-3.5 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 outline-none transition-colors focus:border-[#01a0be]/60 focus:ring-1 focus:ring-[#01a0be]/30";
const labelCls = "mb-1.5 block text-xs font-medium text-neutral-400";

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
        body: JSON.stringify({
          name: form.name,
          company: form.company,
          email: form.email,
          message,
        }),
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
        <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
        <div>
          <p className="text-sm font-medium text-emerald-200">Request sent</p>
          <p className="mt-0.5 text-xs leading-relaxed text-emerald-300/80">
            Thanks — we&apos;ll review your details and be in touch by email once your access is enabled.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="w-full space-y-4 text-left">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Your name <span className="text-[#01a0be]">*</span></label>
          <input className={inputCls} value={form.name} onChange={set("name")} placeholder="Jane Partner" autoComplete="name" />
        </div>
        <div>
          <label className={labelCls}>Email <span className="text-[#01a0be]">*</span></label>
          <input className={inputCls} type="email" value={form.email} onChange={set("email")} placeholder="jane@company.com" autoComplete="email" />
        </div>
        <div>
          <label className={labelCls}>Company <span className="text-[#01a0be]">*</span></label>
          <input className={inputCls} value={form.company} onChange={set("company")} placeholder="Company Ltd" autoComplete="organization" />
        </div>
        <div>
          <label className={labelCls}>Your role</label>
          <input className={inputCls} value={form.role} onChange={set("role")} placeholder="Owner / e-commerce manager" />
        </div>
      </div>
      <div>
        <label className={labelCls}>Shopify store</label>
        <input className={inputCls} value={form.store} onChange={set("store")} placeholder="your-store.myshopify.com" />
      </div>
      <div>
        <label className={labelCls}>About your business</label>
        <textarea
          className={`${inputCls} min-h-[96px] resize-y`}
          value={form.message}
          onChange={set("message")}
          placeholder="What you sell, which Patrik brands you carry, and why you'd like the Shopify sync."
        />
      </div>

      {state === "error" && (
        <p className="text-xs text-red-400">
          Please fill in your name, email and company — then try again. If it keeps failing, use the contact page.
        </p>
      )}

      <button
        type="submit"
        disabled={state === "sending"}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#01a0be] to-violet-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#01a0be]/20 transition-all hover:shadow-[#01a0be]/40 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {state === "sending" ? <SpinnerIcon className="h-4 w-4" /> : null}
        {state === "sending" ? "Sending request…" : "Request access"}
      </button>
    </form>
  );
}
