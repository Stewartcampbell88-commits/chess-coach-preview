// Local calendar-day keys ("YYYY-MM-DD"). Never use toISOString (that's UTC).
const pad = (n) => String(n).padStart(2, "0");

export function localDateKey(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toUtcMs(key) {
  const [y, m, d] = key.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function addDays(key, n) {
  const t = new Date(toUtcMs(key) + n * 86400000);
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

/** Whole days from a to b (b - a). */
export function dayDiff(a, b) {
  return Math.round((toUtcMs(b) - toUtcMs(a)) / 86400000);
}
