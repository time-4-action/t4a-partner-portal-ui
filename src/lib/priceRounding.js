/**
 * Price rounding — the shelf-price rule a Shopify source snaps every pushed price to.
 *
 * This is a LITERAL PORT of `src/services/shopify/priceRounding.util.js` in the API repo: same
 * rails, same clamps, same key order. It has to be, because `saveConfig` marks the form clean
 * optimistically (it stores the local object, not the server's echo) — if this file and the API's
 * disagreed, the portal would look saved and then show different numbers after a reload. Change
 * one, change the other in the same sitting.
 *
 * The rule itself, in one line:
 *
 *     result = (the multiple of `step` nearest to `amount - offset`, per `mode`) + offset
 *
 * with `offset` the ending to land on, always inside `[0, step)`. "Always end in 9" is
 * `{ mode:'up', step:10, offset:9 }`; "end in .99" is `{ mode:'up', step:1, offset:0.99 }`.
 */

/** The rounding directions. Anything else disables the rule rather than picking one. */
export const ROUNDING_MODES = ["up", "down", "nearest"];

/** Largest accepted `step` — and therefore the furthest a valid rule can ever move a price. */
export const PRICE_ROUNDING_STEP_MAX = 1000;

/** Smallest accepted `step` — one cent, the finest grid Shopify can store. */
export const PRICE_ROUNDING_STEP_MIN = 0.01;

/** Off, carrying the numbers a partner is most likely to want when they switch it on. */
export const DEFAULT_PRICE_ROUNDING = { enabled: false, mode: "up", step: 10, offset: 9, alwaysAdvance: false };

/** The step values offered in the picker — every realistic rule uses one of these. */
export const STEP_OPTIONS = [0.01, 0.05, 0.1, 0.5, 1, 5, 10, 50, 100];

/**
 * Money as an exact integer number of cents — the only arithmetic this file does.
 * No `x / step` anywhere: the amount is `price × factor` and can arrive as 2039.0000000000002,
 * which one float division turns into a spurious whole-step jump.
 */
const cents = (x) => Math.round(Number((x * 100).toPrecision(12)));

/** Parses a stored/submitted number, tolerating the locale-style comma decimal partners type. */
const toNumber = (raw) => {
  if (raw === null || raw === undefined || raw === "") return NaN;
  return typeof raw === "string" ? Number(raw.trim().replace(",", ".")) : Number(raw);
};

/**
 * Coerces any rule into a complete one with the keys in a FIXED ORDER — the unsaved-changes check
 * is a `JSON.stringify` comparison, so a shuffled key order would show a clean form as dirty.
 * A rule that doesn't make sense is disabled rather than repaired.
 */
export function normalizePriceRounding(raw) {
  const off = { ...DEFAULT_PRICE_ROUNDING };
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return off;
  if (raw.enabled !== true) {
    // Keep the configured numbers so flipping the toggle back on restores the partner's rule.
    const kept = normalizePriceRounding({ ...raw, enabled: true });
    return { ...kept, enabled: false };
  }

  const mode = ROUNDING_MODES.includes(raw.mode) ? raw.mode : null;
  if (!mode) return off;

  const step = toNumber(raw.step);
  if (!Number.isFinite(step) || step < PRICE_ROUNDING_STEP_MIN || step > PRICE_ROUNDING_STEP_MAX) return off;
  const stepCents = cents(step);
  if (stepCents < 1) return off;

  // An offset at or beyond the step is the same rule stated the long way — fold it in.
  const rawOffset = toNumber(raw.offset);
  const offsetCents =
    Number.isFinite(rawOffset) && rawOffset >= 0 ? ((cents(rawOffset) % stepCents) + stepCents) % stepCents : 0;

  return {
    enabled: true,
    mode,
    step: stepCents / 100,
    offset: offsetCents / 100,
    alwaysAdvance: mode === "nearest" ? false : raw.alwaysAdvance === true,
  };
}

/**
 * Snaps an amount to the rule's grid. Returns a NUMBER, and is the identity for a disabled rule or
 * for anything it can't safely improve — so it's called unconditionally, with no branch.
 */
export function applyPriceRounding(amount, rule) {
  if (!Number.isFinite(amount) || amount <= 0) return amount;
  const r = normalizePriceRounding(rule);
  if (!r.enabled) return amount;

  const s = cents(r.step);
  const o = cents(r.offset);
  const d = cents(amount) - o;
  // `d` goes negative for a cheap price under a coarse rule, so take the modulo the long way —
  // JS `%` keeps the sign of the dividend.
  const rem = ((d % s) + s) % s;
  const base = d - rem;

  let out;
  if (r.mode === "up") out = r.alwaysAdvance ? base + s : rem === 0 ? base : base + s;
  else if (r.mode === "down") out = r.alwaysAdvance && rem === 0 ? base - s : base;
  else out = rem * 2 >= s ? base + s : base; // nearest, half-up

  const result = (out + o) / 100;
  // A `down` rule can take a cheap price to zero. Publishing a 0 price is worse than not rounding.
  return Number.isFinite(result) && result > 0 ? result : amount;
}

/** The ending a rule lands on, as the partner reads it: 9 → "…9", 0.99 → "….99", 0 → null. */
export function roundingEndingLabel(rule) {
  const r = normalizePriceRounding(rule);
  return r.offset > 0 ? `…${String(r.offset).replace(/^0/, "")}` : null;
}

/** One-line summary for the source list and the pricing panel — "rounds up to …9", "off". */
export function describePriceRounding(rule) {
  const r = normalizePriceRounding(rule);
  if (!r.enabled) return "off";
  const ending = roundingEndingLabel(r);
  if (r.mode === "nearest") return `rounds to nearest ${r.step}${ending ? ` (${ending})` : ""}`;
  const dir = r.mode === "up" ? "up" : "down";
  const always = r.alwaysAdvance ? ", always" : "";
  return ending ? `rounds ${dir} to ${ending}${always}` : `rounds ${dir} to ${r.step === 1 ? "whole" : r.step}${always}`;
}

/**
 * The named rules the picker offers. `alwaysAdvance` is deliberately NOT part of any preset — it's
 * a separate checkbox, because it raises prices that already sit on the ending and a partner should
 * opt into that explicitly rather than inherit it from a preset name.
 */
export const ROUNDING_PRESETS = [
  { id: "whole_up", label: "Whole number, up", rule: { mode: "up", step: 1, offset: 0 } },
  { id: "nearest_005", label: "Nearest 0.05", rule: { mode: "nearest", step: 0.05, offset: 0 } },
  { id: "nearest_5", label: "Nearest 5", rule: { mode: "nearest", step: 5, offset: 0 } },
  { id: "ends_95", label: "Ends in .95", rule: { mode: "up", step: 1, offset: 0.95 } },
  { id: "ends_99", label: "Ends in .99", rule: { mode: "up", step: 1, offset: 0.99 } },
  { id: "ends_9", label: "Ends in 9", rule: { mode: "up", step: 10, offset: 9 } },
];

/** Which preset a rule matches, or "custom". Ignores `alwaysAdvance` — see {@link ROUNDING_PRESETS}. */
export function matchRoundingPreset(rule) {
  const r = normalizePriceRounding(rule);
  const hit = ROUNDING_PRESETS.find(
    (p) => p.rule.mode === r.mode && p.rule.step === r.step && p.rule.offset === r.offset
  );
  return hit ? hit.id : "custom";
}

/**
 * The offsets worth offering for a given step — every "ends in" the grid can express, capped so a
 * fine step (0.01) doesn't produce a list of a hundred. Beyond the cap the partner is in custom
 * territory anyway and the ending is meaningless.
 */
export function offsetOptionsForStep(step) {
  const s = cents(normalizePriceRounding({ enabled: true, mode: "up", step, offset: 0 }).step);
  if (s <= 1) return [0]; // a one-cent grid has no room for an ending
  // Fine steps list every cent, so a step of 1 can offer .95 / .99. Coarser ones would run to
  // hundreds of entries, so they list whole currency units instead (…9 on a step of 10).
  const grain = s <= 100 ? 1 : 100;
  const out = [];
  for (let c = 0; c < s; c += grain) out.push(c / 100);
  return out.length <= 100 ? out : [0];
}
