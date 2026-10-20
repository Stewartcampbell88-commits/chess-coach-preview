import test from "node:test"; import assert from "node:assert/strict";
import { Chess } from "chess.js";
import { mateTree, mateLength } from "../mate.mjs";
import { isBackRankMate } from "../themes.mjs";

const J = JSON.stringify;
test("mate in 1, White and Black", () => {
  assert.equal(J(mateTree("6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1", 1)), J({ d1d8: null }));
  assert.equal(J(mateTree("3r2k1/5ppp/8/8/8/8/5PPP/6K1 b - - 0 1", 1)), J({ d8d1: null }));
});
test("every mating move is accepted", () =>
  assert.equal(J(mateTree("6k1/5ppp/8/8/8/8/5PPP/3RR1K1 w - - 0 1", 1)), J({ d1d8: null, e1e8: null })));
test("mate in 2 with the forced reply", () => {
  const fen = "r5k1/5ppp/8/8/8/8/1Q3PPP/1R4K1 w - - 0 1";
  assert.equal(mateLength(fen, 2), 2);
  assert.equal(J(mateTree(fen, 2)), J({ b2b8: { reply: "a8b8", next: { b1b8: null } } }));
});
test("a mate-in-1 position is not mate in 2", () => assert.equal(mateLength("6k1/5ppp/8/8/8/8/5PPP/3RR1K1 w - - 0 1", 2), 1));
test("no mate at all", () => assert.equal(mateLength("4k3/8/8/8/8/8/8/4K3 w - - 0 1", 2), 0));
test("back-rank detector", () => {
  const c = new Chess("6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1"); c.move("Rd8#");
  assert.equal(isBackRankMate(c.fen()), true);
  assert.equal(isBackRankMate("6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1"), false);
});
