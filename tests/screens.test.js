import test from "node:test"; import assert from "node:assert/strict";
import { renderMap, renderBossResult, renderLevelResult, renderPuzzle } from "../js/ui/screens.js";
import { WORLDS } from "../js/data/worlds.js"; import { PUZZLES } from "../js/data/puzzles-w1.js";
import { defaultProgress, recordLevelResult, recordBossResult } from "../js/logic/progress.js";
import { parseFen } from "../js/chess/board.js";
const opts = { today: "2026-10-20", updateReady: false, updateChecking: false, appVersion: "chess-coach-v6" };
test("map shows all worlds, one playable level, daily button", () => { const h = renderMap(defaultProgress(), WORLDS, opts);
  for (const w of WORLDS) assert.ok(h.includes(w.name), w.name);
  assert.equal(h.match(/data-action="play-level"/g).length, 1); assert.equal(h.match(/Coming soon/g).length, 5);
  assert.ok(h.includes("Play today's session")); assert.ok(h.includes("Check for update")); assert.ok(h.includes("chess-coach-v6"));
  assert.ok(!/chess\.com/i.test(h)); });
test("update banner when ready", () => assert.ok(renderMap(defaultProgress(), WORLDS, { ...opts, updateReady: true }).includes("Update now")));
test("streak shown on map", () => { const p = { ...defaultProgress(), streak: { count: 3, lastDate: "2026-10-19" } };
  assert.ok(renderMap(p, WORLDS, opts).includes("🔥 3 day streak")); });
test("gated boss tells you what to practise", () => {
  let p = ["w1-l1","w1-l2","w1-l3","w1-l4"].reduce((q, id) => recordLevelResult(q, id, 3), defaultProgress());
  p = recordBossResult(p, "w1-boss", ["x"], { score: 2, passed: false, weakLevelId: "w1-l2", weakTags: ["free"] });
  const h = renderMap(p, WORLDS, opts);
  assert.ok(h.includes("Practise Free Lunch first, then have another go.")); assert.ok(!h.includes('data-action="play-boss"')); });
test("boss fail routes to weak level", () => { const h = renderBossResult({ score: 3, passed: false, weakLevelId: "w1-l3", weakTags: ["count"] }, WORLDS);
  assert.ok(h.includes("Not yet — 3 of 5.")); assert.ok(h.includes("Practise Count Attackers & Defenders"));
  assert.ok(h.includes('data-level="w1-l3"')); });
test("boss pass", () => assert.ok(renderBossResult({ score: 5, passed: true, weakLevelId: null, weakTags: [] }, WORLDS).includes("World 1 complete!")));
test("level result copy", () => {
  assert.ok(renderLevelResult({ levelName: "Free Lunch", stars: 1, livesLeft: 1, nextLevelName: "Count Attackers & Defenders", bossUnlocked: false }).includes("1 star"));
  assert.ok(renderLevelResult({ levelName: "Free Lunch", stars: 0, livesLeft: 0, nextLevelName: null, bossUnlocked: false }).includes("Out of lives — have another go."));
  assert.ok(renderLevelResult({ levelName: "Save Your Piece", stars: 3, livesLeft: 3, nextLevelName: null, bossUnlocked: true }).includes('data-action="play-boss"')); });
test("puzzle screen: tap kind has Check button, board interactive, hearts shown", () => {
  const pz = PUZZLES[0];
  const h = renderPuzzle({ title: "Level 1", puzzle: pz, board: parseFen(pz.fen).board, lives: 2, index: 0, total: 5, selected: null, picked: [] });
  assert.ok(h.includes('data-action="submit-taps"')); assert.equal(h.match(/data-sq=/g).length, 64); assert.ok(h.includes("2 lives left")); });
