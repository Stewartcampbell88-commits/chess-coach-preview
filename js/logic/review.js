// Leitner-style spaced review. Only missed puzzles enter the review deck.
import { addDays } from "./dates.js";

export const REVIEW_INTERVALS = [1, 3, 7, 16, 35];
const TOP_BOX = REVIEW_INTERVALS.length - 1;

export function scheduleAnswer(review, id, correct, today) {
  if (!correct) return { ...review, [id]: { box: 0, due: addDays(today, REVIEW_INTERVALS[0]) } };
  const cur = review[id];
  if (!cur || typeof cur !== "object") return review;
  const prevBox = Number.isInteger(cur.box) ? cur.box : 0;
  const box = Math.min(Math.max(prevBox, 0) + 1, TOP_BOX);
  return { ...review, [id]: { box, due: addDays(today, REVIEW_INTERVALS[box]) } };
}

export function dueIds(review, today) {
  return Object.entries(review)
    .filter(([, r]) => r && typeof r.due === "string" && r.due <= today)
    .sort(([ia, a], [ib, b]) => (a.due < b.due ? -1 : a.due > b.due ? 1 : ia < ib ? -1 : ia > ib ? 1 : 0))
    .map(([id]) => id);
}
