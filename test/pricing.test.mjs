import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import * as rounding from "../src/lib/priceRounding.js";
import * as compare from "../src/lib/comparePrice.js";

const on = (rule) => ({ enabled: true, alwaysAdvance: false, ...rule });

test("price rounding: the documented examples", () => {
  assert.equal(rounding.applyPriceRounding(2031.99, on({ mode: "up", step: 10, offset: 9 })), 2039);
  assert.equal(rounding.applyPriceRounding(2039.8, on({ mode: "up", step: 1, offset: 0.99 })), 2039.99);
  assert.equal(rounding.applyPriceRounding(12, on({ mode: "nearest", step: 5, offset: 0 })), 10);
  assert.equal(rounding.applyPriceRounding(12.5, on({ mode: "nearest", step: 5, offset: 0 })), 15);
  assert.equal(rounding.applyPriceRounding(12.01, on({ mode: "up", step: 1, offset: 0 })), 13);
});

test("price rounding never changes a price when disabled, and never rounds to zero", () => {
  assert.equal(rounding.applyPriceRounding(12.34, { enabled: false, mode: "up", step: 10, offset: 9 }), 12.34);
  assert.equal(rounding.applyPriceRounding(3, on({ mode: "down", step: 10, offset: 0 })), 3);
  assert.equal(rounding.applyPriceRounding(0, on({ mode: "up", step: 10, offset: 9 })), 0);
});

test("compare-at normalizers fall back to the defaults", () => {
  assert.equal(compare.normalizePriceFields("nonsense"), compare.DEFAULT_PRICE_FIELDS);
  assert.equal(compare.normalizeExistingSalePolicy(undefined), "overwrite");
  assert.equal(compare.normalizeCompareAtPricelist("  "), null);
  assert.equal(compare.normalizeCompareAtPricelist(" RRP 2026 "), "RRP 2026");
});

// src/lib/priceRounding.js and comparePrice.js are literal ports of the API's
// normalizers. When the API repo is checked out next to this one
// (../t4a-partner-portal-api), check both sides give the same answers.
const API = new URL("../../t4a-partner-portal-api/src/services/shopify/", import.meta.url);
const haveApi = existsSync(new URL("priceRounding.util.js", API));

test("parity with the API's price rounding and compare-at rules", { skip: !haveApi && "API repo not checked out next to this one" }, () => {
  const require = createRequire(import.meta.url);
  const apiRounding = require(new URL("priceRounding.util.js", API).pathname);
  const apiCompare = require(new URL("comparePrice.util.js", API).pathname);

  const rules = [
    undefined, null, {}, { enabled: true }, { enabled: "yes", mode: "sideways", step: -3, offset: 99 },
    on({ mode: "up", step: 10, offset: 9 }), on({ mode: "up", step: 1, offset: 0.99 }),
    on({ mode: "down", step: 5, offset: 0, alwaysAdvance: true }), on({ mode: "nearest", step: 0.05, offset: 0 }),
    on({ mode: "up", step: 5000, offset: 0.001 }),
  ];
  const amounts = [0.01, 1, 9, 9.99, 10, 12.5, 99.95, 2031.99, 2039, 123456.78];
  for (const rule of rules) {
    assert.deepEqual(rounding.normalizePriceRounding(rule), { ...apiRounding.normalizePriceRounding(rule) }, JSON.stringify(rule));
    for (const a of amounts) {
      assert.equal(rounding.applyPriceRounding(a, rule), apiRounding.applyPriceRounding(a, rule), `${a} ${JSON.stringify(rule)}`);
    }
  }
  for (const v of [undefined, "", "price_only", "compare_at_only", "price_and_compare_at", "bogus"]) {
    assert.equal(compare.normalizePriceFields(v), apiCompare.normalizePriceFields(v));
  }
  for (const v of [undefined, "overwrite", "leave", "price_only", "compare_at_only", "bogus"]) {
    assert.equal(compare.normalizeExistingSalePolicy(v), apiCompare.normalizeExistingSalePolicy(v));
  }
  for (const v of [undefined, 3, "", "  x ", "RRP 2026"]) {
    assert.equal(compare.normalizeCompareAtPricelist(v), apiCompare.normalizeCompareAtPricelist(v));
  }
});
