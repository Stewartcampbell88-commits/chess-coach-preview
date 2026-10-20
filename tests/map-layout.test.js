import test from "node:test"; import assert from "node:assert/strict";
import { WORLDS } from "../js/data/worlds.js";
import * as P from "../js/logic/progress.js";
import { mapLayout, currentNode, pathD, lockedReason, ZONES, MAP } from "../js/logic/map-layout.js";

const pass = (p, w, stars = [3, 3, 3, 3]) =>
  P.recordBossResult(w.levels.reduce((q, l, i) => P.recordLevelResult(q, l.id, stars[i]), p), w.boss.id, [], { score: 5, passed: true, weakLevelId: null, weakTags: [] });
const stewart = () => pass(P.defaultProgress(), WORLDS[0], [2, 3, 3, 3]);

test("one zone per world, themed, stacked bottom (W1) to top (W6)", () => {
  const L = mapLayout(stewart(), WORLDS);
  assert.equal(L.zones.length, 6);
  assert.deepEqual(L.zones.map((z) => z.theme), ["meadow", "castle", "forest", "peaks", "coast", "summit"]);
  for (let i = 1; i < 6; i++) assert.ok(L.zones[i].top + L.zones[i].height <= L.zones[i - 1].top + 0.001, `zone ${i + 1} above zone ${i}`);
  assert.equal(L.zones[0].top + L.zones[0].height, L.height);
  assert.equal(L.zones[5].top, 0);
  assert.equal(ZONES[3].name, "Fork Forest");
});
test("built worlds get 4 level bubbles + a boss; unbuilt worlds none", () => {
  const L = mapLayout(stewart(), WORLDS);
  const by = (w) => L.nodes.filter((n) => n.worldId === w);
  assert.deepEqual(by(1).map((n) => n.kind), ["level", "level", "level", "level", "boss"]);
  assert.equal(by(3).length, 5);
  assert.equal(by(4).length, 0);
});
test("nodes go upward in play order and sit inside their zone, x within the screen", () => {
  const L = mapLayout(stewart(), WORLDS);
  for (let i = 1; i < L.nodes.length; i++) assert.ok(L.nodes[i].y < L.nodes[i - 1].y, `node ${i} above ${i - 1}`);
  for (const n of L.nodes) {
    const z = L.zones.find((q) => q.worldId === n.worldId);
    assert.ok(n.y > z.top && n.y < z.top + z.height, n.id);
    assert.ok(n.x >= 0.15 && n.x <= 0.85, n.id);
  }
});
test("statuses and stars come from progress", () => {
  const L = mapLayout(stewart(), WORLDS);
  const n = (id) => L.nodes.find((x) => x.id === id);
  assert.deepEqual(["w1-l1", "w1-l2", "w1-l3", "w1-l4"].map((id) => n(id).stars), [2, 3, 3, 3]);
  assert.equal(n("w1-l1").status, "cleared");
  assert.equal(n("w1-boss").status, "passed");
  assert.equal(n("w2-l1").status, "open");
  assert.equal(n("w2-l2").status, "locked");
  assert.equal(n("w2-boss").status, "locked");
  assert.deepEqual(L.zones.map((z) => z.status), ["passed", "open", "locked", "coming-soon", "coming-soon", "coming-soon"]);
  assert.deepEqual(L.zones.map((z) => z.fog), [false, false, true, true, true, true]);
});
test("current node: first open level, else an open/gated boss, else none", () => {
  assert.equal(currentNode(P.defaultProgress(), WORLDS).id, "w1-l1");
  assert.equal(currentNode(stewart(), WORLDS).id, "w2-l1");
  const lv = WORLDS[0].levels.reduce((q, l) => P.recordLevelResult(q, l.id, 3), P.defaultProgress());
  assert.deepEqual([currentNode(lv, WORLDS).kind, currentNode(lv, WORLDS).id], ["boss", "w1-boss"]);
  const all = pass(pass(pass(P.defaultProgress(), WORLDS[0]), WORLDS[1]), WORLDS[2]);
  assert.equal(currentNode(all, WORLDS), null);
  assert.equal(mapLayout(stewart(), WORLDS).currentId, "w2-l1");
});
test("path runs from the start (bottom) through every node", () => {
  const L = mapLayout(stewart(), WORLDS);
  assert.ok(L.path.length >= L.nodes.length + 2);
  for (const n of L.nodes) assert.ok(L.path.some((p) => p.x === n.x && p.y === n.y), n.id);
  assert.equal(L.path[0].y, L.height);
  const d = pathD(L.path, MAP.width);
  assert.match(d, /^M[\d.]+ [\d.]+/);
  assert.equal((d.match(/C/g) || []).length, L.path.length - 1);
});
test("locked taps explain why", () => {
  const s = stewart();
  assert.equal(lockedReason(s, WORLDS, "w2-l3"), "Clear Level 2 first.");
  assert.equal(lockedReason(s, WORLDS, "w2-boss"), "Clear all 4 levels to unlock the boss.");
  assert.equal(lockedReason(s, WORLDS, "w3-l1"), "Beat the World 2 boss to open World 3.");
  assert.equal(lockedReason(s, WORLDS, "world-5"), "World 5 is coming soon.");
});
