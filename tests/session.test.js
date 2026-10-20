import test from "node:test"; import assert from "node:assert/strict";
import { WORLDS } from "../js/data/worlds.js"; import { PUZZLES } from "../js/data/puzzles.js";
import { buildDailySession } from "../js/logic/session.js"; import { makeRng } from "../js/logic/rng.js";
import * as P from "../js/logic/progress.js";
const byId = new Map(PUZZLES.map(p => [p.id, p])), today = "2026-10-20";
const run = (progress, seed = 1) => buildDailySession({ progress, worlds: WORLDS, puzzles: PUZZLES, today, rng: makeRng(seed) });
test("fresh player gets level 1's five", () => { const ids = run(P.defaultProgress());
  assert.equal(ids.length, 5); assert.ok(ids.every(id => byId.get(id).level === "w1-l1")); });
test("40/40/20 mix", () => {
  let p = ["w1-l1","w1-l2","w1-l3"].reduce((q, id) => P.recordLevelResult(q, id, 3), P.defaultProgress());
  p = { ...p, tagSeen: { spot: 5, free: 5 }, tagMisses: { spot: 3 },
        review: { "w1-l2-01": { box: 0, due: "2026-10-19" }, "w1-l2-02": { box: 0, due: "2026-10-20" } } };
  const ids = run(p), ps = ids.map(id => byId.get(id));
  assert.equal(ids.length, 10); assert.equal(new Set(ids).size, 10);
  assert.ok(ids.includes("w1-l2-01") && ids.includes("w1-l2-02"));
  assert.ok(ps.filter(x => x.tag === "spot").length >= 4); assert.ok(ps.filter(x => x.level === "w1-l4").length >= 4);
  assert.ok(ps.every(x => x.boss === null)); });
test("same seed same session", () => assert.deepEqual(run(P.defaultProgress(), 3), run(P.defaultProgress(), 3)));
test("all cleared: full 10 from playable, no boss ids", () => {
  const p = ["w1-l1","w1-l2","w1-l3","w1-l4"].reduce((q, id) => P.recordLevelResult(q, id, 3), P.defaultProgress());
  const ids = run(p); assert.equal(ids.length, 10); assert.equal(new Set(ids).size, 10); assert.ok(ids.every(id => byId.get(id).boss === null)); });
test("review ids from locked levels are skipped", () => {
  const p = { ...P.defaultProgress(), review: { "w1-l4-01": { box: 0, due: "2026-10-01" } } };
  assert.ok(!run(p).includes("w1-l4-01")); });
const passBoss = (p, id) => P.recordBossResult(p, id, [], { score: 5, passed: true, weakLevelId: null, weakTags: [] });
const clearWorld = (p, w) => passBoss(w.levels.reduce((q, l) => P.recordLevelResult(q, l.id, 3), p), w.boss.id);
test("no endgame warm-up before World 3 opens", () => {
  const p = clearWorld(P.defaultProgress(), WORLDS[0]);
  assert.ok(run(p).every((id) => !byId.get(id).drip));
});
test("exactly one endgame warm-up per session once World 3 is open", () => {
  const p = clearWorld(clearWorld(P.defaultProgress(), WORLDS[0]), WORLDS[1]);
  const ids = run(p);
  assert.equal(ids.length, 10);
  assert.equal(new Set(ids).size, 10);
  assert.equal(ids.filter((id) => byId.get(id).drip).length, 1);
});
test("a due warm-up comes back before a fresh one", () => {
  let p = clearWorld(clearWorld(P.defaultProgress(), WORLDS[0]), WORLDS[1]);
  const dripId = PUZZLES.filter((x) => x.drip).map((x) => x.id).sort().at(-1);
  p = { ...p, review: { [dripId]: { box: 0, due: "2026-10-19" } } };
  assert.ok(run(p).includes(dripId));
});
