import test from "node:test"; import assert from "node:assert/strict";
import { parseFen, applyUci, isLightSquare } from "../js/chess/board.js";
const F = "4k3/8/8/4q3/8/5N2/8/6K1 w - - 0 1";
test("parseFen reads pieces and turn", () => {
  const { board, turn } = parseFen(F);
  assert.equal(Object.keys(board).length, 64);
  assert.equal(board.e5, "q"); assert.equal(board.f3, "N"); assert.equal(board.g1, "K");
  assert.equal(board.a1, null); assert.equal(turn, "w");
});
test("parseFen rejects malformed FEN", () => {
  assert.throws(() => parseFen("8/8/8 w - - 0 1"));
  assert.throws(() => parseFen("4k3/8/8/4q3/8/5N2/8/6K w - - 0 1"));
});
test("applyUci moves/captures without mutating", () => {
  const { board } = parseFen(F); const b2 = applyUci(board, "f3e5");
  assert.equal(b2.e5, "N"); assert.equal(b2.f3, null); assert.equal(board.e5, "q");
});
test("applyUci promotes in mover's case", () => {
  const { board } = parseFen("8/4P3/8/8/8/8/k7/4K3 w - - 0 1");
  assert.equal(applyUci(board, "e7e8q").e8, "Q");
});
test("square colours", () => { assert.equal(isLightSquare("a1"), false); assert.equal(isLightSquare("h1"), true); });
