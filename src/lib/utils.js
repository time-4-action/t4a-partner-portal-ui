import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge class names (shadcn `cn`) — same helper as t4a-admin's lib/utils.ts. */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
