export const LIVES_PER_LEVEL = 3;

/** 3 lives left = 3 stars ... 0 lives = 0 stars (soft retry). */
export function starsForLives(n) {
  const v = Math.floor(Number(n) || 0);
  return Math.max(0, Math.min(LIVES_PER_LEVEL, v));
}
