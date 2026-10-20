import test from "node:test"; import assert from "node:assert/strict";
import { renderNodeSheet, renderRank, renderPromotion, renderMap, renderBossResult, renderLevelResult, renderPuzzleShell, renderActionBar, renderTabBar, renderReview, renderProfile, renderDaily } from "../js/ui/screens.js";
import { WORLDS } from "../js/data/worlds.js"; import { PUZZLES } from "../js/data/puzzles.js";
import { defaultProgress, recordLevelResult, recordBossResult } from "../js/logic/progress.js";
import { parseFen } from "../js/chess/board.js";
const opts = { today: "2026-10-20", updateReady: false, updateChecking: false, appVersion: "chess-coach-v6" };
test("map shows all worlds, one current bubble, daily button, update footer", () => { const h = renderMap(defaultProgress(), WORLDS, opts);
  for (const w of WORLDS) assert.ok(h.includes(w.name), w.name);
  assert.equal(h.match(/class="map-bubble[^"]*\bcurrent\b/g).length, 1); assert.equal(h.match(/Coming soon/g).length, 3);
  assert.ok(h.includes("Play today's session")); assert.ok(h.includes("Check for update")); assert.ok(h.includes("chess-coach-v6"));
  assert.ok(!/chess\.com/i.test(h)); });
test("update banner when ready", () => assert.ok(renderMap(defaultProgress(), WORLDS, { ...opts, updateReady: true }).includes("Update now")));
test("streak shown on map", () => { const p = { ...defaultProgress(), streak: { count: 3, lastDate: "2026-10-19" } };
  assert.match(renderMap(p, WORLDS, opts), /aria-label="3 day streak"/); });
test("gated boss tells you what to practise (boss sheet)", () => {
  let p = ["w1-l1","w1-l2","w1-l3","w1-l4"].reduce((q, id) => recordLevelResult(q, id, 3), defaultProgress());
  p = recordBossResult(p, "w1-boss", ["x"], { score: 2, passed: false, weakLevelId: "w1-l2", weakTags: ["free"] });
  const h = renderNodeSheet(p, WORLDS, "w1-boss");
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
  assert.match(renderNodeSheet(p, WORLDS, "w1-boss"), /data-action="play-boss" data-world="1"/);
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

// ——— v8.1 winding map + rank ladder ———
const passW = (p, w, stars = [3, 3, 3, 3]) => recordBossResult(w.levels.reduce((q, l, i) => recordLevelResult(q, l.id, stars[i]), p), w.boss.id, [], { score: 5, passed: true, weakLevelId: null, weakTags: [] });
const stew = () => ({ ...passW(defaultProgress(), WORLDS[0], [2, 3, 3, 3]), streak: { count: 3, lastDate: "2026-10-19" } });
test("map: HUD with streak, total stars and the 1500 goal", () => {
  const h = renderMap(stew(), WORLDS, opts);
  assert.match(h, /class="map-hud"/); assert.match(h, /aria-label="11 stars"/); assert.ok(h.includes("1500"));
});
test("map: rank badge shows the current league and opens the ladder", () => {
  const h = renderMap(stew(), WORLDS, opts);
  assert.match(h, /data-action="open-rank"[\s\S]*Stone/);
});
test("map: every bubble and castle is tappable; stars under cleared levels; token on the current level", () => {
  const h = renderMap(stew(), WORLDS, opts);
  for (const id of ["w1-l1", "w1-l4", "w1-boss", "w2-l1", "w2-l2", "w2-boss", "w3-l1", "w3-boss"]) assert.ok(h.includes(`data-node="${id}"`), id);
  assert.match(h, /data-node="w2-l1"[^>]*class="map-bubble[^"]*current/);
  assert.match(h, /class="token"[^>]*data-at="w2-l1"/);
  assert.equal((h.match(/class="castle[^"]*beaten/g) || []).length, 1);
  assert.equal((h.match(/class="zone [^"]*fog/g) || []).length, 4);
  assert.ok(h.includes('aria-label="2 stars"'));
});
test("level sheet: open → Play, cleared → Replay with stars", () => {
  const s = stew();
  const open = renderNodeSheet(s, WORLDS, "w2-l1");
  assert.match(open, /Level 1 · Mate in 1: Queen &amp; Rook|Level 1 · Mate in 1: Queen & Rook/);
  assert.match(open, /data-action="play-level" data-level="w2-l1"[^>]*>[\s\S]*Play/);
  const done = renderNodeSheet(s, WORLDS, "w1-l1");
  assert.ok(done.includes("Replay")); assert.ok(done.includes('aria-label="2 stars"'));
  assert.match(renderNodeSheet(s, WORLDS, "w1-boss"), /data-action="play-boss" data-world="1"/);
  assert.ok(renderNodeSheet(s, WORLDS, "w1-boss").includes("Beaten"));
});
test("rank ladder: current league, star bar, next match, promotion match, six leagues", () => {
  const h = renderRank(stew(), WORLDS, opts);
  assert.ok(h.includes("Stone")); assert.ok(h.includes("0 / 12"));
  assert.match(h, /Next match[\s\S]*Mate in 1: Queen/);
  assert.match(h, /Promotion match[\s\S]*Boss: Mate in 1 &amp; 2|Promotion match[\s\S]*Boss: Mate in 1 & 2/);
  assert.equal((h.match(/class="league-row/g) || []).length, 6);
  assert.match(h, /league-row passed[\s\S]*Wood[\s\S]*11\/12/);
  assert.match(h, /data-action="close-rank"/);
  for (const n of ["Wood", "Bronze", "Silver", "Gold", "Master"]) assert.ok(h.includes(n), n);
  assert.ok(h.includes("Rapid 1500"));
});
test("promotion screen: world complete + promoted to the next league", () => {
  const h = renderPromotion({ worldId: 1, score: 5, from: { name: "Wood", id: "wood", mark: "I" }, to: { name: "Stone", id: "stone", mark: "II" } });
  assert.match(h, /class="result promo/); assert.ok(h.includes("World 1 complete!")); assert.ok(h.includes("Promoted to Stone"));
  assert.match(h, /data-action="open-rank"/); assert.match(h, /data-action="home"/);
  assert.ok(renderPromotion({ worldId: 6, score: 4, from: { name: "Master", id: "master", mark: "1500" }, to: null }).includes("Master"));
});

test("rank hero names the previous and next league (regression: neighbours were looked up by identity)", () => {
  const w = WORLDS[0];
  let s = w.levels.reduce((q, l, i) => recordLevelResult(q, l.id, [2, 3, 3, 3][i]), defaultProgress());
  s = recordBossResult(s, w.boss.id, [], { score: 5, passed: true, weakLevelId: null, weakTags: [] });
  const h = renderRank(s, WORLDS, {});
  assert.match(h, /Promoted from Wood/); assert.match(h, /Bronze →/); assert.match(h, /Win 4 of 5 → Bronze/);
});
