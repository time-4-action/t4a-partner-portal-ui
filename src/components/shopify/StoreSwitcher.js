"use client";

/**
 * StoreSwitcher — the row of connected stores at the top of the integration page.
 *
 * One compact pill per store (initial · name · status), the selected one outlined, plus an
 * "Add store" pill at the end. Scrolls horizontally when there are many stores, so it never
 * grows into a wall of cards. Rendered as a tablist so arrow keys move between stores.
 */

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dot, connKey, storeName, storeStatus } from "./shared";

export default function StoreSwitcher({ connections, selectedKey, adding, onSelect, onAdd }) {
  const onKey = (e, idx) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = (idx + (e.key === "ArrowRight" ? 1 : -1) + connections.length) % connections.length;
    onSelect(connKey(connections[next]));
    e.currentTarget.parentElement?.querySelectorAll("[role=tab]")[next]?.focus();
  };

  return (
    <nav aria-label="Connected stores" className="mb-4">
      <div role="tablist" className="flex items-stretch gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {connections.map((c, idx) => {
          const key = connKey(c);
          const active = key === selectedKey && !adding;
          const st = storeStatus(c);
          const name = storeName(c);
          return (
            <button
              key={key}
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onClick={() => onSelect(key)}
              onKeyDown={(e) => onKey(e, idx)}
              title={c.shopDomain}
              className={cn(
                "flex min-w-[9.5rem] max-w-[14rem] shrink-0 items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                active ? "border-foreground/30 bg-card shadow-xs" : "border-border bg-card/60 hover:bg-accent"
              )}
            >
              <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-md text-sm font-semibold", active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                {name.charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-medium leading-tight text-foreground">{name}</span>
                <span className="mt-0.5 flex items-center gap-1.5 text-[11px] leading-tight text-muted-foreground">
                  <Dot tone={st.tone} pulse={st.key === "syncing"} />
                  {st.label}
                </span>
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={onAdd}
          aria-pressed={adding}
          className={cn(
            "flex shrink-0 items-center gap-2 rounded-lg border border-dashed px-2.5 py-2 text-[13px] font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
            adding ? "border-foreground/30 bg-card text-foreground shadow-xs" : "border-input text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted"><Plus className="size-4" /></span>
          <span className="pr-1 whitespace-nowrap">Add store</span>
        </button>
      </div>
    </nav>
  );
}
