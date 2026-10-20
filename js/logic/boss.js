// Boss = mastery check: 5 fresh positions, pass with 4 of 5.
import { shuffle } from "./rng.js";

export const BOSS_SIZE = 5;
export const BOSS_PASS = 4;

/** Picks one random id from candidates, preferring ids not in `avoid`. */
function pickPreferFresh(candidates, avoid, rng) {
  const fresh = candidates.filter((p) => !avoid.has(p.id));
  const from = fresh.length ? fresh : candidates;
  if (!from.length) return null;
  return from[Math.floor(rng() * from.length)];
}

export function buildBoss(world, puzzles, lastIds, rng) {
  const pool = puzzles.filter((p) => world.boss && p.boss === world.boss.id);
  if (pool.length < BOSS_SIZE) throw new Error("Boss pool too small");
  const avoid = new Set(Array.isArray(lastIds) ? lastIds : []);
  const chosen = [];
  const taken = new Set();
  for (const level of world.levels) {
    const pick = pickPreferFresh(pool.filter((p) => p.tag === level.tag && !taken.has(p.id)), avoid, rng);
    if (pick) { chosen.push(pick.id); taken.add(pick.id); }
  }
  while (chosen.length < BOSS_SIZE) {
    const pick = pickPreferFresh(pool.filter((p) => !taken.has(p.id)), avoid, rng);
    chosen.push(pick.id);
    taken.add(pick.id);
  }
  return shuffle(chosen, rng);
}

/** results: [{id, correct}]. Weak level = most-missed tag, ties -> earliest level. */
export function gradeBoss(results, byId, world) {
  const score = results.filter((r) => r.correct).length;
  const passed = score >= BOSS_PASS;
  if (passed) return { score, passed, weakLevelId: null, weakTags: [] };
  const misses = {};
  for (const r of results) {
    if (r.correct) continue;
    const tag = byId.get(r.id)?.tag;
    if (tag) misses[tag] = (misses[tag] || 0) + 1;
  }
  const max = Math.max(0, ...Object.values(misses));
  const ordered = world.levels.map((l) => l.tag);
  const weakTags = max > 0 ? ordered.filter((t) => misses[t] === max) : [];
  const weakLevel = world.levels.find((l) => l.tag === weakTags[0]);
  return { score, passed, weakLevelId: weakLevel ? weakLevel.id : null, weakTags };
}
