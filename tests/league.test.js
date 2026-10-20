import test from "node:test"; import assert from "node:assert/strict";
import { WORLDS } from "../js/data/worlds.js";
import * as P from "../js/logic/progress.js";
import { LEAGUES, leagueForWorld, worldStars, leagueLadder, currentLeague, promotionFor } from "../js/logic/league.js";

const pass = (p, w, stars = [3, 3, 3, 3]) =>
  P.recordBossResult(w.levels.reduce((q, l, i) => P.recordLevelResult(q, l.id, stars[i]), p), w.boss.id, [], { score: 5, passed: true, weakLevelId: null, weakTags: [] });
const stewart = () => pass(P.defaultProgress(), WORLDS[0], [2, 3, 3, 3]);

test("six leagues map one-to-one onto worlds in order", () => {
  assert.deepEqual(LEAGUES.map((l) => l.name), ["Wood", "Stone", "Bronze", "Silver", "Gold", "Master"]);
  assert.deepEqual(LEAGUES.map((l) => l.worldId), [1, 2, 3, 4, 5, 6]);
  assert.equal(leagueForWorld(2).name, "Stone");
  assert.equal(leagueForWorld(99), null);
});
test("world stars are best stars over its levels, max 3 per level", () => {
  assert.deepEqual(worldStars(stewart(), WORLDS[0]), { stars: 11, max: 12, cleared: 4, total: 4 });
  assert.deepEqual(worldStars(stewart(), WORLDS[1]), { stars: 0, max: 12, cleared: 0, total: 4 });
  assert.deepEqual(worldStars(stewart(), WORLDS[4]), { stars: 0, max: 0, cleared: 0, total: 0 });
});
test("fresh player: Wood is current, everything above locked", () => {
  const rows = leagueLadder(P.defaultProgress(), WORLDS);
  assert.deepEqual(rows.map((r) => r.status), ["current", "locked", "locked", "locked", "locked", "locked"]);
  assert.equal(currentLeague(P.defaultProgress(), WORLDS).league.name, "Wood");
});
test("World 1 boss beaten: Wood passed, Stone current, W4–6 flagged coming soon", () => {
  const rows = leagueLadder(stewart(), WORLDS);
  assert.deepEqual(rows.map((r) => r.status), ["passed", "current", "locked", "locked", "locked", "locked"]);
  assert.deepEqual(rows.map((r) => r.comingSoon), [false, false, false, true, true, true]);
  assert.equal(rows[0].stars, 11);
  const cur = currentLeague(stewart(), WORLDS);
  assert.equal(cur.league.name, "Stone");
  assert.equal(cur.world.id, 2);
});
test("clearing levels alone does not promote (boss is the promotion match)", () => {
  const p = WORLDS[0].levels.reduce((q, l) => P.recordLevelResult(q, l.id, 3), P.defaultProgress());
  assert.equal(currentLeague(p, WORLDS).league.name, "Wood");
});
test("past the last built world, the next league is current but coming soon", () => {
  const p = pass(pass(pass(P.defaultProgress(), WORLDS[0]), WORLDS[1]), WORLDS[2]);
  const cur = currentLeague(p, WORLDS);
  assert.equal(cur.league.name, "Silver");
  assert.equal(cur.comingSoon, true);
});
test("promotion: beating a world's boss moves you up one league; Master is the top", () => {
  assert.deepEqual([promotionFor(1).from.name, promotionFor(1).to.name], ["Wood", "Stone"]);
  assert.deepEqual([promotionFor(5).from.name, promotionFor(5).to.name], ["Gold", "Master"]);
  assert.equal(promotionFor(6).to, null);
});
