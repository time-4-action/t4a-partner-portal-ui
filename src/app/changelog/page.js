/**
 * Changelog — PUBLIC page (no Auth0 session required).
 *
 * Lives outside the (protected) route group on purpose (like /privacy and /contact):
 * src/proxy.js only forces a login redirect for PROTECTED_PREFIXES, so /changelog is
 * reachable logged-out. It is the human-facing view of the unified release history for
 * BOTH repos (api + ui).
 *
 * All content comes from src/lib/changelog.js — the single source of truth. To add a
 * release, edit that file, mirror CHANGELOG.md, and push the matching git tag. See
 * docs/RELEASING.md. Do NOT hand-edit release data into this component.
 */

import {
  RELEASES,
  REPO_URLS,
  CHANGELOG_STATS,
  formatReleaseDate,
} from "@/lib/changelog";

export const metadata = {
  title: "Changelog | Patrik Partner Portal",
  description:
    "Every version of the Time 4 Action Partner Portal and API — from the first commit to today.",
};

/* ─── Icons (Heroicons v2, stroked to match the rest of the portal) ───────── */

function HistoryIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function TagIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
    </svg>
  );
}

function RocketIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.63 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"
      />
    </svg>
  );
}

function CalendarIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
      />
    </svg>
  );
}

function StackIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-.98.626-1.813 1.5-2.122"
      />
    </svg>
  );
}

function PlusIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function RefreshIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.023 9.348h4.992V4.356M3.75 9h4.992m11.023 6.652h-4.992v4.992M20.25 15a8.25 8.25 0 01-14.4 3.348M3.75 15a8.25 8.25 0 0114.4-3.348"
      />
    </svg>
  );
}

function WrenchIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"
      />
    </svg>
  );
}

/* ─── Badge / label helpers ──────────────────────────────────────────────── */

const TIER_STYLES = {
  GA: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  Stable: "border-[#01a0be]/25 bg-[#01a0be]/10 text-[#01a0be]",
  Beta: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
};

const SCOPE_STYLES = {
  api: "border-violet-400/25 bg-violet-400/10 text-violet-300",
  ui: "border-[#01a0be]/25 bg-[#01a0be]/10 text-[#01a0be]",
};

const SCOPE_LABELS = { api: "API", ui: "Portal" };

/** Category rendering config — label, icon, and its accent colour. */
const CATEGORIES = [
  { key: "added", label: "Added", icon: PlusIcon, dot: "bg-emerald-400", text: "text-emerald-300", ring: "border-emerald-400/25 bg-emerald-400/10" },
  { key: "changed", label: "Changed", icon: RefreshIcon, dot: "bg-[#01a0be]", text: "text-[#01a0be]", ring: "border-[#01a0be]/25 bg-[#01a0be]/10" },
  { key: "fixed", label: "Fixed", icon: WrenchIcon, dot: "bg-amber-400", text: "text-amber-300", ring: "border-amber-400/25 bg-amber-400/10" },
];

function Pill({ className, children }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-widest ${className}`}
    >
      {children}
    </span>
  );
}

/* ─── Stat card (matches the /privacy "at a glance" tiles) ────────────────── */

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 backdrop-blur-sm transition-colors hover:border-[#01a0be]/40">
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#01a0be]/10 blur-2xl opacity-0 transition-opacity group-hover:opacity-100"
        aria-hidden="true"
      />
      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#01a0be]/25 bg-[#01a0be]/10">
        <Icon className="h-4.5 w-4.5 text-[#01a0be]" />
      </div>
      <p
        className="mt-3 text-lg font-bold text-white"
        style={{ fontFamily: "var(--font-orbitron)" }}
      >
        {value}
      </p>
      <p className="mt-0.5 text-xs text-neutral-500">{label}</p>
    </div>
  );
}

/* ─── One category block within a release (Added / Changed / Fixed) ──────── */

function ChangeGroup({ config, items }) {
  if (!items || items.length === 0) return null;
  const { label, icon: Icon, dot, text, ring } = config;
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className={`flex h-5 w-5 items-center justify-center rounded-md border ${ring}`}>
          <Icon className={`h-3 w-3 ${text}`} />
        </span>
        <span className={`text-xs font-semibold uppercase tracking-wider ${text}`}>{label}</span>
      </div>
      <ul className="space-y-2 pl-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-neutral-400">
            <span className={`mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─── A single release on the timeline ───────────────────────────────────── */

function Release({ release }) {
  const { version, date, title, tagline, tier, scope, commits, latest } = release;
  return (
    <article className="relative pl-0 sm:pl-16">
      {/* Timeline node (desktop) */}
      <span
        aria-hidden="true"
        className={`absolute left-5 top-6 hidden h-4 w-4 -translate-x-1/2 rounded-full border-2 sm:block ${
          latest
            ? "border-[#01a0be] bg-[#01a0be] shadow-[0_0_0_4px_rgba(1,160,190,0.15)]"
            : "border-neutral-700 bg-neutral-950"
        }`}
      />

      <div
        className={`overflow-hidden rounded-2xl border bg-neutral-900/60 backdrop-blur-sm transition-colors ${
          latest ? "border-[#01a0be]/40" : "border-neutral-800 hover:border-neutral-700"
        }`}
      >
        {/* Header strip */}
        <div className="flex flex-col gap-3 border-b border-neutral-800/80 p-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2
                className="text-2xl font-bold tracking-tight text-white"
                style={{ fontFamily: "var(--font-orbitron)" }}
              >
                v{version}
              </h2>
              {latest && (
                <Pill className="border-[#01a0be]/40 bg-[#01a0be]/15 text-[#01a0be]">Latest</Pill>
              )}
              <Pill className={TIER_STYLES[tier] || TIER_STYLES.Stable}>{tier}</Pill>
            </div>
            <p className="mt-2 text-base font-semibold text-white">{title}</p>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-neutral-400">{tagline}</p>
          </div>

          <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
            <span className="inline-flex items-center gap-1.5 text-xs text-neutral-500">
              <CalendarIcon className="h-3.5 w-3.5" />
              {formatReleaseDate(date)}
            </span>
            <div className="flex flex-wrap gap-1.5 sm:justify-end">
              {scope.map((s) => (
                <a
                  key={s}
                  href={commits[s] ? `${REPO_URLS[s]}/commit/${commits[s]}` : REPO_URLS[s]}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={commits[s] ? `${SCOPE_LABELS[s]} · commit ${commits[s]}` : SCOPE_LABELS[s]}
                  className={`transition-opacity hover:opacity-80 ${SCOPE_STYLES[s]} inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-widest`}
                >
                  {SCOPE_LABELS[s]}
                  {commits[s] && (
                    <span className="font-mono lowercase tracking-normal opacity-70">
                      {commits[s]}
                    </span>
                  )}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Change groups */}
        <div className="grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((cfg) => (
            <ChangeGroup key={cfg.key} config={cfg} items={release[cfg.key]} />
          ))}
        </div>
      </div>
    </article>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function ChangelogPage() {
  return (
    <div className="relative bg-transparent py-8">
      <div className="relative mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        {/* ----------------------------- Header ----------------------------- */}
        <header className="mb-6 flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#01a0be]/30 bg-[#01a0be]/10">
            <HistoryIcon className="h-5 w-5 text-[#01a0be]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">Changelog</h1>
              <span className="inline-flex items-center rounded-full border border-[#01a0be]/25 bg-[#01a0be]/10 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-widest text-[#01a0be]">
                Releases
              </span>
            </div>
            <p className="truncate text-xs text-neutral-500">
              Every version of the Time 4 Action Partner Portal &amp; API — from the first commit to
              today.
            </p>
          </div>
        </header>

        {/* --------------------------- At a glance --------------------------- */}
        <div className="mb-8 grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard icon={RocketIcon} label="Current version" value={`v${CHANGELOG_STATS.currentVersion}`} />
          <StatCard icon={TagIcon} label="Releases shipped" value={CHANGELOG_STATS.totalReleases} />
          <StatCard
            icon={CalendarIcon}
            label="First shipped"
            value={formatReleaseDate(CHANGELOG_STATS.firstReleaseDate)}
          />
          <StatCard icon={StackIcon} label="Repositories" value="API + Portal" />
        </div>

        {/* ---------------------------- Timeline ---------------------------- */}
        <div className="relative">
          {/* Vertical rail (desktop) */}
          <div
            aria-hidden="true"
            className="absolute left-5 top-2 bottom-2 hidden w-px bg-gradient-to-b from-[#01a0be]/40 via-neutral-800 to-transparent sm:block"
          />
          <div className="space-y-6">
            {RELEASES.map((release) => (
              <Release key={release.version} release={release} />
            ))}
          </div>
        </div>

        {/* ----------------------------- Footer ----------------------------- */}
        <footer className="mt-10 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 text-sm leading-relaxed text-neutral-500 backdrop-blur-sm">
          <p>
            Each release above is an annotated git tag (
            <code className="rounded bg-neutral-800/80 px-1 py-0.5 text-xs text-neutral-300">
              vX.Y.Z
            </code>
            ) pushed to the{" "}
            <a
              href={REPO_URLS.api}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#01a0be] hover:underline"
            >
              API
            </a>{" "}
            and{" "}
            <a
              href={REPO_URLS.ui}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#01a0be] hover:underline"
            >
              Portal
            </a>{" "}
            repositories. Versioning follows{" "}
            <a
              href="https://semver.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#01a0be] hover:underline"
            >
              Semantic Versioning
            </a>
            ; entries follow the{" "}
            <a
              href="https://keepachangelog.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#01a0be] hover:underline"
            >
              Keep a Changelog
            </a>{" "}
            format.
          </p>
        </footer>
      </div>
    </div>
  );
}
