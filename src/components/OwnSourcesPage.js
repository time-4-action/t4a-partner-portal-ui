"use client";

import { useState, useEffect, useCallback } from "react";
import ProductDetailModal from "./ProductDetailModal";
import Select from "./ui/Select";
import PageHeader from "@/components/ui/PageHeader";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { btn, countPill } from "@/lib/ui";

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
  aiCategorization: { enabled: false, exportIds: [] },
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
    green: "bg-emerald-500/15 text-emerald-fg-soft border-emerald-500/30",
    red: "bg-red-500/15 text-red-fg-soft border-red-500/30",
    amber: "bg-amber-500/15 text-amber-fg-soft border-amber-500/30",
    grey: "bg-accent/40 text-foreground border-input/40",
  };
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>{label}</span>;
}

function Button({ children, onClick, variant = "ghost", disabled, type = "button", className = "", title, ariaLabel }) {
  const base = "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "text-foreground shadow-lg",
    ghost: "border border-input bg-muted/60 text-foreground hover:border-muted-foreground/40 hover:text-foreground",
    danger: "border border-red-500/40 bg-red-500/10 text-red-fg-soft hover:bg-red-500/20",
  };
  const style = variant === "primary" ? { backgroundColor: ACCENT } : undefined;
  return <button type={type} onClick={onClick} disabled={disabled} title={title} aria-label={ariaLabel} style={style} className={`${base} ${variants[variant]} ${className}`}>{children}</button>;
}

function Field({ label, children, hint }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-accent-brand focus:outline-none";

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
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:border-input hover:bg-muted hover:text-foreground"
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
      className="flex w-full items-center justify-between gap-3 rounded-md border bg-background px-4 py-3 text-left transition-colors shadow-xs dark:border-input dark:bg-input/30 dark:hover:bg-input/50"
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium text-foreground">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span>}
      </span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-primary" : "bg-accent"}`}>
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
            className={`rounded-md border px-3 py-2.5 text-left transition-colors ${active ? "border-accent-brand bg-accent-brand/10 ring-1 ring-accent-brand/40" : "border bg-background shadow-xs dark:border-input dark:bg-input/30 dark:hover:bg-input/50"}`}
          >
            <span className={`block text-sm font-medium ${active ? "text-foreground" : "text-foreground"}`}>{o.label}</span>
            {o.hint && <span className="mt-0.5 block text-xs text-muted-foreground">{o.hint}</span>}
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
      <h3 className="mb-3 flex items-center gap-2.5 text-[13px] font-semibold text-foreground">
        {n != null && (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-accent-brand/15 text-xs font-bold text-accent-brand">{n}</span>
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
    <dl className="divide-y divide-border rounded-xl border border-border">
      {rows.map(([k, v]) => (
        <div key={k} className="grid grid-cols-1 gap-1 px-4 py-2.5 sm:grid-cols-[minmax(0,16rem)_1fr]">
          <dt className={mono ?"font-mono text-xs text-accent-brand":"text-xs font-medium text-foreground"}>{k}</dt>
          <dd className="text-xs leading-relaxed text-muted-foreground">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function HelpModal({ onClose }) {
  useLockBody();
  return (
    <div className="fixed inset-0 z-[60] flex bg-black/50 sm:items-center sm:justify-center sm:p-4" onClick={onClose}>
      <div className="flex h-full w-full flex-col overflow-hidden border-border bg-background sm:h-auto sm:max-h-[88vh] sm:max-w-3xl sm:rounded-lg sm:border sm:shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3.5 sm:px-6 sm:py-4">
          <div className="min-w-0">
            <h2 className="mb-0 text-[15px] font-semibold leading-tight text-foreground">Own Sources guide</h2>
            <p className="mt-1 hidden text-sm text-muted-foreground sm:block">How to connect your own supplier feed and what every field does — from adding a source to going live.</p>
          </div>
          <CloseButton onClick={onClose} />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
          {/* Overview */}
          <div className="rounded-xl border border-accent-brand/20 bg-accent-brand/[0.06] px-4 py-3.5 text-sm leading-relaxed text-foreground">
            <span className="font-medium text-foreground">How it works.</span> You register a supplier&apos;s JSON feed; the portal fetches and validates it, matches products by SKU, and pushes them to your Shopify store <span className="text-foreground">alongside Patrik</span> — the same one-way sync. Nothing is written until a feed validates cleanly.
          </div>

          {/* 1 — Add a source */}
          <GuideSection n={1} title="Add a source">
            <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
              Click <span className="font-medium text-foreground">+ Add source</span> and fill in:
            </p>
            <DefList rows={SOURCE_FIELDS} />
          </GuideSection>

          {/* 2 — Feed format */}
          <GuideSection n={2} title="Feed format">
            <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
              Send this to your supplier. The feed must be valid JSON in exactly this shape — the portal validates, it never guesses.
            </p>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Example feed</p>
            <pre className="overflow-x-auto rounded-xl border border-border bg-background/40 p-4 text-xs leading-relaxed text-foreground"><code>{EXAMPLE_FEED}</code></pre>
            <p className="mb-2 mt-5 text-xs font-medium uppercase tracking-wider text-muted-foreground">Field reference</p>
            <DefList rows={FIELD_NOTES} mono />
          </GuideSection>

          {/* 3 — Schedule */}
          <GuideSection n={3} title="Schedule imports">
            <p className="text-xs leading-relaxed text-muted-foreground">
              Turn on <span className="font-medium text-foreground">Run automatically on a schedule</span> and the portal imports the feed on its own — <span className="text-foreground">every N hours</span>, <span className="text-foreground">daily</span>, or <span className="text-foreground">weekly</span> at a time in your timezone. Leave it off to import only when you click <span className="font-medium text-foreground">Import now</span>.
            </p>
          </GuideSection>

          {/* 4 — Options */}
          <GuideSection n={4} title="Import options">
            <DefList rows={OPTION_NOTES} />
          </GuideSection>

          {/* 5 — Test */}
          <GuideSection n={5} title="Test before you save">
            <p className="text-xs leading-relaxed text-muted-foreground">
              Use <span className="font-medium text-foreground">Run test</span> in the Add/Edit panel to fetch and validate the feed <span className="text-foreground">without writing anything</span>. A pass shows product/variant counts and a sample preview; a fail lists every validation issue with its exact path — forward that straight to your supplier.
            </p>
          </GuideSection>

          {/* 6 — Go live */}
          <GuideSection n={6} title="Import & monitor">
            <p className="text-xs leading-relaxed text-muted-foreground">
              Save the source, then <span className="font-medium text-foreground">Import now</span> (or let the schedule run). The <span className="font-medium text-foreground">Health</span> pill on each row shows the last result, and <span className="font-medium text-foreground">History</span> lists every run with created / updated / removed counts.
            </p>
          </GuideSection>

          <p className="mt-7 rounded-lg border border-border bg-muted/40 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">Strict by design.</span> One invalid field rejects the whole import and leaves your catalogue untouched — so a malformed feed can never half-update your store.
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
    return <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-fg-softer">Could not fetch the feed: {result.fetchError}</div>;
  }
  if (result.ok) {
    const ageH = result.generatedAt ? Math.max(0, Math.round((mountedAt - new Date(result.generatedAt).getTime()) / 3600000)) : null;
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-fg-softer">
          Valid — {result.counts.products} products / {result.counts.variants} variants{ageH != null ? `, generated ${ageH}h ago` : ""}.
        </div>
        {result.warnings?.length > 0 && (
          <ul className="space-y-1 text-xs text-amber-fg-soft">
            {result.warnings.map((w, i) => <li key={i}>⚠ {w.path}: {w.message}</li>)}
          </ul>
        )}
        {result.sample?.length > 0 && (
          <div className="rounded-lg border border-input bg-muted/40">
            <p className="border-b border-border px-3 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Sample preview</p>
            <ul className="divide-y divide-border">
              {result.sample.map((p, i) => (
                <li key={i} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <span className="text-foreground">{p.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{p.variants} variant{p.variants === 1 ? "" : "s"} · {p.price != null ? p.price : "—"} · {(p.tags || []).slice(0, 3).join(", ")}</span>
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
      <p className="border-b border-red-500/20 px-3 py-2 text-sm font-medium text-red-fg-softer">{result.issues.length} validation issue{result.issues.length === 1 ? "" : "s"} — the import would be rejected. Forward this to your supplier:</p>
      <ul className="max-h-72 divide-y divide-red-500/10 overflow-y-auto">
        {result.issues.map((iss, i) => (
          <li key={i} className="px-3 py-2 text-xs">
            <code className="text-red-fg-soft">{iss.path}</code>
            <span className="text-red-fg-softer"> — {iss.message}</span>
            {iss.value !== undefined && <span className="text-muted-foreground"> (got {JSON.stringify(iss.value)})</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── add / edit drawer ────────────────────────────────────────────────────── */

function AddEditSource({ source, onClose, onSaved, onNotice, onHelp, aiExports = [] }) {
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
    aiCategorization: { ...EMPTY_FORM.aiCategorization, ...(source.aiCategorization || {}) },
  });
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(""); // shown inline inside the modal so it isn't hidden behind it

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setSchedule = (patch) => setForm((f) => ({ ...f, schedule: { ...f.schedule, ...patch } }));
  const setOptions = (patch) => setForm((f) => ({ ...f, options: { ...f.options, ...patch } }));
  const setAi = (patch) => setForm((f) => ({ ...f, aiCategorization: { ...f.aiCategorization, ...patch } }));

  const runTest = async () => {
    setTesting(true); setTestResult(null); setError("");
    try {
      const res = await fetch("/nextapi/export/external/test", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: form.url, authHeaderName: form.authHeaderName || undefined, authToken: form.authToken || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Feed test failed — check the URL and auth, then try again."); }
      else setTestResult(data);
    } catch { setError("Could not reach the server to test the feed."); }
    setTesting(false);
  };

  const save = async () => {
    setError("");
    if (!form.brand.trim() || !/^https?:\/\//i.test(form.url)) {
      setError("A brand name and a valid https feed URL are required.");
      return;
    }
    setSaving(true);
    const payload = {
      brand: form.brand.trim(),
      schedule: form.schedule,
      options: form.options,
      aiCategorization: form.aiCategorization,
      feed: { url: form.url.trim(), authHeaderName: form.authHeaderName || null, ...(form.authToken ? { authToken: form.authToken } : {}) },
    };
    try {
      let res;
      if (isNew) {
        res = await fetch("/nextapi/export/external/sources", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brand: payload.brand, url: payload.feed.url, authHeaderName: payload.feed.authHeaderName, authToken: form.authToken || undefined, schedule: payload.schedule, options: payload.options, aiCategorization: payload.aiCategorization }),
        });
      } else {
        res = await fetch(`/nextapi/export/external/sources/${source.feedId}`, {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
      }
      const data = await res.json();
      if (res.ok) { onNotice({ tone: "success", text: isNew ? "Feed registered." : "Feed updated." }); onSaved(); }
      else setError(data.error || "Could not save the feed.");
    } catch { setError("Could not reach the server to save the feed."); }
    setSaving(false);
  };

  const sched = form.schedule;

  return (
    <div className="fixed inset-0 z-[60] flex bg-black/50 sm:items-center sm:justify-center sm:p-6" onClick={onClose}>
      <div className="flex h-full w-full flex-col overflow-hidden border-border bg-background shadow-lg sm:h-auto sm:max-h-[94vh] sm:max-w-xl sm:rounded-lg sm:border" onClick={(e) => e.stopPropagation()}>
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3.5 sm:px-6 sm:py-4">
          <h2 className="mb-0 text-[14px] font-semibold leading-none text-foreground">{isNew ? "Add source" : `Edit ${source.brand}`}</h2>
          <div className="flex items-center gap-3">
            {onHelp && <button type="button" onClick={onHelp} className="text-xs font-medium text-accent-brand hover:underline">Guide</button>}
            <CloseButton onClick={onClose} />
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
          <Field label="Brand"><input className={inputCls} value={form.brand} onChange={(e) => set({ brand: e.target.value })} placeholder="Recharge" /></Field>
          <Field label="Feed URL" hint="A stable https URL returning the JSON feed in the published contract."><input className={inputCls} value={form.url} onChange={(e) => set({ url: e.target.value })} placeholder="https://recharge.si/feeds/t4a.json" /></Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
              <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

          {/* AI categorization — the feed owns WHICH sets it maintains (it can keep several);
              each Shopify store then picks which one supplies its tags. */}
          {aiExports.length > 0 && (() => {
            const picked = form.aiCategorization.exportIds || [];
            const toggleSet = (id) => {
              const next = picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id];
              // Unticking the last set turns the whole thing off — there'd be nothing to run.
              setAi({ exportIds: next, enabled: next.length > 0 && form.aiCategorization.enabled });
            };
            return (
              <div className="rounded-xl border border-border bg-muted/40 p-4">
                <Toggle
                  checked={form.aiCategorization.enabled}
                  onChange={(v) => setAi({ enabled: v, ...(v && !picked.length ? { exportIds: [aiExports[0]._id] } : {}) })}
                  label="AI categorization"
                  hint="Categorize this feed's products against your category sets. A categorized product is tagged with its AI categories only — the supplier's own tags and category paths are replaced, so your store keeps one consistent taxonomy."
                />
                {form.aiCategorization.enabled && (
                  <div className="mt-3 border-t border-border pt-3">
                    <Field
                      label="Category sets"
                      hint="Pick as many as you need — each is categorized separately, and a store choosing this feed picks which one it tags with. A product the AI hasn't reached yet keeps the supplier's tags until it has a category. Only new or changed products are re-categorized, so a routine re-import costs nothing."
                    >
                      <div className="space-y-1.5">
                        {aiExports.map((x) => {
                          const on = picked.includes(x._id);
                          return (
                            <button
                              key={x._id}
                              type="button"
                              onClick={() => toggleSet(x._id)}
                              aria-pressed={on}
                              className={`flex w-full items-center gap-2.5 rounded-md border px-3 py-2 text-left text-sm transition-colors ${on
 ? "border-accent-brand/40 bg-accent-brand/[0.07] text-foreground"
 :"border bg-background text-muted-foreground hover:text-foreground shadow-xs dark:border-input dark:bg-input/30 dark:hover:bg-input/50"}`}
                            >
                              <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${on ? "border-accent-brand bg-primary" : "border-input"}`}>
                                {on && <svg className="h-3 w-3 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>}
                              </span>
                              <span className="truncate">{x.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </Field>
                    {picked.length === 0 && (
                      <p className="mt-2 text-xs text-amber-fg/90">Pick at least one category set, or turn AI categorization off.</p>
                    )}
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      This feed&apos;s products appear on the{" "}
                      <a href="/categories" className="underline decoration-dotted underline-offset-2 hover:text-foreground">Categories</a>{" "}
                      page under each set you pick, where you can check coverage and correct anything the AI got wrong.
                    </p>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Test */}
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">Test feed</p>
              <Button onClick={runTest} disabled={testing || !form.url}>{testing ? "Testing…" : "Run test"}</Button>
            </div>
            <TestFeedResult result={testResult} />
          </div>
        </div>

        <div className="shrink-0 border-t border-border bg-muted/40">
          {error && (
            <div className="flex items-start gap-2.5 border-b border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-fg-soft sm:px-6">
              <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
              <span>{error}</span>
            </div>
          )}
          <div className="flex justify-end gap-2 px-4 py-3 sm:px-6 sm:py-4">
            <Button onClick={onClose} className="flex-1 py-2.5 sm:flex-none sm:py-1.5">Cancel</Button>
            <Button variant="primary" onClick={save} disabled={saving} className="flex-1 py-2.5 sm:flex-none sm:py-1.5">{saving ? "Saving…" : (isNew ? "Save source" : "Save changes")}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Names of the category sets a feed is categorized against — empty when it's switched off. */
function aiSetNames(source, aiExports) {
  const ai = source.aiCategorization;
  if (!ai?.enabled) return [];
  return (ai.exportIds || []).map((id) => aiExports.find((x) => x._id === id)?.name || "AI categories");
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
    <div className="fixed inset-0 z-[60] flex bg-black/50 sm:items-center sm:justify-center sm:p-4" onClick={onClose}>
      <div className="flex h-full w-full flex-col overflow-hidden border-border bg-background sm:h-auto sm:max-h-[80vh] sm:max-w-2xl sm:rounded-lg sm:border sm:shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3.5 sm:px-6 sm:py-4">
          <h2 className="mb-0 truncate text-[15px] font-semibold leading-tight text-foreground">{source.brand} — import history</h2>
          <CloseButton onClick={onClose} />
        </div>
        <div className="min-h-0 flex-1 overflow-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
        {!data ? <p className="text-sm text-muted-foreground">Loading…</p> : (data.runs?.length ? (
          <table className="w-full min-w-[32rem] text-sm">
            <thead><tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground"><th className="h-9">Time</th><th>Trigger</th><th>Result</th><th>Changes</th></tr></thead>
            <tbody className="divide-y divide-border">
              {data.runs.map((r) => (
                <tr key={r.id}>
                  <td className="py-2 text-muted-foreground">{r.time ? new Date(r.time).toLocaleString() : "—"}</td>
                  <td className="text-muted-foreground">{r.trigger}</td>
                  <td className={r.result ==="ok"?"text-emerald-fg-soft":"text-amber-fg-soft"}>{r.result}</td>
                  <td className="text-muted-foreground">{r.counts ? `${r.counts.created} created · ${r.counts.updated} updated · ${r.counts.removed} removed` : (r.error?.message || "—")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="text-sm text-muted-foreground">No imports yet.</p>)}
        </div>
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
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="flex w-full max-w-4xl flex-col overflow-hidden border-l border-border bg-background shadow-xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border/80 bg-card px-6 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
              <svg className="h-4 w-4 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-[14px] font-semibold text-foreground">{source.brand} — preview</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {products === null ? "Loading…" : (
                  <>
                    <span className="font-medium text-cyan-fg">{shown.length}</span>
                    {search.trim() ? ` of ${base.length} products` : ` product${base.length !== 1 ? "s" : ""} imported`}
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="flex rounded-lg border border-border bg-muted/80 p-0.5">
              <button onClick={() => setView("grid")} title="Grid view" className={`rounded-md p-1.5 transition-all ${view ==="grid" ? "bg-background text-foreground border shadow-xs dark:border-input dark:bg-input/30 dark:hover:bg-input/50" : "text-muted-foreground hover:text-foreground"}`}>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              </button>
              <button onClick={() => setView("list")} title="List view" className={`rounded-md p-1.5 transition-all ${view ==="list" ? "bg-background text-foreground border shadow-xs dark:border-input dark:bg-input/30 dark:hover:bg-input/50" : "text-muted-foreground hover:text-foreground"}`}>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
              </button>
            </div>
            <button onClick={onClose} className="rounded-md p-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="shrink-0 border-b border-border/60 px-4 py-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search within preview…"
              className="w-full rounded-md border border-input bg-transparent pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground transition-all h-9 dark:bg-input/30 shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-foreground">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4">
          {products === null ? (
            <div className="flex h-64 flex-col items-center justify-center text-muted-foreground/70">
              <svg className="mb-3 h-7 w-7 animate-spin text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              <p className="text-sm">Loading products…</p>
            </div>
          ) : shown.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center text-muted-foreground/70">
              <PlaceholderImg className="mb-3 h-12 w-12 opacity-40" />
              <p className="text-sm font-medium">
                {failed ? "Couldn't load products" : search ? "No products match your search" : "No products imported yet"}
              </p>
              {!failed && !search && <p className="mt-1 max-w-xs text-xs text-muted-foreground/70">Run an import (or Test the feed) and the products it would push will appear here.</p>}
            </div>
          ) : view === "grid" ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {shown.map((product) => {
                const img = imageOf(product);
                const variants = product.child_products || [];
                const minPrice = minPriceOf(product);
                const hasStock = variants.some((v) => v.stock_amount > 0) || product.stock_amount > 0;
                return (
                  <div key={product._id || product.externalId} role="button" tabIndex={0} onClick={() => setDetail(product)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setDetail(product); } }} className="group cursor-pointer overflow-hidden rounded-xl border border-border/60 bg-card transition-all hover:border-accent-brand/40 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-brand/50">
                    <div className="relative aspect-square bg-muted">
                      {img ? (
                        <img src={img} alt={product.product_name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center"><PlaceholderImg className="h-10 w-10 text-muted-foreground/40" /></div>
                      )}
                      <div className="absolute right-2 top-2">
                        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${hasStock ? "bg-emerald-500/90 text-white" : "bg-accent/90 text-muted-foreground"}`}>
                          {hasStock ? "● In Stock" : "○ No Stock"}
                        </span>
                      </div>
                    </div>
                    <div className="p-2.5">
                      <p className="mb-1.5 line-clamp-2 text-xs font-semibold leading-snug text-foreground">{product.product_name}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">{variants.length} variant{variants.length !== 1 ? "s" : ""}</span>
                        {minPrice !== null && <span className="text-xs font-semibold text-cyan-fg">€{minPrice.toFixed(2)}</span>}
                      </div>
                      {labelsOf(product).length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {labelsOf(product).map((c) => (
                            <span key={c} className="max-w-[80px] truncate rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{c}</span>
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
                  <div key={product._id || product.externalId} role="button" tabIndex={0} onClick={() => setDetail(product)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setDetail(product); } }} className="group flex cursor-pointer items-center gap-3 rounded-xl border border-border/50 bg-card p-2.5 transition-all hover:border-accent-brand/40 hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-brand/50 shadow-sm">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {img ? (
                        <img src={img} alt={product.product_name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center"><PlaceholderImg className="h-5 w-5 text-muted-foreground/40" /></div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{product.product_name}</p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground/70">{variants.length} var.</span>
                        {minPrice !== null && <span className="text-[11px] font-semibold text-cyan-fg">€{minPrice.toFixed(2)}</span>}
                        {labelsOf(product).map((c) => (
                          <span key={c} className="max-w-[100px] truncate rounded border border-input/40 bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground/70">{c}</span>
                        ))}
                      </div>
                    </div>
                    <div className="shrink-0">
                      <span className={`rounded-lg px-2 py-1 text-[10px] font-semibold ${hasStock ? "border border-emerald-500/20 bg-emerald-500/15 text-emerald-fg" : "border border-input/40 bg-muted text-muted-foreground/70"}`}>
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

export default function OwnSourcesPage({ initialSources, initialAiExports = [] }) {
  const [sources, setSources] = useState(initialSources || []);
  const [editing, setEditing] = useState(null); // null | 'new' | sourceObj
  const [activityFor, setActivityFor] = useState(null);
  const [previewFor, setPreviewFor] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busyFeed, setBusyFeed] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const failed = initialSources === null;

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/nextapi/export/external/sources", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data?.sources)) setSources(data.sources);
    } catch { /* keep current */ }
  }, []);

  const manualRefresh = async () => { setRefreshing(true); await refresh(); setRefreshing(false); };

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

  // Per-source actions as icon buttons — flex-1 (fill) in the mobile cards, auto-width in the desktop table.
  const renderActions = (s) => {
    const busy = busyFeed === s.feedId;
    const cls = "flex-1 px-2 sm:flex-none sm:px-2.5";
    return (
      <>
        <Button onClick={() => setPreviewFor(s)} ariaLabel="Preview" title="Preview" className={cls}>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
        </Button>
        <Button onClick={() => importNow(s)} disabled={busy} ariaLabel="Import now" title="Import now" className={cls}>
          {busy
            ? <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
            : <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 0 1 0 1.971l-11.54 6.348a1.125 1.125 0 0 1-1.667-.985V5.653Z" /></svg>}
        </Button>
        <Button onClick={() => setActivityFor(s)} ariaLabel="Import history" title="Import history" className={cls}>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </Button>
        <Button onClick={() => setEditing(s)} ariaLabel="Edit" title="Edit" className={cls}>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
        </Button>
        <Button variant="danger" onClick={() => remove(s)} ariaLabel="Remove" title="Remove" className={cls}>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
        </Button>
      </>
    );
  };

  return (
    <div>
      {/* Compact header — small icon + title + badge on one line, actions on the right */}
      <PageHeader
        title="Own sources"
        badge={<span className={countPill}>Feeds</span>}
        description="Register your own brand feeds and push them to your Shopify store, alongside Patrik."
        right={
          <button type="button" onClick={() => setHelpOpen(true)} aria-label="Open guide" className={cn(btn.base, btn.variant.outline, btn.size.sm)}>
            <HelpCircle className="text-muted-foreground" />
            Guide
          </button>
        }
      />
      <div className="flex-1 p-4 md:p-8">

      {notice && (
        <div className={`mb-4 rounded-lg border px-4 py-2.5 text-sm ${notice.tone ==="success" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-fg-softer" : "border-red-500/30 bg-red-500/10 text-red-fg-softer"}`}>
          {notice.text}
        </div>
      )}

      {failed && <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-fg-softer">Could not load your feeds — showing none. Refresh to retry.</div>}

      {sources.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-input bg-muted/40 px-6 py-16 text-center">
          <p className="text-foreground">No feeds yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">Add a supplier feed to push another brand to your store. The feed must conform to the published JSON contract.</p>
          <div className="mt-5"><Button variant="primary" onClick={() => setEditing("new")}>+ Add your first source</Button></div>
        </div>
      ) : (
        <>
          {/* Toolbar — section title + refresh + add, like the Export "Saved exports" bar */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-[15px] font-semibold text-foreground">Your feeds</h2>
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <Button onClick={manualRefresh} disabled={refreshing} className="flex-1 py-2 sm:flex-none sm:py-1.5">
                <svg className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                Refresh
              </Button>
              <Button variant="primary" onClick={() => setEditing("new")} className="flex-1 py-2 sm:flex-none sm:py-1.5">+ Add source</Button>
            </div>
          </div>

          {/* Mobile: one card per source */}
          <div className="space-y-3 sm:hidden">
            {sources.map((s) => {
              const c = s.health?.counts;
              return (
                <div key={s.feedId} className="rounded-2xl border border-border bg-muted/40 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-medium text-foreground">{s.brand}</p>
                    <HealthPill source={s} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    <span>{c && s.health?.lastImportAt ? `${c.products} products · ${c.variants} variants` : "Not imported yet"}</span>
                    <span className="text-muted-foreground/70">· {describeSchedule(s.schedule || {})}</span>
                    {aiSetNames(s, initialAiExports).map((n) => (
                      <span key={n} className="inline-flex items-center rounded-md bg-accent-brand/10 px-1.5 py-0.5 font-medium text-accent-brand ring-1 ring-accent-brand/25">
                        AI · {n}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 border-t border-border pt-3">
                    {renderActions(s)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: table */}
          <div className="hidden overflow-hidden rounded-2xl border border-border sm:block">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-card text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 h-9">Brand</th><th>Feed</th><th>Health</th><th>Last import</th><th>Schedule</th><th>AI categories</th><th className="text-right px-4 h-9">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {sources.map((s) => {
                  const c = s.health?.counts;
                  return (
                    <tr key={s.feedId} className="bg-muted/40">
                      <td className="px-4 py-3 font-medium text-foreground">{s.brand}</td>
                      <td className="max-w-[180px] truncate text-muted-foreground" title={s.feed?.url}>{s.feed?.url}</td>
                      <td><HealthPill source={s} /></td>
                      <td className="text-muted-foreground">{c && s.health?.lastImportAt ? `${c.products} products · ${c.variants} variants` : "—"}</td>
                      <td className="text-muted-foreground text-xs">{describeSchedule(s.schedule || {})}</td>
                      <td className="text-xs">
                        {(() => {
                          const names = aiSetNames(s, initialAiExports);
                          if (!names.length) return <span className="text-muted-foreground/70">Off</span>;
                          return (
                            <div className="flex flex-wrap gap-1">
                              {names.map((n) => (
                                <span key={n} className="inline-flex items-center rounded-md bg-accent-brand/10 px-2 py-0.5 font-medium text-accent-brand ring-1 ring-accent-brand/25">{n}</span>
                              ))}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          {renderActions(s)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {editing && (
        <AddEditSource
          source={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refresh(); }}
          onNotice={setNotice}
          onHelp={() => setHelpOpen(true)}
          aiExports={initialAiExports}
        />
      )}
      {activityFor && <SourceActivity source={activityFor} onClose={() => setActivityFor(null)} />}
      {previewFor && <SourcePreview source={previewFor} onClose={() => setPreviewFor(null)} />}
      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
        </div>
    </div>
  );
}
