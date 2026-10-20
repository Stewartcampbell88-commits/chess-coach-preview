import test from "node:test"; import assert from "node:assert/strict";
import { renderMap, renderBossResult, renderLevelResult, renderPuzzleShell, renderActionBar, renderTabBar, renderReview, renderProfile, renderDaily } from "../js/ui/screens.js";
import { WORLDS } from "../js/data/worlds.js"; import { PUZZLES } from "../js/data/puzzles.js";
import { defaultProgress, recordLevelResult, recordBossResult } from "../js/logic/progress.js";
import { parseFen } from "../js/chess/board.js";
const opts = { today: "2026-10-20", updateReady: false, updateChecking: false, appVersion: "chess-coach-v6" };
test("map shows all worlds, one playable level, daily button", () => { const h = renderMap(defaultProgress(), WORLDS, opts);
  for (const w of WORLDS) assert.ok(h.includes(w.name), w.name);
  assert.equal(h.match(/data-action="play-level"/g).length, 1); assert.equal(h.match(/Coming soon/g).length, 3);
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
test("puzzle shell: top bar, coach bubble, board host, hint", () => {
  const pz = PUZZLES[0];
  const h = renderPuzzleShell({ title: "Level 1 · Spot the Hanging Piece", lives: 2, index: 0, total: 5,
    coach: { text: pz.prompt, mood: "neutral" }, actions: { phase: "solving", kind: pz.kind, picked: 0 } });
  assert.ok(h.includes('id="board-host"')); assert.ok(h.includes("2 lives left")); assert.ok(h.includes(pz.prompt));
  assert.ok(h.includes('data-action="home"')); assert.ok(h.includes('data-action="hint"')); assert.ok(h.includes('data-action="submit-taps" disabled'));
  assert.ok(h.includes("coach-avatar")); });
test("action bar phases", () => {
  assert.ok(renderActionBar({ phase: "correct", kind: "take-free" }).includes("Correct!"));
  const w = renderActionBar({ phase: "wrong", kind: "take-free" }); assert.ok(w.includes("Incorrect") && w.includes('data-action="retry"') && w.includes('data-action="next"'));
  assert.ok(!renderActionBar({ phase: "solving", kind: "take-free", canHint: false }).includes('data-action="hint"'));
  assert.ok(renderActionBar({ phase: "solving", kind: "take-free", hintUsed: true }).includes("Hint used")); });
test("tab bar has 4 tabs and marks the active one", () => { const h = renderTabBar("review");
  assert.equal(h.match(/data-action="tab"/g).length, 4); assert.match(h, /class="tab on" data-action="tab" data-tab="review"/); });
test("review, profile and daily tabs render stats", () => {
  const p = { ...defaultProgress(), tagSeen: { spot: 4 }, tagMisses: { spot: 1 }, review: { "w1-l1-01": { box: 0, due: "2026-10-20" } }, streak: { count: 2, lastDate: "2026-10-20" } };
  const r = renderReview(p, WORLDS, PUZZLES, opts); assert.ok(r.includes("75%")); assert.match(r, /hero-num">1</);
  const pr = renderProfile(p, WORLDS, opts); assert.ok(pr.includes("Day streak") && pr.includes("Check for update") && pr.includes('data-action="toggle-sound"'));
  assert.ok(renderDaily(p, opts).includes("Play today's session")); });
test("boss buttons carry their world id", () => {
  const p = ["w1-l1","w1-l2","w1-l3","w1-l4"].reduce((q, id) => recordLevelResult(q, id, 3), defaultProgress());
  assert.match(renderMap(p, WORLDS, opts), /data-action="play-boss" data-world="1"/);
  assert.match(renderLevelResult({ levelName: "L", stars: 3, livesLeft: 3, nextLevelName: null, bossUnlocked: true, worldId: 2 }),
    /data-action="play-boss" data-world="2"/);
});
test("review counts due endgame warm-ups", () => {
  const id = PUZZLES.find((p) => p.drip).id;
  const p = { ...defaultProgress(), review: { [id]: { box: 0, due: "2026-10-19" } } };
  assert.match(renderReview(p, WORLDS, PUZZLES, { today: "2026-10-20" }), /<p class="hero-num">1<\/p>/);
});
test("review shows an Endgame warm-ups accuracy row once played", () => {
  const p = { ...defaultProgress(), tagSeen: { "eg-drip": 4 }, tagMisses: { "eg-drip": 1 } };
  assert.match(renderReview(p, WORLDS, PUZZLES, { today: "2026-10-20" }), /Endgame warm-ups[\s\S]*75%/);
});
