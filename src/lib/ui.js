/**
 * Shared class recipes — the portal twin of t4a-admin's shadcn primitives
 * (components/ui/button.tsx, input.tsx, badge.tsx, card.tsx, dialog.tsx,
 * table.tsx, tooltip.tsx). The class strings are copied from there so any
 * element built with these reads exactly like its admin counterpart.
 *
 * Use with `cn()` from "@/lib/utils":
 *   <button className={cn(btn.base, btn.variant.outline, btn.size.sm)}>…</button>
 */

export const btn = {
  base:
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  variant: {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    destructive:
      "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40",
    outline:
      "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
    link: "text-primary underline-offset-4 hover:underline",
  },
  size: {
    default: "h-9 px-4 py-2 has-[>svg]:px-3",
    xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
    sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
    lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
    icon: "size-9",
    "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
    "icon-sm": "size-8",
    "icon-lg": "size-10",
  },
};

export const input =
  "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40";

export const textarea =
  "w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

export const badge = {
  base: "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:size-3",
  variant: {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    destructive: "bg-destructive text-white dark:bg-destructive/60",
    outline: "border-border text-foreground",
    muted: "bg-muted text-muted-foreground",
  },
};

/** Count pill next to a page title (admin list headers). */
export const countPill = "text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0 tabular-nums";

export const card = "rounded-xl border bg-card text-card-foreground shadow-sm";
export const panel = "rounded-2xl border border-border bg-surface overflow-hidden";

export const dialog = {
  overlay: "fixed inset-0 z-50 bg-black/50",
  content: "relative z-50 grid w-full max-w-[calc(100%-2rem)] gap-4 rounded-lg border bg-background p-6 shadow-lg outline-none sm:max-w-lg",
  title: "text-lg leading-none font-semibold",
  description: "text-sm text-muted-foreground",
  close:
    "absolute top-4 right-4 rounded-xs opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
};

export const popover = "z-50 rounded-md border border-border bg-popover text-popover-foreground p-1 shadow-md";
export const menuItem =
  "relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50";

export const tooltip =
  "z-50 max-w-xs rounded-lg border border-border bg-popover px-3 py-2 text-[11.5px] leading-relaxed text-popover-foreground shadow-md";

export const table = {
  wrap: "relative w-full overflow-x-auto",
  table: "w-full caption-bottom text-sm",
  header: "[&_tr]:border-b",
  body: "[&_tr:last-child]:border-0",
  row: "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
  head: "h-9 px-2 text-left align-middle text-[10px] uppercase tracking-wider font-semibold text-muted-foreground whitespace-nowrap",
  cell: "p-2 align-middle whitespace-nowrap",
};

/** Inline alert boxes (admin partners page). */
export const alert = {
  destructive: "rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-[12px] text-destructive",
  warning:
    "rounded-xl border border-amber-300/50 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-[12px] text-amber-700 dark:text-amber-300 flex items-center gap-2",
};
