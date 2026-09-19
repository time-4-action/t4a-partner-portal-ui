import { cn } from "@/lib/utils";
import { countPill } from "@/lib/ui";

/**
 * PageHeader — the sticky h-14 title bar every admin list page uses
 * (`app/partners/page.tsx`, `app/warranty/page.tsx` …): a `font-display`
 * title, an optional count pill / badge next to it, and right-aligned actions.
 * `description` renders as one muted line under the title when given.
 *
 * Pages render it as the first child of their root, followed by the padded
 * content block (`p-4 md:p-8`), so it sticks to the top of the scrolling
 * <main> exactly like the admin.
 */
export default function PageHeader({ title, count, badge, description, right, className }) {
  return (
    <header className={cn("border-b border-border shrink-0 bg-background/80 backdrop-blur-sm sticky top-0 z-10", className)}>
      <div className={cn("flex items-center justify-between gap-3 px-4 md:px-8", description ?"min-h-14 py-2.5":"h-14")}>
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <h1 className="font-display text-lg font-medium tracking-tight text-foreground shrink-0 mb-0">{title}</h1>
              {count != null && <span className={countPill}>{count}</span>}
              {badge}
            </div>
            {description && <p className="text-[12px] text-muted-foreground mt-0.5 truncate">{description}</p>}
          </div>
        </div>
        {right && <div className="flex items-center gap-2 shrink-0">{right}</div>}
      </div>
    </header>
  );
}
