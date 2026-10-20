import test from "node:test"; import assert from "node:assert/strict";
import { checkAnswer, nextSelection } from "../js/logic/answer.js"; import { parseFen } from "../js/chess/board.js";
const { board } = parseFen("4k3/8/8/4q3/8/5N2/8/6K1 w - - 0 1");
test("tap-hanging exact set any order", () => { const pz = { kind: "tap-hanging", accept: ["d5", "e5"] };
  assert.equal(checkAnswer(pz, { squares: ["e5", "d5"] }), true); assert.equal(checkAnswer(pz, { squares: ["e5"] }), false);
  assert.equal(checkAnswer(pz, { squares: ["e5", "d5", "a1"] }), false); });
test("move kinds", () => { const pz = { kind: "take-free", accept: ["f3e5"] };
  assert.equal(checkAnswer(pz, { uci: "f3e5" }), true); assert.equal(checkAnswer(pz, { uci: "f3d4" }), false);
  assert.equal(checkAnswer(pz, {}), false); });
test("stray taps never form a move", () => {
  assert.deepEqual(nextSelection(null, "a4", board, "w"), { sel: null, move: null });
  assert.deepEqual(nextSelection(null, "e5", board, "w"), { sel: null, move: null });
  assert.deepEqual(nextSelection("f3", "f3", board, "w"), { sel: null, move: null });
});
test("select, reselect, move", () => {
  assert.deepEqual(nextSelection(null, "f3", board, "w"), { sel: "f3", move: null });
  assert.deepEqual(nextSelection("f3", "g1", board, "w"), { sel: "g1", move: null });
  assert.deepEqual(nextSelection("f3", "e5", board, "w"), { sel: null, move: "f3e5" }); });
