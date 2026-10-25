"use client";
/**
 * MaintenanceBanner — the maintenance notice every t4a app shows, set from
 * Slack with /maintenance (time-4-action/t4a-infra, servers/t4a/README.md).
 *
 * Reads banner.json every minute and shows its text as a strip above the page:
 * amber while maintenance is planned, red while it runs. Nothing when no
 * maintenance is on or the file can't be read.
 */
import { useEffect, useState } from "react";
import { Wrench } from "lucide-react";

const BANNER_URL = "https://maintenance.time-4-action.com/banner.json";
const POLL_MS = 60_000;

const TONES = {
  planned: "bg-amber-100 dark:bg-amber-950/50 border-amber-300/60 dark:border-amber-800/60 text-amber-900 dark:text-amber-200",
  now: "bg-red-100 dark:bg-red-950/50 border-red-300/60 dark:border-red-800/60 text-red-900 dark:text-red-200",
};

export default function MaintenanceBanner() {
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch(BANNER_URL)
        .then((r) => (r.ok ? r.json() : null))
        .then((b) => alive && setBanner(b?.active && b.text ? b : null))
        .catch(() => alive && setBanner(null));
    load();
    const timer = setInterval(load, POLL_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  if (!banner) return null;
  return (
    <div role="status" className={`flex items-center gap-2 px-4 md:px-6 py-2 border-b text-[13px] ${TONES[banner.level === "planned" ? "planned" : "now"]}`}>
      <Wrench className="w-3.5 h-3.5 shrink-0" />
      <span className="min-w-0">{banner.text}</span>
    </div>
  );
}
