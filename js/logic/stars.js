export const LIVES_PER_LEVEL = 3;

/** 3 lives left = 3 stars ... 0 lives = 0 stars (soft retry). */
export function starsForLives(n) {
  const v = Math.floor(Number(n) || 0);
  return Math.max(0, Math.min(LIVES_PER_LEVEL, v));
}

/** Stars for a cleared level: lives left, minus one if any hint was used (min 1). */
export function starsForResult(livesLeft, hintsUsed) {
  const base = starsForLives(livesLeft);
  if (base === 0) return 0;
  return Math.max(1, base - (hintsUsed > 0 ? 1 : 0));
}
