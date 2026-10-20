// Daily session: ~40% weak spots, ~40% current level, ~20% spaced review.
import { levelStatus, currentLevelId } from "./progress.js";
import { dueIds } from "./review.js";
import { shuffle } from "./rng.js";

export const SESSION_SIZE = 10;
export const SESSION_MIX = { weak: 4, current: 4, review: 2 };

export function buildDailySession({ progress, worlds, puzzles, today, rng }) {
  const playable = puzzles.filter((p) => p.level && levelStatus(progress, worlds, p.level) !== "locked");
  const playableIds = new Set(playable.map((p) => p.id));
  const chosen = [];
  const taken = new Set();
  const take = (list, n) => {
    for (const p of list) {
      if (n <= 0) break;
      if (taken.has(p.id)) continue;
      chosen.push(p.id);
      taken.add(p.id);
      n--;
    }
  };

  // 1. Spaced review: earliest due first.
  const byId = new Map(playable.map((p) => [p.id, p]));
  take(dueIds(progress.review, today).filter((id) => playableIds.has(id)).map((id) => byId.get(id)), SESSION_MIX.review);

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
  take(shuffle(curList, rng), SESSION_MIX.current);

  // 4. Fill up to the session size.
  take(shuffle(playable, rng), SESSION_SIZE - chosen.length);

  return shuffle(chosen, rng);
}
