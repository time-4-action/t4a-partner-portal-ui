"use client";
/**
 * MaintenanceBanner — the maintenance notices every t4a app shows, set from
 * Slack with /maintenance or at maintenance.time-4-action.com/admin
 * (time-4-action/t4a-maintenance).
 *
 * Reads banner.json for this app every minute and shows one strip per
 * maintenance above the page, most urgent first, at most three: amber while
 * planned, red while it runs. Nothing when none is on or the file can't be read.
 */
import { useEffect, useState } from "react";
import { Wrench } from "lucide-react";

const BANNER_URL = "https://maintenance.time-4-action.com/banner.json?app=portal";
const POLL_MS = 60_000;
const MAX_ITEMS = 3;

const TONES = {
  planned: "bg-amber-100 dark:bg-amber-950/50 border-amber-300/60 dark:border-amber-800/60 text-amber-900 dark:text-amber-200",
  now: "bg-red-100 dark:bg-red-950/50 border-red-300/60 dark:border-red-800/60 text-red-900 dark:text-red-200",
};

export default function MaintenanceBanner() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch(BANNER_URL)
        .then((r) => (r.ok ? r.json() : null))
        .then((b) => alive && setItems(Array.isArray(b?.items) ? b.items.filter((i) => i?.text).slice(0, MAX_ITEMS) : []))
        .catch(() => alive && setItems([]));
    load();
    const timer = setInterval(load, POLL_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  if (!items.length) return null;
  return (
    <div role="status">
      {items.map((item) => (
        <div key={item.id} className={`flex items-center gap-2 px-4 md:px-6 py-2 border-b text-[13px] ${TONES[item.level === "planned" ? "planned" : "now"]}`}>
          <Wrench className="w-3.5 h-3.5 shrink-0" />
          <span className="min-w-0">{item.text}</span>
        </div>
      ))}
    </div>
  );
}
