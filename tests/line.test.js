import test from "node:test"; import assert from "node:assert/strict";
import { lineStart, lineStep, lineKeys, lineMainline, treeStats } from "../js/logic/line.js";

const tree = { b5c7: { reply: "e8d7", next: { c7a8: null } } };
const pz = { kind: "line", tree };

test("follows the tree to solved", () => {
  let r = lineStep(lineStart(pz), "b5c7");
  assert.equal(r.result, "continue"); assert.equal(r.reply, "e8d7");
  r = lineStep(r.state, "c7a8");
  assert.equal(r.result, "solved");
  assert.deepEqual(r.state.plies, ["b5c7", "e8d7", "c7a8"]);
  assert.deepEqual(lineKeys(r.state), []);
});
test("off-tree move is wrong and keeps the state", () => {
  const s = lineStart(pz), r = lineStep(s, "b5d6");
  assert.equal(r.result, "wrong"); assert.equal(r.state, s);
});
test("upper-case input is accepted", () => assert.equal(lineStep(lineStart(pz), "B5C7").result, "continue"));
test("prototype keys are never moves", () => {
  assert.equal(lineStep(lineStart(pz), "__proto__").result, "wrong");
  assert.equal(lineStep(lineStart(pz), "constructor").result, "wrong");
});
test("keys are sorted", () => assert.deepEqual(lineKeys(lineStart({ tree: { e1e8: null, d1d8: null } })), ["d1d8", "e1e8"]));
test("mainline takes the first sorted key", () => assert.deepEqual(lineMainline(tree), ["b5c7", "e8d7", "c7a8"]));
test("treeStats", () => {
  assert.deepEqual(treeStats(tree), { keys: 2, depth: 2, maxBranch: 1 });
  assert.deepEqual(treeStats({ d1d8: null, e1e8: null }), { keys: 2, depth: 1, maxBranch: 2 });
  assert.deepEqual(treeStats(null), { keys: 0, depth: 0, maxBranch: 0 });
});
