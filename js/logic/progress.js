// Pure progress rules. Functions never mutate their input.
import { starsForLives } from "./stars.js";

/**
 * @typedef {{ version: 6,
 *   levels: Record<string, {stars: number, cleared: boolean}>,
 *   bosses: Record<string, {passed: boolean, attempts: number, lastIds: string[]}>,
 *   bossGate: Record<string, string>,
 *   tagSeen: Record<string, number>, tagMisses: Record<string, number>,
 *   review: Record<string, {box: number, due: string}>,
 *   streak: {count: number, lastDate: string|null} }} Progress
 */

export function defaultProgress() {
  return {
    version: 6,
    levels: {},
    bosses: {},
    bossGate: {},
    tagSeen: {},
    tagMisses: {},
    review: {},
    streak: { count: 0, lastDate: null },
  };
}

const findWorld = (worlds, worldId) => worlds.find((w) => w.id === worldId) || null;

function worldOfLevel(worlds, levelId) {
  return worlds.find((w) => w.levels.some((l) => l.id === levelId)) || null;
}

export function worldStatus(p, worlds, worldId) {
  const idx = worlds.findIndex((w) => w.id === worldId);
  if (idx < 0) return "locked";
  const w = worlds[idx];
  if (w.comingSoon) return "coming-soon";
  if (w.boss && p.bosses[w.boss.id]?.passed) return "passed";
  if (idx === 0) return "open";
  return worldStatus(p, worlds, worlds[idx - 1].id) === "passed" ? "open" : "locked";
}

export function levelStatus(p, worlds, levelId) {
  const w = worldOfLevel(worlds, levelId);
  if (!w) return "locked";
  const ws = worldStatus(p, worlds, w.id);
  if (ws !== "open" && ws !== "passed") return "locked";
  if (p.levels[levelId]?.cleared) return "cleared";
  const i = w.levels.findIndex((l) => l.id === levelId);
  if (i === 0) return "open";
  return p.levels[w.levels[i - 1].id]?.cleared ? "open" : "locked";
}

export function bossStatus(p, worlds, worldId) {
  const w = findWorld(worlds, worldId);
  if (!w || !w.boss) return "locked";
  if (p.bosses[w.boss.id]?.passed) return "passed";
  const ws = worldStatus(p, worlds, worldId);
  if (ws !== "open") return "locked";
  if (!w.levels.every((l) => p.levels[l.id]?.cleared)) return "locked";
  if (p.bossGate[w.boss.id]) return "gated";
  return "open";
}

/** First open, not-yet-cleared level across worlds, or null. */
export function currentLevelId(p, worlds) {
  for (const w of worlds) {
    for (const l of w.levels) {
      if (levelStatus(p, worlds, l.id) === "open") return l.id;
    }
  }
  return null;
}

export function recordLevelResult(p, levelId, livesLeft) {
  const stars = starsForLives(livesLeft);
  if (stars === 0) return p;
  const prev = p.levels[levelId] || { stars: 0, cleared: false };
  const bossGate = Object.fromEntries(Object.entries(p.bossGate).filter(([, lv]) => lv !== levelId));
  return {
    ...p,
    levels: { ...p.levels, [levelId]: { stars: Math.max(prev.stars, stars), cleared: true } },
    bossGate,
  };
}

/** grade: { score, passed, weakLevelId, weakTags } */
export function recordBossResult(p, bossId, ids, grade) {
  const prev = p.bosses[bossId] || { passed: false, attempts: 0, lastIds: [] };
  const bossGate = { ...p.bossGate };
  if (grade.passed || !grade.weakLevelId) delete bossGate[bossId];
  else bossGate[bossId] = grade.weakLevelId;
  return {
    ...p,
    bosses: {
      ...p.bosses,
      [bossId]: { passed: prev.passed || grade.passed, attempts: prev.attempts + 1, lastIds: [...ids] },
    },
    bossGate,
  };
}
