"use client";

import { useState, useEffect, useCallback } from "react";
import ProductDetailModal from "./ProductDetailModal";
import Select from "./ui/Select";

/**
 * Own Sources — the self-serve area where a partner registers their OWN supplier feeds (other
 * brands they resell) so those products flow through the existing Shopify push (design §9).
 *
 * The whole feature is a closed JSON contract + validator + importer on the backend; this page is
 * the human surface: list feeds with health, add/edit a feed, "Test feed" (the onboarding
 * centerpiece — fetch+validate, no write), trigger an import, and view import history. The feed
 * auth token is write-only (shown as •••• once saved, never returned).
 */

const ACCENT = "#01a0be";
const COMMON_TIMEZONES = [
  "Europe/Ljubljana", "Europe/Vienna", "Europe/Berlin", "Europe/Zurich", "Europe/Rome",
  "Europe/Paris", "Europe/Amsterdam", "Europe/Brussels", "Europe/Madrid", "Europe/Lisbon",
  "Europe/London", "Europe/Dublin", "Europe/Prague", "Europe/Warsaw", "Europe/Budapest",
  "Europe/Zagreb", "Europe/Belgrade", "Europe/Athens", "Europe/Helsinki", "Europe/Stockholm",
  "Europe/Copenhagen", "Europe/Oslo", "Europe/Istanbul", "UTC",
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "Asia/Dubai", "Asia/Tokyo", "Asia/Shanghai", "Asia/Singapore", "Australia/Sydney",
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const EMPTY_FORM = {
  brand: "",
  url: "",
  authHeaderName: "",
  authToken: "",
  schedule: { enabled: false, frequency: "every_hours", everyHours: 6, timeOfDay: "03:00", weekday: 1, timezone: "Europe/Ljubljana" },
  options: { defaultStatus: "active", removalPolicy: "delist", maxStalenessHours: 48, allowEmptyFeed: false },
};

/* ── shared bits ──────────────────────────────────────────────────────────── */

function HealthPill({ source }) {
  const status = source.status;
  const result = source.health?.lastResult;
  let tone = "grey", label = "Never run";
  if (status === "paused") { tone = "grey"; label = "Paused"; }
  else if (result === "ok") { tone = "green"; label = "OK"; }
  else if (result === "invalid") { tone = "red"; label = "Invalid"; }
  else if (result === "fetch_error") { tone = "amber"; label = "Fetch error"; }
  else if (result) { tone = "amber"; label = result; }
  const tones = {
    green: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    red: "bg-red-500/15 text-red-300 border-red-500/30",
    amber: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    grey: "bg-neutral-700/40 text-neutral-300 border-neutral-600/40",
  };
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>{label}</span>;
}

function Button({ children, onClick, variant = "ghost", disabled, type = "button" }) {
  const base = "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "text-white shadow-lg",
    ghost: "border border-neutral-700 bg-neutral-800/60 text-neutral-300 hover:border-neutral-500 hover:text-white",
    danger: "border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20",
  };
  const style = variant === "primary" ? { backgroundColor: ACCENT } : undefined;
  return <button type={type} onClick={onClick} disabled={disabled} style={style} className={`${base} ${variants[variant]}`}>{children}</button>;
}

function Field({ label, children, hint }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-neutral-300">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-neutral-700 bg-neutral-900/60 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-[#01a0be] focus:outline-none";

// Locks page scroll while a modal is mounted (paired with `overscroll-contain` on the modal's
// scroll area) so the wheel never bleeds through to the background.
function useLockBody() {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);
}

// Consistent close (✕) button for every modal header.
function CloseButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close"
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 transition-colors hover:border-neutral-700 hover:bg-neutral-800 hover:text-white"
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
    </button>
  );
}

// Modern switch — replaces the default checkbox. Whole row is the hit target.
function Toggle({ checked, onChange, label, hint }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-900/40 px-4 py-3 text-left transition-colors hover:border-neutral-700"
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium text-neutral-200">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-neutral-500">{hint}</span>}
      </span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-[#01a0be]" : "bg-neutral-700"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[1.375rem]" : "translate-x-0.5"}`} />
      </span>
    </button>
  );
}

// Modern segmented radio — selectable cards instead of default radios.
function RadioCards({ value, onChange, options, columns = 3 }) {
  return (
    <div className={`grid gap-2 ${columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${active ? "border-[#01a0be] bg-[#01a0be]/10 ring-1 ring-[#01a0be]/40" : "border-neutral-800 bg-neutral-900/40 hover:border-neutral-700"}`}
          >
            <span className={`block text-sm font-medium ${active ? "text-white" : "text-neutral-200"}`}>{o.label}</span>
            {o.hint && <span className="mt-0.5 block text-xs text-neutral-500">{o.hint}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ── feed-format help modal ───────────────────────────────────────────────── */

const EXAMPLE_FEED = `{
  "schemaVersion": "1.0",
  "brand": "Recharge",
  "currency": "EUR",
  "generatedAt": "2026-06-10T08:00:00Z",
  "products": [
    {
      "externalId": "RC-WING-X",
      "name": "Wing-X Foil Wing",
      "descriptionHtml": "<p>High-aspect freeride wing…</p>",
      "vendor": "Recharge",
      "productType": "Wings",
      "status": "active",
      "tags": ["2026", "freeride"],
      "categoryPaths": ["Wings / Freeride"],
      "images": [
        { "src": "https://recharge.si/img/wingx/hero.jpg", "alt": "Wing-X" }
      ],
      "variants": [
        {
          "sku": "RC-WX-40",
          "barcode": "3830001234567",
          "option1": "4.0",
          "stock": 7,
          "price": { "amount": 899.00, "vat": 22, "taxMode": "gross" },
          "image": "https://recharge.si/img/wingx/40.jpg"
        }
      ]
    }
  ]
}`;

const FIELD_NOTES = [
  ["schemaVersion", "Required. Must be \"1.0\"."],
  ["brand / currency / generatedAt", "Required. Currency is ISO-4217 (EUR); generatedAt is ISO-8601 UTC."],
  ["products[].externalId", "Required, unique per feed — the parent's stable id."],
  ["products[].name", "Required. Becomes the Shopify product title."],
  ["descriptionHtml / vendor / productType / status / tags / categoryPaths / images", "Optional. status = active | draft. categoryPaths \"A / B\" expand to tags A, A / B."],
  ["variants[].sku", "Required, globally unique per feed — drives SKU → Shopify matching."],
  ["variants[].stock", "Required, integer ≥ 0."],
  ["variants[].price", "Required object: amount ≥ 0, vat %, taxMode = gross | net."],
  ["barcode / option1 / image", "Optional. option1 is the variant value (e.g. size)."],
];

// Fields you fill in when adding/editing a source.
const SOURCE_FIELDS = [
  ["Brand", "The supplier or brand name shown in your list (e.g. \"Recharge\")."],
  ["Feed URL", "A stable https URL that returns the JSON feed in the shape below. The portal fetches this on every import, so it must stay reachable."],
  ["Auth header name + token", "Optional — only if your feed is protected. Give the header name (e.g. X-Api-Key) and its value. The token is write-only: once saved it shows as •••• and is never shown again."],
];

// Import options on the Add/Edit form.
const OPTION_NOTES = [
  ["Default status", "What a product becomes when the feed omits status — Active (live immediately) or Draft (hidden until you publish it)."],
  ["Max staleness (hours)", "If the feed's generatedAt is older than this, the run is flagged stale so you notice a supplier that quietly stopped updating."],
  ["Removal policy", "What happens when a product drops out of the feed — Delist (hide it, reversible), Zero stock (keep it listed at 0), or Keep (leave the last known values)."],
  ["Allow empty feed", "Off by default. The wipe-guard refuses a feed that suddenly returns 0 products, so a supplier outage can't empty your store."],
];

// Small numbered/plain section wrapper for the guide.
function GuideSection({ n, title, children }) {
  return (
    <section className="mt-8 first:mt-0">
      <h3 className="mb-3 flex items-center gap-2.5 text-sm font-semibold text-white">
        {n != null && (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#01a0be]/15 text-xs font-bold text-[#01a0be]">{n}</span>
        )}
        {title}
      </h3>
      {children}
    </section>
  );
}

// Two-column definition table used throughout the guide.
function DefList({ rows, mono }) {
  return (
    <dl className="divide-y divide-neutral-800 rounded-xl border border-neutral-800">
      {rows.map(([k, v]) => (
        <div key={k} className="grid grid-cols-1 gap-1 px-4 py-2.5 sm:grid-cols-[minmax(0,16rem)_1fr]">
          <dt className={mono ? "font-mono text-xs text-[#01a0be]" : "text-xs font-medium text-neutral-200"}>{k}</dt>
          <dd className="text-xs leading-relaxed text-neutral-400">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function HelpModal({ onClose }) {
  useLockBody();
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md" onClick={onClose}>
      <div className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900" onClick={(e) => e.stopPropagation()}>
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-800 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Own Sources guide</h2>
            <p className="text-sm text-neutral-400">How to connect your own supplier feed and what every field does — from adding a source to going live.</p>
          </div>
          <CloseButton onClick={onClose} />
        </div>

        <div className="overflow-y-auto overscroll-contain px-6 py-5">
          {/* Overview */}
          <div className="rounded-xl border border-[#01a0be]/20 bg-[#01a0be]/[0.06] px-4 py-3.5 text-sm leading-relaxed text-neutral-300">
            <span className="font-medium text-white">How it works.</span> You register a supplier&apos;s JSON feed; the portal fetches and validates it, matches products by SKU, and pushes them to your Shopify store <span className="text-neutral-200">alongside Patrik</span> — the same one-way sync. Nothing is written until a feed validates cleanly.
          </div>

          {/* 1 — Add a source */}
          <GuideSection n={1} title="Add a source">
            <p className="mb-3 text-xs leading-relaxed text-neutral-400">
              Click <span className="font-medium text-neutral-200">+ Add source</span> and fill in:
            </p>
            <DefList rows={SOURCE_FIELDS} />
          </GuideSection>

          {/* 2 — Feed format */}
          <GuideSection n={2} title="Feed format">
            <p className="mb-3 text-xs leading-relaxed text-neutral-400">
              Send this to your supplier. The feed must be valid JSON in exactly this shape — the portal validates, it never guesses.
            </p>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-500">Example feed</p>
            <pre className="overflow-x-auto rounded-xl border border-neutral-800 bg-black/40 p-4 text-xs leading-relaxed text-neutral-300"><code>{EXAMPLE_FEED}</code></pre>
            <p className="mb-2 mt-5 text-xs font-medium uppercase tracking-wider text-neutral-500">Field reference</p>
            <DefList rows={FIELD_NOTES} mono />
          </GuideSection>

          {/* 3 — Schedule */}
          <GuideSection n={3} title="Schedule imports">
            <p className="text-xs leading-relaxed text-neutral-400">
              Turn on <span className="font-medium text-neutral-200">Run automatically on a schedule</span> and the portal imports the feed on its own — <span className="text-neutral-200">every N hours</span>, <span className="text-neutral-200">daily</span>, or <span className="text-neutral-200">weekly</span> at a time in your timezone. Leave it off to import only when you click <span className="font-medium text-neutral-200">Import now</span>.
            </p>
          </GuideSection>

          {/* 4 — Options */}
          <GuideSection n={4} title="Import options">
            <DefList rows={OPTION_NOTES} />
          </GuideSection>

          {/* 5 — Test */}
          <GuideSection n={5} title="Test before you save">
            <p className="text-xs leading-relaxed text-neutral-400">
              Use <span className="font-medium text-neutral-200">Run test</span> in the Add/Edit panel to fetch and validate the feed <span className="text-neutral-200">without writing anything</span>. A pass shows product/variant counts and a sample preview; a fail lists every validation issue with its exact path — forward that straight to your supplier.
            </p>
          </GuideSection>

          {/* 6 — Go live */}
          <GuideSection n={6} title="Import & monitor">
            <p className="text-xs leading-relaxed text-neutral-400">
              Save the source, then <span className="font-medium text-neutral-200">Import now</span> (or let the schedule run). The <span className="font-medium text-neutral-200">Health</span> pill on each row shows the last result, and <span className="font-medium text-neutral-200">History</span> lists every run with created / updated / removed counts.
            </p>
          </GuideSection>

          <p className="mt-7 rounded-lg border border-neutral-800 bg-neutral-900/40 px-4 py-3 text-xs leading-relaxed text-neutral-400">
            <span className="font-medium text-neutral-200">Strict by design.</span> One invalid field rejects the whole import and leaves your catalogue untouched — so a malformed feed can never half-update your store.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── test-feed result ─────────────────────────────────────────────────────── */

function TestFeedResult({ result }) {
  // Capture "now" once (lazy init) so the render stays pure — no Date.now() during render.
  const [mountedAt] = useState(() => Date.now());
  if (!result) return null;
  if (result.fetchError) {
    return <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">Could not fetch the feed: {result.fetchError}</div>;
  }
  if (result.ok) {
    const ageH = result.generatedAt ? Math.max(0, Math.round((mountedAt - new Date(result.generatedAt).getTime()) / 3600000)) : null;
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          Valid — {result.counts.products} products / {result.counts.variants} variants{ageH != null ? `, generated ${ageH}h ago` : ""}.
        </div>
        {result.warnings?.length > 0 && (
          <ul className="space-y-1 text-xs text-amber-300">
            {result.warnings.map((w, i) => <li key={i}>⚠ {w.path}: {w.message}</li>)}
          </ul>
        )}
        {result.sample?.length > 0 && (
          <div className="rounded-lg border border-neutral-700 bg-neutral-900/40">
            <p className="border-b border-neutral-800 px-3 py-2 text-xs font-medium uppercase tracking-wider text-neutral-500">Sample preview</p>
            <ul className="divide-y divide-neutral-800">
              {result.sample.map((p, i) => (
                <li key={i} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <span className="text-neutral-200">{p.name}</span>
                  <span className="shrink-0 text-xs text-neutral-500">{p.variants} variant{p.variants === 1 ? "" : "s"} · {p.price != null ? p.price : "—"} · {(p.tags || []).slice(0, 3).join(", ")}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-red-500/30 bg-red-500/10">
      <p className="border-b border-red-500/20 px-3 py-2 text-sm font-medium text-red-200">{result.issues.length} validation issue{result.issues.length === 1 ? "" : "s"} — the import would be rejected. Forward this to your supplier:</p>
      <ul className="max-h-72 divide-y divide-red-500/10 overflow-y-auto">
        {result.issues.map((iss, i) => (
          <li key={i} className="px-3 py-2 text-xs">
            <code className="text-red-300">{iss.path}</code>
            <span className="text-red-200"> — {iss.message}</span>
            {iss.value !== undefined && <span className="text-neutral-500"> (got {JSON.stringify(iss.value)})</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── add / edit drawer ────────────────────────────────────────────────────── */

function AddEditSource({ source, onClose, onSaved, onNotice, onHelp }) {
  useLockBody();
  const isNew = !source;
  const [form, setForm] = useState(() => isNew ? structuredClone(EMPTY_FORM) : {
    brand: source.brand || "",
    url: source.feed?.url || "",
    authHeaderName: source.feed?.authHeaderName || "",
    authToken: "", // write-only; blank = keep existing
    hasAuthToken: !!source.feed?.hasAuthToken,
    schedule: { ...EMPTY_FORM.schedule, ...(source.schedule || {}) },
    options: { ...EMPTY_FORM.options, ...(source.options || {}) },
  });
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setSchedule = (patch) => setForm((f) => ({ ...f, schedule: { ...f.schedule, ...patch } }));
  const setOptions = (patch) => setForm((f) => ({ ...f, options: { ...f.options, ...patch } }));

  const runTest = async () => {
    setTesting(true); setTestResult(null);
    try {
      const res = await fetch("/nextapi/export/external/test", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: form.url, authHeaderName: form.authHeaderName || undefined, authToken: form.authToken || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { onNotice({ tone: "error", text: data.error || "Test failed." }); }
      else setTestResult(data);
    } catch { onNotice({ tone: "error", text: "Could not reach the server to test." }); }
    setTesting(false);
  };

  const save = async () => {
    if (!form.brand.trim() || !/^https?:\/\//i.test(form.url)) {
      onNotice({ tone: "error", text: "A brand name and a valid https feed URL are required." });
      return;
    }
    setSaving(true);
    const payload = {
      brand: form.brand.trim(),
      schedule: form.schedule,
      options: form.options,
      feed: { url: form.url.trim(), authHeaderName: form.authHeaderName || null, ...(form.authToken ? { authToken: form.authToken } : {}) },
    };
    try {
      let res;
      if (isNew) {
        res = await fetch("/nextapi/export/external/sources", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brand: payload.brand, url: payload.feed.url, authHeaderName: payload.feed.authHeaderName, authToken: form.authToken || undefined, schedule: payload.schedule, options: payload.options }),
        });
      } else {
        res = await fetch(`/nextapi/export/external/sources/${source.feedId}`, {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
      }
      const data = await res.json();
      if (res.ok) { onNotice({ tone: "success", text: isNew ? "Feed registered." : "Feed updated." }); onSaved(); }
      else onNotice({ tone: "error", text: data.error || "Could not save the feed." });
    } catch { onNotice({ tone: "error", text: "Could not reach the server to save." }); }
    setSaving(false);
  };

  const sched = form.schedule;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md sm:p-6" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-neutral-800 px-6 py-4">
          <h2 className="text-base font-semibold text-white">{isNew ? "Add source" : `Edit ${source.brand}`}</h2>
          <div className="flex items-center gap-3">
            {onHelp && <button type="button" onClick={onHelp} className="text-xs font-medium text-[#01a0be] hover:underline">Guide</button>}
            <CloseButton onClick={onClose} />
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-6 py-5">
          <Field label="Brand"><input className={inputCls} value={form.brand} onChange={(e) => set({ brand: e.target.value })} placeholder="Recharge" /></Field>
          <Field label="Feed URL" hint="A stable https URL returning the JSON feed in the published contract."><input className={inputCls} value={form.url} onChange={(e) => set({ url: e.target.value })} placeholder="https://recharge.si/feeds/t4a.json" /></Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Auth header name" hint="Optional"><input className={inputCls} value={form.authHeaderName} onChange={(e) => set({ authHeaderName: e.target.value })} placeholder="X-Api-Key" /></Field>
            <Field label="Auth token" hint={form.hasAuthToken ? "Saved — leave blank to keep" : "Optional, write-only"}><input className={inputCls} type="password" value={form.authToken} onChange={(e) => set({ authToken: e.target.value })} placeholder={form.hasAuthToken ? "••••••••" : ""} /></Field>
          </div>

          {/* Schedule (portal-driven — no n8n) */}
          <div className="space-y-3">
            <Toggle
              checked={sched.enabled}
              onChange={(v) => setSchedule({ enabled: v })}
              label="Run automatically on a schedule"
              hint={sched.enabled ? describeSchedule(sched) : "The portal imports this feed on its own — no manual trigger needed."}
            />
            {sched.enabled && (
              <div className="space-y-3 rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Frequency">
                    <Select ariaLabel="Frequency" value={sched.frequency} onChange={(e) => setSchedule({ frequency: e.target.value })}>
                      <option value="every_hours">Every N hours</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </Select>
                  </Field>
                  {sched.frequency === "every_hours" && <Field label="Every (hours)"><input type="number" min="1" className={inputCls} value={sched.everyHours} onChange={(e) => setSchedule({ everyHours: Number(e.target.value) })} /></Field>}
                  {sched.frequency !== "every_hours" && <Field label="Time of day"><input type="time" className={inputCls} value={sched.timeOfDay} onChange={(e) => setSchedule({ timeOfDay: e.target.value })} /></Field>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {sched.frequency === "weekly" && (
                    <Field label="Weekday">
                      <Select ariaLabel="Weekday" value={sched.weekday} onChange={(e) => setSchedule({ weekday: Number(e.target.value) })}>
                        {WEEKDAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                      </Select>
                    </Field>
                  )}
                  <Field label="Timezone">
                    <Select ariaLabel="Timezone" value={sched.timezone} onChange={(e) => setSchedule({ timezone: e.target.value })}>
                      {[...new Set([sched.timezone, ...COMMON_TIMEZONES])].filter(Boolean).map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                    </Select>
                  </Field>
                </div>
              </div>
            )}
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Default status (missing in feed)">
              <Select ariaLabel="Default status" value={form.options.defaultStatus} onChange={(e) => setOptions({ defaultStatus: e.target.value })}>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
              </Select>
            </Field>
            <Field label="Max staleness (hours)"><input type="number" min="1" className={inputCls} value={form.options.maxStalenessHours} onChange={(e) => setOptions({ maxStalenessHours: Number(e.target.value) })} /></Field>
          </div>

          <Field label="When a product drops out of the feed" hint="Reversible by default — Delist hides the listing rather than deleting it.">
            <RadioCards
              value={form.options.removalPolicy}
              onChange={(v) => setOptions({ removalPolicy: v })}
              options={[
                { value: "delist", label: "Delist", hint: "Hide the listing" },
                { value: "zero_stock", label: "Zero stock", hint: "Keep listed, set 0" },
                { value: "keep", label: "Keep", hint: "Leave last known" },
              ]}
            />
          </Field>

          <Toggle
            checked={form.options.allowEmptyFeed}
            onChange={(v) => setOptions({ allowEmptyFeed: v })}
            label="Allow an empty feed"
            hint="Off (recommended) — the wipe-guard refuses a feed that suddenly returns 0 products, so a supplier outage can't empty your store."
          />

          {/* Test */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-neutral-200">Test feed</p>
              <Button onClick={runTest} disabled={testing || !form.url}>{testing ? "Testing…" : "Run test"}</Button>
            </div>
            <TestFeedResult result={testResult} />
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-neutral-800 bg-neutral-900/40 px-6 py-4">
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={saving}>{saving ? "Saving…" : (isNew ? "Save source" : "Save changes")}</Button>
        </div>
      </div>
    </div>
  );
}

function describeSchedule(s) {
  if (!s.enabled) return "Disabled — import manually.";
  if (s.frequency === "every_hours") return `Runs every ${s.everyHours} hour${s.everyHours === 1 ? "" : "s"}.`;
  if (s.frequency === "daily") return `Runs daily at ${s.timeOfDay} (${s.timezone}).`;
  return `Runs every ${WEEKDAYS[s.weekday]} at ${s.timeOfDay} (${s.timezone}).`;
}

/* ── activity modal ───────────────────────────────────────────────────────── */

function SourceActivity({ source, onClose }) {
  useLockBody();
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch(`/nextapi/export/external/sources/${source.feedId}/activity`).then((r) => r.json()).then(setData).catch(() => setData({ runs: [] }));
  }, [source.feedId]);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md" onClick={onClose}>
      <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-2xl border border-neutral-800 bg-neutral-900 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{source.brand} — import history</h2>
          <CloseButton onClick={onClose} />
        </div>
        {!data ? <p className="text-sm text-neutral-500">Loading…</p> : (data.runs?.length ? (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-neutral-800 text-left text-xs uppercase tracking-wider text-neutral-500"><th className="py-2">Time</th><th>Trigger</th><th>Result</th><th>Changes</th></tr></thead>
            <tbody className="divide-y divide-neutral-800">
              {data.runs.map((r) => (
                <tr key={r.id}>
                  <td className="py-2 text-neutral-400">{r.time ? new Date(r.time).toLocaleString() : "—"}</td>
                  <td className="text-neutral-400">{r.trigger}</td>
                  <td className={r.result === "ok" ? "text-emerald-300" : "text-amber-300"}>{r.result}</td>
                  <td className="text-neutral-400">{r.counts ? `${r.counts.created} created · ${r.counts.updated} updated · ${r.counts.removed} removed` : (r.error?.message || "—")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="text-sm text-neutral-500">No imports yet.</p>)}
      </div>
    </div>
  );
}

/* ── preview drawer ───────────────────────────────────────────────────────── */

// Pulls the lowest numeric price across a product's variants (variants carry pricing).
function minPriceOf(product) {
  const variants = product.child_products || [];
  const own = (product.pricelist || []).map((p) => p.price);
  const prices = [...own, ...variants.flatMap((v) => (v.pricelist || []).map((p) => p.price))].filter((p) => typeof p === "number");
  return prices.length ? Math.min(...prices) : null;
}

function imageOf(product) {
  return product.images?.[0] || product.child_products?.find((v) => v.images?.[0])?.images?.[0] || null;
}

function labelsOf(product) {
  // External products carry resolved `tags`; fall back to `categories` for parity with Patrik products.
  const src = product.categories?.length ? product.categories : product.tags || [];
  return src.slice(0, 2);
}

const PlaceholderImg = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

/**
 * Right-side product drawer for a feed — the same shape/behaviour as the Export "Preview" panel,
 * but sourced from this feed's imported products (`/sources/:feedId/products`). Grid/list toggle,
 * in-panel search, image · name · variant count · min price · stock · category chips.
 */
function SourcePreview({ source, onClose }) {
  useLockBody();
  const [products, setProducts] = useState(null); // null = loading, [] = loaded empty
  const [failed, setFailed] = useState(false);
  const [view, setView] = useState("grid");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState(null); // product whose detail modal is open

  useEffect(() => {
    let alive = true;
    fetch(`/nextapi/export/external/sources/${source.feedId}/products`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (alive) setProducts(Array.isArray(d?.products) ? d.products : []); })
      .catch(() => { if (alive) { setProducts([]); setFailed(true); } });
    return () => { alive = false; };
  }, [source.feedId]);

  const base = products || [];
  const shown = !search.trim()
    ? base
    : base.filter((p) => {
        const s = search.toLowerCase();
        return (p.product_name || "").toLowerCase().includes(s)
          || (p.child_products || []).some((v) => (v.code || "").toLowerCase().includes(s))
          || (p.tags || []).some((t) => (t || "").toLowerCase().includes(s));
      });

  return (
    <div className="fixed inset-0 z-[60] flex" style={{ fontFamily: "inherit" }}>
      <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="flex w-full max-w-4xl flex-col overflow-hidden border-l border-neutral-700/60 bg-neutral-950 shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-800/80 bg-neutral-900/80 px-6 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#01a0be]">
              <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold text-white">{source.brand} — preview</h2>
              <p className="mt-0.5 text-xs text-neutral-500">
                {products === null ? "Loading…" : (
                  <>
                    <span className="font-medium text-cyan-400">{shown.length}</span>
                    {search.trim() ? ` of ${base.length} products` : ` product${base.length !== 1 ? "s" : ""} imported`}
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="flex rounded-lg border border-neutral-800 bg-neutral-800/80 p-0.5">
              <button onClick={() => setView("grid")} title="Grid view" className={`rounded-md p-1.5 transition-all ${view === "grid" ? "bg-neutral-700 text-white" : "text-neutral-500 hover:text-neutral-300"}`}>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              </button>
              <button onClick={() => setView("list")} title="List view" className={`rounded-md p-1.5 transition-all ${view === "list" ? "bg-neutral-700 text-white" : "text-neutral-500 hover:text-neutral-300"}`}>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
              </button>
            </div>
            <button onClick={onClose} className="rounded-lg p-2 text-neutral-500 transition-all hover:bg-neutral-800 hover:text-white">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="shrink-0 border-b border-neutral-800/60 px-4 py-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search within preview…"
              className="w-full rounded-xl border border-neutral-700/40 bg-neutral-800/60 py-2.5 pl-9 pr-4 text-sm text-white placeholder-neutral-600 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-300">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4">
          {products === null ? (
            <div className="flex h-64 flex-col items-center justify-center text-neutral-600">
              <svg className="mb-3 h-7 w-7 animate-spin text-neutral-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              <p className="text-sm">Loading products…</p>
            </div>
          ) : shown.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center text-neutral-600">
              <PlaceholderImg className="mb-3 h-12 w-12 opacity-40" />
              <p className="text-sm font-medium">
                {failed ? "Couldn't load products" : search ? "No products match your search" : "No products imported yet"}
              </p>
              {!failed && !search && <p className="mt-1 max-w-xs text-xs text-neutral-600">Run an import (or Test the feed) and the products it would push will appear here.</p>}
            </div>
          ) : view === "grid" ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {shown.map((product) => {
                const img = imageOf(product);
                const variants = product.child_products || [];
                const minPrice = minPriceOf(product);
                const hasStock = variants.some((v) => v.stock_amount > 0) || product.stock_amount > 0;
                return (
                  <div key={product._id || product.externalId} role="button" tabIndex={0} onClick={() => setDetail(product)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setDetail(product); } }} className="group cursor-pointer overflow-hidden rounded-xl border border-neutral-800/60 bg-neutral-900/70 transition-all hover:border-[#01a0be]/40 hover:shadow-lg hover:shadow-black/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#01a0be]/50">
                    <div className="relative aspect-square bg-neutral-800">
                      {img ? (
                        <img src={img} alt={product.product_name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center"><PlaceholderImg className="h-10 w-10 text-neutral-700" /></div>
                      )}
                      <div className="absolute right-2 top-2">
                        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${hasStock ? "bg-emerald-500/90 text-white" : "bg-neutral-700/90 text-neutral-400"}`}>
                          {hasStock ? "● In Stock" : "○ No Stock"}
                        </span>
                      </div>
                    </div>
                    <div className="p-2.5">
                      <p className="mb-1.5 line-clamp-2 text-xs font-semibold leading-snug text-white">{product.product_name}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-neutral-500">{variants.length} variant{variants.length !== 1 ? "s" : ""}</span>
                        {minPrice !== null && <span className="text-xs font-semibold text-cyan-400">€{minPrice.toFixed(2)}</span>}
                      </div>
                      {labelsOf(product).length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {labelsOf(product).map((c) => (
                            <span key={c} className="max-w-[80px] truncate rounded-md border border-neutral-800 bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-500">{c}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-1.5">
              {shown.map((product) => {
                const img = imageOf(product);
                const variants = product.child_products || [];
                const minPrice = minPriceOf(product);
                const hasStock = variants.some((v) => v.stock_amount > 0) || product.stock_amount > 0;
                return (
                  <div key={product._id || product.externalId} role="button" tabIndex={0} onClick={() => setDetail(product)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setDetail(product); } }} className="group flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-800/50 bg-neutral-900/60 p-2.5 transition-all hover:border-[#01a0be]/40 hover:bg-neutral-800/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#01a0be]/50">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-neutral-800">
                      {img ? (
                        <img src={img} alt={product.product_name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center"><PlaceholderImg className="h-5 w-5 text-neutral-700" /></div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{product.product_name}</p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="text-[11px] text-neutral-600">{variants.length} var.</span>
                        {minPrice !== null && <span className="text-[11px] font-semibold text-cyan-400">€{minPrice.toFixed(2)}</span>}
                        {labelsOf(product).map((c) => (
                          <span key={c} className="max-w-[100px] truncate rounded border border-neutral-700/40 bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-600">{c}</span>
                        ))}
                      </div>
                    </div>
                    <div className="shrink-0">
                      <span className={`rounded-lg px-2 py-1 text-[10px] font-semibold ${hasStock ? "border border-emerald-500/20 bg-emerald-500/15 text-emerald-400" : "border border-neutral-700/40 bg-neutral-800 text-neutral-600"}`}>
                        {hasStock ? "In Stock" : "No Stock"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {detail && <ProductDetailModal product={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

/* ── main page ────────────────────────────────────────────────────────────── */

export default function OwnSourcesPage({ initialSources }) {
  const [sources, setSources] = useState(initialSources || []);
  const [editing, setEditing] = useState(null); // null | 'new' | sourceObj
  const [activityFor, setActivityFor] = useState(null);
  const [previewFor, setPreviewFor] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busyFeed, setBusyFeed] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const failed = initialSources === null;

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/nextapi/export/external/sources", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data?.sources)) setSources(data.sources);
    } catch { /* keep current */ }
  }, []);

  const importNow = async (s) => {
    setBusyFeed(s.feedId);
    try {
      const res = await fetch(`/nextapi/export/external/sources/${s.feedId}/import`, { method: "POST" });
      const data = await res.json();
      if (res.ok) { setNotice({ tone: "success", text: `Import started for ${s.brand}.` }); setTimeout(refresh, 2500); }
      else setNotice({ tone: "error", text: data.error || "Could not start the import." });
    } catch { setNotice({ tone: "error", text: "Could not reach the server." }); }
    setBusyFeed(null);
  };

  const remove = async (s) => {
    if (!confirm(`Remove ${s.brand}? This deletes its imported products and unlinks any store.`)) return;
    try {
      const res = await fetch(`/nextapi/export/external/sources/${s.feedId}`, { method: "DELETE" });
      if (res.ok) { setNotice({ tone: "success", text: `${s.brand} removed.` }); refresh(); }
      else setNotice({ tone: "error", text: "Could not remove the feed." });
    } catch { setNotice({ tone: "error", text: "Could not reach the server." }); }
  };

  return (
    <div>
      {/* Compact header — small icon + title + badge on one line, actions on the right */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#01a0be]/30 bg-[#01a0be]/10">
            <svg className="h-5 w-5 text-[#01a0be]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 11a9 9 0 019 9M4 4a16 16 0 0116 16" />
              <circle cx="5" cy="19" r="1.5" fill="currentColor" stroke="none" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">Own sources</h1>
              <span className="inline-flex items-center rounded-full border border-[#01a0be]/25 bg-[#01a0be]/10 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-widest text-[#01a0be]">
                Feeds
              </span>
            </div>
            <p className="truncate text-xs text-neutral-500">Register your own brand feeds and push them to your Shopify store, alongside Patrik.</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button onClick={() => setHelpOpen(true)}>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M12 17h.008M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Guide
          </Button>
          <Button variant="primary" onClick={() => setEditing("new")}>+ Add source</Button>
        </div>
      </header>

      {notice && (
        <div className={`mb-4 rounded-lg border px-4 py-2.5 text-sm ${notice.tone === "success" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-red-500/30 bg-red-500/10 text-red-200"}`}>
          {notice.text}
        </div>
      )}

      {failed && <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-200">Could not load your feeds — showing none. Refresh to retry.</div>}

      {sources.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-700 bg-neutral-900/30 px-6 py-16 text-center">
          <p className="text-neutral-300">No feeds yet.</p>
          <p className="mt-1 text-sm text-neutral-500">Add a supplier feed to push another brand to your store. The feed must conform to the published JSON contract.</p>
          <div className="mt-5"><Button variant="primary" onClick={() => setEditing("new")}>+ Add your first source</Button></div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-neutral-800">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-neutral-800 bg-neutral-900/60 text-left text-xs uppercase tracking-wider text-neutral-500">
              <th className="px-4 py-3">Brand</th><th>Feed</th><th>Health</th><th>Last import</th><th>Schedule</th><th className="text-right px-4">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-neutral-800">
              {sources.map((s) => {
                const c = s.health?.counts;
                return (
                  <tr key={s.feedId} className="bg-neutral-900/20">
                    <td className="px-4 py-3 font-medium text-white">{s.brand}</td>
                    <td className="max-w-[180px] truncate text-neutral-400" title={s.feed?.url}>{s.feed?.url}</td>
                    <td><HealthPill source={s} /></td>
                    <td className="text-neutral-400">{c && s.health?.lastImportAt ? `${c.products} products · ${c.variants} variants` : "—"}</td>
                    <td className="text-neutral-500 text-xs">{describeSchedule(s.schedule || {})}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <Button onClick={() => setPreviewFor(s)}>
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          Preview
                        </Button>
                        <Button onClick={() => importNow(s)} disabled={busyFeed === s.feedId}>{busyFeed === s.feedId ? "…" : "Import now"}</Button>
                        <Button onClick={() => setActivityFor(s)}>History</Button>
                        <Button onClick={() => setEditing(s)}>Edit</Button>
                        <Button variant="danger" onClick={() => remove(s)}>Remove</Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <AddEditSource
          source={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refresh(); }}
          onNotice={setNotice}
          onHelp={() => setHelpOpen(true)}
        />
      )}
      {activityFor && <SourceActivity source={activityFor} onClose={() => setActivityFor(null)} />}
      {previewFor && <SourcePreview source={previewFor} onClose={() => setPreviewFor(null)} />}
      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
    </div>
  );
}
