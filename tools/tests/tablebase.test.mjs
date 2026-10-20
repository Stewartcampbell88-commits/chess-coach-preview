import test from "node:test"; import assert from "node:assert/strict";
import { tbTree } from "../tb-tree.mjs";

// Recorded from tablebase.lichess.ovh on 2026-10-20.
const FIX = {
  "8/4k3/8/3K4/4P3/8/8/8 w - - 0 1": { category: "win", moves: [
    { uci: "d5e5", category: "loss", dtm: -28, dtz: -4 }, { uci: "e4e5", category: "draw", dtm: 0, dtz: 0 },
    { uci: "d5c4", category: "draw", dtm: 0, dtz: 0 }, { uci: "d5d4", category: "draw", dtm: 0, dtz: 0 },
    { uci: "d5c5", category: "draw", dtm: 0, dtz: 0 }, { uci: "d5c6", category: "draw", dtm: 0, dtz: 0 } ] },
  "8/4k3/8/4K3/4P3/8/8/8 b - - 1 1": { category: "loss", moves: [
    { uci: "e7d7", category: "win", dtm: 27, dtz: 3 }, { uci: "e7f7", category: "win", dtm: 25, dtz: 3 },
    { uci: "e7e8", category: "win", dtm: 25, dtz: 3 }, { uci: "e7f8", category: "win", dtm: 25, dtz: 3 },
    { uci: "e7d8", category: "win", dtm: 23, dtz: 3 } ] },
};
const probe = async (fen) => { if (!FIX[fen]) throw new Error(`no fixture ${fen}`); return FIX[fen]; };

test("opposition: Ke5 is the only win", async () => {
  const errs = [];
  assert.deepEqual(await tbTree("8/4k3/8/3K4/4P3/8/8/8 w - - 0 1", 1, "win", probe, errs), { d5e5: null });
  assert.deepEqual(errs, []);
});
test("reply is the tablebase's best defence (first listed)", async () => {
  const errs = [];
  const spy = async (fen) => FIX[fen] || { category: "win", moves: [{ uci: "e5f5", category: "loss", dtm: -26, dtz: -2 }] };
  const t = await tbTree("8/4k3/8/3K4/4P3/8/8/8 w - - 0 1", 2, "win", spy, errs);
  assert.equal(t.d5e5.reply, "e7d7");
});
test("too many winning moves is rejected", async () => {
  const errs = [];
  const many = async () => ({ category: "win", moves: ["e2e3", "e2e4", "e1d1", "e1f1"].map((uci) => ({ uci, category: "loss", dtm: -9, dtz: -1 })) });
  await tbTree("4k3/8/8/8/8/8/4P3/4K3 w - - 0 1", 1, "win", many, errs);
  assert.match(errs.join(), /only-move/);
});
test("draw goal accepts drawing moves", async () => {
  const errs = [];
  const fx = async () => ({ category: "draw", moves: [{ uci: "e8d8", category: "draw" }, { uci: "e8f8", category: "win" }] });
  assert.deepEqual(await tbTree("4k3/8/8/8/8/8/4P3/4K3 b - - 0 1", 1, "draw", fx, errs), { e8d8: null });
});
test("more than 7 pieces is rejected", async () => {
  const errs = [];
  await tbTree("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1", 1, "win", async () => ({ moves: [] }), errs);
  assert.match(errs.join(), /more than 7 pieces/);
});
