import test from "node:test"; import assert from "node:assert/strict";
import { validateLine, treeErrors } from "../line-check.mjs";

const ctx = {};
const base = {
  id: "t", kind: "line", goal: "mate", mateIn: 1, tag: "backrank",
  fen: "6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1",
  prompt: "White to move. Checkmate in one.", explain: "Rd8# — the king is trapped by its own pawns.",
  tree: { d1d8: null },
};
test("a correct mate-in-1 passes", async () => assert.deepEqual(await validateLine(base, ctx), []));
test("wrong side in prompt fails", async () =>
  assert.match((await validateLine({ ...base, prompt: "Black to move. Mate." }, ctx)).join(), /White to move/));
test("explain must name the move", async () =>
  assert.match((await validateLine({ ...base, explain: "Nice." }, ctx)).join(), /explain must mention the first move \(Rd8\)/));
test("tree must match the search", async () =>
  assert.match((await validateLine({ ...base, tree: { d1d7: null } }, ctx)).join(), /tree differs|not legal/));
test("mislabelled mate length fails", async () =>
  assert.match((await validateLine({ ...base, mateIn: 2 }, ctx)).join(), /actually mate in 1/));
test("back-rank tag needs a back-rank finish", async () => {
  const p = { ...base, fen: "6k1/8/6K1/8/8/8/8/3R4 w - - 0 1", explain: "Rd8# — the king has no squares.", tree: { d1d8: null } };
  assert.match((await validateLine(p, ctx)).join(), /backrank/);
});
test("side not to move in check is illegal", async () =>
  assert.match((await validateLine({ ...base, fen: "3R2k1/5ppp/8/8/8/8/5PPP/6K1 w - - 0 1" }, ctx)).join(), /side not to move is in check/));
test("engine goal needs an engine", async () =>
  assert.match((await validateLine({ ...base, goal: "engine", length: 1 }, ctx)).join(), /engine goal needs/));
test("illegal reply is caught", () =>
  assert.match(treeErrors("r5k1/5ppp/8/8/8/8/1Q3PPP/1R4K1 w - - 0 1", { b2b8: { reply: "a8a1", next: { b1b8: null } } }).join(), /reply a8a1 not legal/));
test("castling only in book puzzles", () => {
  assert.match(treeErrors("4k3/8/8/8/8/8/8/4K2R w K - 0 1", { e1g1: null }).join(), /castling not allowed/);
  assert.deepEqual(treeErrors("4k3/8/8/8/8/8/8/4K2R w K - 0 1", { e1g1: null }, { allowCastle: true }), []);
});
test("size limits", () => {
  const deep = { h1h2: { reply: "e8e7", next: { h2h3: { reply: "e7e8", next: { h3h4: { reply: "e8e7", next: { h4h5: null } } } } } } };
  assert.match(treeErrors("4k3/8/8/8/8/8/8/4K2R w - - 0 1", deep).join(), /line too long/);
});
