import test from "node:test"; import assert from "node:assert/strict";
import * as engine from "../engine.mjs";
import { engineTree } from "../engine-tree.mjs";

const { parseScore, parseMultiPv, analyse } = engine;

test("score parsing (mover POV)", () => {
  assert.equal(parseScore("info depth 9 multipv 1 score cp -35 pv e2e4"), -35);
  assert.equal(parseScore("info depth 9 multipv 1 score mate 1 pv h5f7"), 99999);
  assert.equal(parseScore("info depth 9 multipv 1 score mate -2 pv a2a3"), -99998);
  assert.equal(parseScore("info string hello"), null);
});
test("multipv keeps the deepest exact line per slot", () => {
  const out = [
    "info depth 15 seldepth 20 multipv 1 score cp 30 nodes 1 pv e2e4 e7e5",
    "info depth 16 seldepth 21 multipv 1 score cp 25 lowerbound nodes 1 pv d2d4",
    "info depth 16 seldepth 21 multipv 1 score cp 20 nodes 1 pv g1f3",
    "info depth 16 seldepth 21 multipv 2 score cp 10 nodes 1 pv c2c4",
    "bestmove g1f3",
  ].join("\n");
  assert.deepEqual(parseMultiPv(out), [{ uci: "g1f3", score: 20 }, { uci: "c2c4", score: 10 }]);
});
test("engine finds the scholar's mate", async () => {
  const lines = await analyse("r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4", { multipv: 3 });
  assert.equal(lines[0].uci, "h5f7"); assert.equal(lines[0].score, 99999);
});
test("knight fork tree: only Nc7+, then only Nxa8", async () => {
  const errs = [];
  const t = await engineTree("r3k3/8/8/1N6/8/8/PP6/4K3 w - - 0 1", 2, engine, errs);
  assert.deepEqual(errs, []);
  assert.deepEqual(Object.keys(t), ["b5c7"]);
  assert.deepEqual(Object.keys(t.b5c7.next), ["c7a8"]);
});
test("a quiet position is rejected as not sharp", async () => {
  const errs = [];
  await engineTree("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", 1, engine, errs);
  assert.match(errs.join(), /not sharp/);
  engine.stop();
});
