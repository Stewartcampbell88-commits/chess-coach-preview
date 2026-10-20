import test from "node:test"; import assert from "node:assert/strict";
import { WORLDS } from "../js/data/worlds.js"; import { PUZZLES, puzzlesById } from "../js/data/puzzles.js";
import { treeStats } from "../js/logic/line.js";
test("six worlds in spec order", () => assert.deepEqual(WORLDS.map(w => w.name),
  ["Don't Hang Pieces","Mate in 1 & 2","Forks & Double Attacks","Pins & Skewers","Survive the Opening","Simple Endgames"]));
test("unique ids", () => assert.equal(new Set(PUZZLES.map(p => p.id)).size, PUZZLES.length));
test("5 puzzles per level, matching tag", () => { for (const l of WORLDS[0].levels) {
  const ps = PUZZLES.filter(p => p.level === l.id); assert.equal(ps.length, 5, l.id);
  assert.ok(ps.every(p => p.tag === l.tag && p.boss === null)); } });
test("boss pool: 12, 3 per tag, never in levels", () => {
  const b = PUZZLES.filter(p => p.boss === "w1-boss"); assert.equal(b.length, 12);
  for (const t of ["spot","free","count","save"]) assert.equal(b.filter(p => p.tag === t).length, 3);
  assert.ok(b.every(p => p.level === null)); });
test("aggregator exposes every world file", () => {
  assert.ok(PUZZLES.length >= 32);
  assert.equal(puzzlesById().get("w1-l1-01").world, 1);
  assert.equal(puzzlesById().size, PUZZLES.length);
});
const live = WORLDS.filter((w) => !w.comingSoon);
test("coming-soon worlds have no levels yet", () => {
  for (const w of WORLDS.filter((w) => w.comingSoon)) assert.equal(w.levels.length, 0, `world ${w.id}`);
});
test("v8: Worlds 1-3 live, 4-6 coming soon", () =>
  assert.deepEqual(WORLDS.map((w) => !w.comingSoon), [true, true, true, false, false, false]));
test("live worlds: 4 levels × 5 puzzles; boss pool 12 = 3 per tag, never in levels", () => {
  for (const w of live) {
    assert.equal(w.levels.length, 4, `world ${w.id}`);
    for (const l of w.levels) {
      const ps = PUZZLES.filter((p) => p.level === l.id);
      assert.equal(ps.length, 5, l.id);
      assert.ok(ps.every((p) => p.tag === l.tag && p.boss === null && p.world === w.id), l.id);
    }
    const b = PUZZLES.filter((p) => p.boss === w.boss.id);
    assert.equal(b.length, 12, w.boss.id);
    for (const l of w.levels) assert.equal(b.filter((p) => p.tag === l.tag).length, 3, `${w.boss.id} ${l.tag}`);
    assert.ok(b.every((p) => p.level === null && p.world === w.id));
  }
});
test("level tags are unique across worlds", () => {
  const tags = WORLDS.flatMap((w) => w.levels.map((l) => l.tag));
  assert.equal(new Set(tags).size, tags.length);
});
test("Worlds 2–4 mix in Black to move (≥ 6 of 20 level, ≥ 4 of 12 boss)", () => {
  const black = (ps) => ps.filter((p) => p.fen.split(" ")[1] === "b").length;
  for (const w of live.filter((w) => w.id >= 2 && w.id <= 4)) {
    assert.ok(black(PUZZLES.filter((p) => p.world === w.id && p.level)) >= 6, `world ${w.id} levels`);
    assert.ok(black(PUZZLES.filter((p) => p.boss === w.boss.id)) >= 4, `world ${w.id} boss`);
  }
});
test("line puzzles have a goal and a non-empty tree", () => {
  for (const p of PUZZLES.filter((p) => p.kind === "line")) {
    assert.ok(["mate", "engine", "tb", "book"].includes(p.goal), p.id);
    assert.ok(treeStats(p.tree).keys > 0, p.id);
  }
});
test("no duplicate positions (placement + side to move)", () =>
  assert.equal(new Set(PUZZLES.map((p) => p.fen.split(" ").slice(0, 2).join(" "))).size, PUZZLES.length));
