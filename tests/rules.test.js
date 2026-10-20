import test from "node:test"; import assert from "node:assert/strict";
import { legalTargets, isLegalMove, hintSquares, hintText } from "../js/chess/rules.js";
import { normaliseUci, playUci, turnOf } from "../js/chess/rules.js";
import { PUZZLES } from "../js/data/puzzles.js";
const F = "4k3/8/8/4q3/8/5N2/8/6K1 w - - 0 1";
test("legal targets split quiet moves and captures", () => {
  assert.deepEqual(legalTargets(F, "f3"), { quiet: ["d2", "d4", "e1", "g5", "h2", "h4"], captures: ["e5"] }); });
test("no targets for empty, opponent or pinned-out squares", () => {
  assert.deepEqual(legalTargets(F, "a1"), { quiet: [], captures: [] });
  assert.deepEqual(legalTargets(F, "e5"), { quiet: [], captures: [] }); });
test("a pinned piece has no targets", () => {
  // white knight e2 pinned by black rook e8 against Ke1
  assert.deepEqual(legalTargets("4r1k1/8/8/8/8/8/4N3/4K3 w - - 0 1", "e2"), { quiet: [], captures: [] }); });
test("bad FEN never throws", () => assert.deepEqual(legalTargets("garbage", "e2"), { quiet: [], captures: [] }));
test("isLegalMove", () => { assert.equal(isLegalMove(F, "f3e5"), true); assert.equal(isLegalMove(F, "f3e4"), false);
  assert.equal(isLegalMove(F, "e5e4"), false); });
test("hint for move puzzles = piece to move", () => {
  assert.deepEqual(hintSquares({ kind: "take-free", fen: F, accept: ["f3e5"] }), ["f3"]);
  assert.deepEqual(hintSquares(PUZZLES.find(p => p.id === "w1-l4-05")), ["h4"]); });
test("hint for tap puzzles = white attacker(s) of a hanging piece, never the answer", () => {
  const p = PUZZLES.find(x => x.id === "w1-l1-01");
  assert.deepEqual(hintSquares(p), ["f3"]); assert.ok(hintSquares(p).every(s => !p.accept.includes(s))); });
test("every puzzle has a non-empty hint and hint text", () => { for (const p of PUZZLES) {
  assert.ok(hintSquares(p).length > 0, p.id); assert.ok(hintText(p).length > 0, p.id); } });
test("normaliseUci: legal LAN, auto-queen, illegal null", () => {
  assert.equal(normaliseUci("8/4P3/8/8/8/8/8/k3K3 w - - 0 1", "e7e8"), "e7e8q");
  assert.equal(normaliseUci("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", "E2E4"), "e2e4");
  assert.equal(normaliseUci("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", "e2e5"), null);
  assert.equal(normaliseUci("bad fen", "e2e4"), null);
});
test("playUci returns SAN, capture flag and the new FEN", () => {
  const r = playUci("4k3/8/8/8/8/8/4q3/4K2R w K - 0 1", "e1e2");
  assert.equal(r.san, "Kxe2"); assert.equal(r.captured, true); assert.equal(turnOf(r.fen), "b");
  const castle = playUci("4k3/8/8/8/8/8/8/4K2R w K - 0 1", "e1g1");
  assert.ok(castle.fen.startsWith("4k3/8/8/8/8/8/8/5RK1 b"));
  assert.equal(playUci("4k3/8/8/8/8/8/8/4K2R w K - 0 1", "e1e3"), null);
});
test("line hints highlight the first key's piece", () => {
  const p = { kind: "line", goal: "mate", tag: "m2", tree: { b2b8: { reply: "a8b8", next: { b1b8: null } } } };
  assert.deepEqual(hintSquares(p, ["b2b8"]), ["b2"]);
  assert.deepEqual(hintSquares(p, []), []);
  assert.match(hintText(p), /Checks first/);
  assert.match(hintText({ kind: "line", goal: "engine", tag: "fork-n" }), /two things/);
  assert.match(hintText({ kind: "line", goal: "tb", tag: "eg-drip" }), /opposition/);
  assert.match(hintText({ kind: "line", goal: "engine", tag: "double" }), /hits two things/);
});
