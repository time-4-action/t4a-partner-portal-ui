import { test } from "node:test";
import assert from "node:assert/strict";
import { canSeeExport, filterVisibleExports } from "../src/lib/exportAccess.js";

test("an export with no roles and no users is open to everyone", () => {
  assert.equal(canSeeExport({}, [], "auth0|a"), true);
  assert.equal(canSeeExport({ roles: [], users: [] }, ["export"], "auth0|a"), true);
});

test("roles: the user needs one of them", () => {
  const exp = { roles: ["alpha", "partner-x"] };
  assert.equal(canSeeExport(exp, ["export", "partner-x"], "auth0|a"), true);
  assert.equal(canSeeExport(exp, ["export"], "auth0|a"), false);
  assert.equal(canSeeExport(exp, undefined, "auth0|a"), false);
});

test("users: the user's sub must be listed", () => {
  const exp = { users: ["auth0|a"] };
  assert.equal(canSeeExport(exp, [], "auth0|a"), true);
  assert.equal(canSeeExport(exp, [], "auth0|b"), false);
});

test("roles AND users must both pass", () => {
  const exp = { roles: ["partner-x"], users: ["auth0|a"] };
  assert.equal(canSeeExport(exp, ["partner-x"], "auth0|a"), true);
  assert.equal(canSeeExport(exp, ["partner-x"], "auth0|b"), false);
  assert.equal(canSeeExport(exp, [], "auth0|a"), false);
});

test("filterVisibleExports keeps order and tolerates a non-array", () => {
  const all = [{ id: 1 }, { id: 2, roles: ["x"] }, { id: 3, users: ["auth0|a"] }];
  assert.deepEqual(filterVisibleExports(all, [], "auth0|a").map((e) => e.id), [1, 3]);
  assert.deepEqual(filterVisibleExports(null, [], "auth0|a"), []);
});
