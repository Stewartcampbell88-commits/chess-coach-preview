// Daily session: ~40% weak spots, ~40% current level, ~20% spaced review.
// From World 3 onward one "current" slot becomes an endgame warm-up (spec).
import { levelStatus, currentLevelId, worldStatus } from "./progress.js";
import { dueIds } from "./review.js";
import { shuffle } from "./rng.js";

export const SESSION_SIZE = 10;
export const SESSION_MIX = { weak: 4, current: 4, review: 2 };
export const DRIP_PER_SESSION = 1;

export function dripActive(progress, worlds) {
  const s = worldStatus(progress, worlds, 3);
  return s === "open" || s === "passed";
}

export function buildDailySession({ progress, worlds, puzzles, today, rng }) {
  const playable = puzzles.filter((p) => p.level && levelStatus(progress, worlds, p.level) !== "locked");
  const playableIds = new Set(playable.map((p) => p.id));
  const chosen = [];
  const taken = new Set();
  const take = (list, n) => {
    for (const p of list) {
      if (n <= 0) break;
      if (!p || taken.has(p.id)) continue;
      chosen.push(p.id);
      taken.add(p.id);
      n--;
    }
  };

  const due = dueIds(progress.review, today);

  // 1. Spaced review: earliest due first.
  const byId = new Map(playable.map((p) => [p.id, p]));
  take(due.filter((id) => playableIds.has(id)).map((id) => byId.get(id)), SESSION_MIX.review);

  // 1b. Endgame warm-up: due first, then never-seen ones, then any.
  const drip = dripActive(progress, worlds) ? puzzles.filter((p) => p.drip) : [];
  if (drip.length) {
    const dripById = new Map(drip.map((p) => [p.id, p]));
    const dueDrip = due.filter((id) => dripById.has(id)).map((id) => dripById.get(id));
    const fresh = shuffle(drip.filter((p) => !progress.review[p.id]), rng);
    take([...dueDrip, ...fresh, ...shuffle(drip, rng)], DRIP_PER_SESSION);
  }

  // 2. Weak spots: tags ranked by miss rate, random within each tag.
  const rate = (t) => (progress.tagMisses[t] || 0) / Math.max(1, progress.tagSeen[t] || 0);
  const weakTags = [...new Set(playable.map((p) => p.tag))]
    .filter((t) => (progress.tagMisses[t] || 0) > 0)
    .sort((a, b) => rate(b) - rate(a));
  const weakList = weakTags.flatMap((t) => shuffle(playable.filter((p) => p.tag === t), rng));
  take(weakList, SESSION_MIX.weak);

  // 3. Current level (or everything playable once all levels are cleared).
  const cur = currentLevelId(progress, worlds);
  const curList = cur ? playable.filter((p) => p.level === cur) : playable;
  take(shuffle(curList, rng), SESSION_MIX.current - (drip.length ? DRIP_PER_SESSION : 0));

  // 4. Fill up to the session size (never with extra warm-ups).
  take(shuffle(playable, rng), SESSION_SIZE - chosen.length);

  return shuffle(chosen, rng);
}
