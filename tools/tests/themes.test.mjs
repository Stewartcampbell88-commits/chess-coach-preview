import test from "node:test"; import assert from "node:assert/strict";
import { isFork, isDoubleAttack, targetsOf } from "../themes.mjs";

test("knight fork of king and rook", () => {
  assert.equal(isFork("r3k3/8/8/1N6/8/8/PP6/4K3 w - - 0 1", "b5c7", "n"), true);
  assert.equal(isFork("r3k3/8/8/1N6/8/8/PP6/4K3 w - - 0 1", "b5c7", "q"), false);
  assert.equal(isFork("r3k3/8/8/1N6/8/8/PP6/4K3 w - - 0 1", "b5d6"), false);
  assert.deepEqual(targetsOf("r3k3/2N5/8/8/8/8/PP6/4K3 b - - 1 1", "c7"), ["a8", "e8"]);
});
test("Black knight fork on a flipped board", () =>
  assert.equal(isFork("4k3/pp3ppp/8/8/1n6/8/5PPP/R3K3 b - - 0 1", "b4c2", "n"), true));
test("double attack needs two new targets", () => {
  assert.equal(isDoubleAttack("r3k3/8/8/1N6/8/8/PP6/4K3 w - - 0 1", "b5c7"), true);
  assert.equal(isDoubleAttack("r3k3/8/8/1N6/8/8/PP6/4K3 w - - 0 1", "a2a3"), false);
});
