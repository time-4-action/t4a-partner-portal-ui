/**
 * Compare-at price + existing-sale policy — which of a variant's two Shopify price fields
 * (`price`, `compareAtPrice`) a source owns, and what to do when the store already shows a sale
 * the portal did not put there.
 *
 * This is a LITERAL PORT of `src/services/shopify/comparePrice.util.js` in the API repo (same
 * enums, same defaults, same normalizers). It has to be, because `saveConfig` marks the form
 * clean optimistically — if this file and the API's disagreed, the portal would look saved and
 * then show different settings after a reload. Change one, change the other in the same sitting.
 */

/** Which of the two Shopify price fields a source pushes. Only meaningful with a compare-at list. */
export const PRICE_FIELDS = ["price_and_compare_at", "price_only", "compare_at_only"];

/** What to do with a variant the merchant has put on sale in Shopify themselves. */
export const EXISTING_SALE_POLICIES = ["overwrite", "leave", "price_only", "compare_at_only"];

export const DEFAULT_PRICE_FIELDS = "price_and_compare_at";
export const DEFAULT_EXISTING_SALE_POLICY = "overwrite";

/** Radio copy for the "fields to push" selector. */
export const PRICE_FIELD_OPTIONS = [
  { v: "price_and_compare_at", label: "Price + compare-at", hint: "The portal sets both the selling price and the struck-through “was” price." },
  { v: "price_only", label: "Price only", hint: "Only the selling price is pushed — compare-at in Shopify is left as it is." },
  { v: "compare_at_only", label: "Compare-at only", hint: "Only the “was” price is pushed — the selling price in Shopify is left as it is." },
];

/** Radio copy for the existing-sale policy. */
export const EXISTING_SALE_OPTIONS = [
  { v: "overwrite", label: "Overwrite", hint: "Portal wins — the merchant's sale is replaced by the portal's prices." },
  { v: "leave", label: "Leave it alone", hint: "Skip the variant's pricing entirely while the merchant's sale is on." },
  { v: "price_only", label: "Update price, keep sale", hint: "Push the selling price but leave the merchant's compare-at untouched." },
  { v: "compare_at_only", label: "Update compare-at, keep price", hint: "Push the “was” price but leave the merchant's selling price untouched." },
];

/** A pricelist name, trimmed; anything empty or non-string is "off". */
export function normalizeCompareAtPricelist(raw) {
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  return s ? s : null;
}

/** Unknown value → the default (push both), never a guess at what the partner meant. */
export function normalizePriceFields(raw) {
  return PRICE_FIELDS.includes(raw) ? raw : DEFAULT_PRICE_FIELDS;
}

/** Unknown value → `overwrite`, which is exactly what every existing connection does today. */
export function normalizeExistingSalePolicy(raw) {
  return EXISTING_SALE_POLICIES.includes(raw) ? raw : DEFAULT_EXISTING_SALE_POLICY;
}

/** Short label for a policy, for the source summary line. */
export function describeExistingSalePolicy(raw) {
  const p = normalizeExistingSalePolicy(raw);
  return (EXISTING_SALE_OPTIONS.find((o) => o.v === p) || EXISTING_SALE_OPTIONS[0]).label.toLowerCase();
}
