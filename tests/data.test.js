import test from "node:test"; import assert from "node:assert/strict";
import { WORLDS } from "../js/data/worlds.js"; import { PUZZLES } from "../js/data/puzzles-w1.js";
test("six worlds in spec order", () => assert.deepEqual(WORLDS.map(w => w.name),
  ["Don't Hang Pieces","Mate in 1 & 2","Forks & Double Attacks","Pins & Skewers","Survive the Opening","Simple Endgames"]));
test("worlds 2-6 coming soon", () => assert.ok(WORLDS.slice(1).every(w => w.comingSoon && w.levels.length === 0)));
test("unique ids", () => assert.equal(new Set(PUZZLES.map(p => p.id)).size, PUZZLES.length));
test("5 puzzles per level, matching tag", () => { for (const l of WORLDS[0].levels) {
  const ps = PUZZLES.filter(p => p.level === l.id); assert.equal(ps.length, 5, l.id);
  assert.ok(ps.every(p => p.tag === l.tag && p.boss === null)); } });
test("boss pool: 12, 3 per tag, never in levels", () => {
  const b = PUZZLES.filter(p => p.boss === "w1-boss"); assert.equal(b.length, 12);
  for (const t of ["spot","free","count","save"]) assert.equal(b.filter(p => p.tag === t).length, 3);
  assert.ok(b.every(p => p.level === null)); });
test("no duplicate positions", () => assert.equal(new Set(PUZZLES.map(p => p.fen.split(" ")[0])).size, PUZZLES.length));
