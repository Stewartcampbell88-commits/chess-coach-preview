import test from "node:test"; import assert from "node:assert/strict";
import { WORLDS } from "../js/data/worlds.js"; import { starsForLives } from "../js/logic/stars.js";
import * as P from "../js/logic/progress.js";
const clearAll = (p) => ["w1-l1","w1-l2","w1-l3","w1-l4"].reduce((q, id) => P.recordLevelResult(q, id, 3), p);
test("stars from lives", () => assert.deepEqual([3,2,1,0,5,-1].map(starsForLives), [3,2,1,0,3,0]));
test("fresh: only w1-l1 open", () => { const p = P.defaultProgress();
  assert.equal(P.levelStatus(p, WORLDS, "w1-l1"), "open"); assert.equal(P.levelStatus(p, WORLDS, "w1-l2"), "locked");
  assert.equal(P.bossStatus(p, WORLDS, 1), "locked"); assert.equal(P.worldStatus(p, WORLDS, 2), "coming-soon");
  assert.equal(P.currentLevelId(p, WORLDS), "w1-l1"); });
test("clearing unlocks next and keeps best stars", () => {
  let p = P.recordLevelResult(P.defaultProgress(), "w1-l1", 2);
  assert.deepEqual(p.levels["w1-l1"], { stars: 2, cleared: true }); assert.equal(P.levelStatus(p, WORLDS, "w1-l2"), "open");
  p = P.recordLevelResult(P.recordLevelResult(p, "w1-l1", 3), "w1-l1", 1); assert.equal(p.levels["w1-l1"].stars, 3); });
test("0 lives changes nothing", () => { const p = P.defaultProgress(); assert.equal(P.recordLevelResult(p, "w1-l1", 0), p); });
test("boss opens after all levels", () => assert.equal(P.bossStatus(clearAll(P.defaultProgress()), WORLDS, 1), "open"));
test("boss fail gates until weak level re-cleared", () => {
  let p = P.recordBossResult(clearAll(P.defaultProgress()), "w1-boss", ["a"], { score: 3, passed: false, weakLevelId: "w1-l3", weakTags: ["count"] });
  assert.equal(P.bossStatus(p, WORLDS, 1), "gated"); assert.equal(p.bossGate["w1-boss"], "w1-l3");
  assert.equal(p.bosses["w1-boss"].attempts, 1);
  p = P.recordLevelResult(p, "w1-l3", 1); assert.equal(P.bossStatus(p, WORLDS, 1), "open"); });
test("boss pass completes world 1 only", () => {
  const p = P.recordBossResult(clearAll(P.defaultProgress()), "w1-boss", ["a"], { score: 4, passed: true, weakLevelId: null, weakTags: [] });
  assert.equal(P.worldStatus(p, WORLDS, 1), "passed"); assert.equal(P.worldStatus(p, WORLDS, 2), "coming-soon"); });
import { starsForResult } from "../js/logic/stars.js";
test("hints cost one star, never below 1 on a clear", () => {
  assert.equal(starsForResult(3, 0), 3); assert.equal(starsForResult(3, 2), 2); assert.equal(starsForResult(1, 1), 1); assert.equal(starsForResult(0, 0), 0); });
test("hinted correct answer still comes back for review", () => {
  const p = P.recordAnswer(P.defaultProgress(), { id: "w1-l1-01", tag: "spot" }, true, "2026-10-20", { hinted: true });
  assert.deepEqual(p.review["w1-l1-01"], { box: 0, due: "2026-10-21" }); assert.equal(p.tagMisses.spot ?? 0, 0); assert.equal(p.tagSeen.spot, 1); });
test("mute setting defaults off and toggles", () => {
  const p = P.defaultProgress(); assert.equal(p.settings.muted, false); assert.equal(P.setMuted(p, true).settings.muted, true); });
test("level result with a hint saves one fewer star", () => {
  const p = P.recordLevelResult(P.defaultProgress(), "w1-l1", 3, { hintsUsed: 1 });
  assert.deepEqual(p.levels["w1-l1"], { stars: 2, cleared: true }); });
