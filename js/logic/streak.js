import { dayDiff } from "./dates.js";

export function updateStreak(streak, today) {
  const s = streak || { count: 0, lastDate: null };
  if (s.lastDate === today) return s;
  if (s.lastDate && dayDiff(s.lastDate, today) === 1) return { count: s.count + 1, lastDate: today };
  return { count: 1, lastDate: today };
}

/** What to show: alive if played today or yesterday, otherwise 0. */
export function displayStreak(streak, today) {
  if (!streak || !streak.lastDate) return 0;
  const gap = dayDiff(streak.lastDate, today);
  return gap === 0 || gap === 1 ? streak.count : 0;
}
