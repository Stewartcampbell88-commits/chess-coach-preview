import test from "node:test"; import assert from "node:assert/strict";
import { hangingSquares, validatePuzzle } from "../see.mjs";
test("undefended queen hangs", () =>
  assert.deepEqual(hangingSquares("4k3/8/8/4q3/8/5N2/8/6K1 w - - 0 1", "b"), ["e5"]));
test("v5 bug: Ne2 does NOT attack e5", () =>
  assert.deepEqual(hangingSquares("4k3/8/8/4q3/8/8/4N3/4K3 w - - 0 1", "b"), []));
test("pawn-defended bishop is not hanging", () =>
  assert.deepEqual(hangingSquares("4k3/8/8/3p4/4b3/2N5/8/4K3 w - - 0 1", "b"), []));
test("two attackers vs one defender: hanging", () =>
  assert.deepEqual(hangingSquares("4k3/8/2n5/4n3/8/3N1N2/8/6K1 w - - 0 1", "b"), ["e5"]));
test("extra pawn defender: not hanging", () =>
  assert.deepEqual(hangingSquares("4k3/8/2n2p2/4n3/8/3N1N2/8/6K1 w - - 0 1", "b"), []));
test("v5 bug: illegal position rejected", () =>
  assert.ok(validatePuzzle({ id:"x", kind:"tap-hanging", tag:"spot", fen:"4k3/8/8/3n4/8/8/4R3/4K3 w - - 0 1",
    accept:["d5"], prompt:"p", explain:"e" }).length > 0));
test("wrong answer key rejected", () =>
  assert.ok(validatePuzzle({ id:"y", kind:"take-free", tag:"free", fen:"4k3/8/8/4q3/8/5N2/8/6K1 w - - 0 1",
    accept:["f3d4"], prompt:"p", explain:"e" }).length > 0));
test("correct take-free accepted", () =>
  assert.deepEqual(validatePuzzle({ id:"z", kind:"take-free", tag:"free", fen:"4k3/8/8/4q3/8/5N2/8/6K1 w - - 0 1",
    accept:["f3e5"], prompt:"p", explain:"e" }), []));
