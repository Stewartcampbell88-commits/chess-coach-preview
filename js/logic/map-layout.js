// Home map geometry (pure): a path snaking upward through one themed zone per world.
// y is in CSS px from the top of the map; x is a fraction of the map width.
import { levelStatus, bossStatus, worldStatus } from "./progress.js";

export const MAP = { width: 390, bottomPad: 230, entry: 120, step: 112, bossStep: 160, exit: 150, soon: 330, topPad: 40 };
export const ZONES = {
  1: { theme: "meadow", name: "The Meadow" },
  2: { theme: "castle", name: "Mate Castle" },
  3: { theme: "forest", name: "Fork Forest" },
  4: { theme: "peaks", name: "Pin Peaks" },
  5: { theme: "coast", name: "Opening Coast" },
  6: { theme: "summit", name: "Endgame Summit" },
};
const LEVEL_X = [0.3, 0.7, 0.66, 0.3];
const BOSS_X = 0.5;

/** First open level, else an open/gated boss, in play order. */
export function currentNode(progress, worlds) {
  for (const w of worlds) {
    const i = w.levels.findIndex((l) => levelStatus(progress, worlds, l.id) === "open");
    if (i >= 0) return { kind: "level", id: w.levels[i].id, worldId: w.id, index: i };
    if (w.boss) {
      const b = bossStatus(progress, worlds, w.id);
      if (b === "open" || b === "gated") return { kind: "boss", id: w.boss.id, worldId: w.id, index: w.levels.length };
    }
  }
  return null;
}

export function mapLayout(progress, worlds) {
  const zonesUp = [], nodesUp = [], pathUp = [{ x: 0.5, u: 0 }];
  let u = 0;
  worlds.forEach((w, wi) => {
    const start = u;
    const built = !w.comingSoon && w.levels.length > 0;
    if (wi === 0) u += MAP.bottomPad;
    if (built) {
      u += MAP.entry;
      w.levels.forEach((l, i) => {
        if (i) u += MAP.step;
        const st = levelStatus(progress, worlds, l.id);
        nodesUp.push({ kind: "level", id: l.id, worldId: w.id, index: i, name: l.name, x: LEVEL_X[i % LEVEL_X.length], u,
          status: st, stars: progress.levels[l.id]?.stars || 0 });
      });
      if (w.boss) {
        u += MAP.bossStep;
        nodesUp.push({ kind: "boss", id: w.boss.id, worldId: w.id, index: w.levels.length, name: w.boss.name, x: BOSS_X, u,
          status: bossStatus(progress, worlds, w.id), stars: 0 });
      }
      u += MAP.exit;
    } else {
      u += MAP.soon;
      pathUp.push({ x: 0.5, u: start + MAP.soon / 2, ghost: true });
    }
    for (const n of nodesUp.filter((n) => n.worldId === w.id)) pathUp.push({ x: n.x, u: n.u });
    const status = worldStatus(progress, worlds, w.id);
    zonesUp.push({ worldId: w.id, name: w.name, ...(ZONES[w.id] || { theme: "meadow", name: w.name }), zoneName: (ZONES[w.id] || {}).name,
      status, fog: status === "locked" || status === "coming-soon", start, end: u });
  });
  const height = u + MAP.topPad;
  pathUp.push({ x: 0.5, u: height });
  const y = (v) => height - v;
  const cur = currentNode(progress, worlds);
  return {
    height,
    currentId: cur ? cur.id : null,
    zones: zonesUp.map(({ start, end, ...z }) => ({ ...z, top: y(end === u ? height : end), height: (end === u ? height : end) - start })),
    nodes: nodesUp.map(({ u: v, ...n }) => ({ ...n, y: y(v), current: cur ? cur.id === n.id : false })),
    path: pathUp.map((p) => ({ x: p.x, y: y(p.u), ...(p.ghost ? { ghost: true } : {}) })),
  };
}

/** Smooth SVG path (Catmull-Rom as cubic Béziers) through points in map coords. */
export function pathD(points, width) {
  const P = points.map((p) => [p.x * width, p.y]);
  const r = (v) => Math.round(v * 10) / 10;
  let d = `M${r(P[0][0])} ${r(P[0][1])}`;
  for (let i = 0; i < P.length - 1; i++) {
    const a = P[i - 1] || P[i], b = P[i], c = P[i + 1], e = P[i + 2] || c;
    d += ` C${r(b[0] + (c[0] - a[0]) / 6)} ${r(b[1] + (c[1] - a[1]) / 6)}, ${r(c[0] - (e[0] - b[0]) / 6)} ${r(c[1] - (e[1] - b[1]) / 6)}, ${r(c[0])} ${r(c[1])}`;
  }
  return d;
}

/** Toast text for tapping something locked. id: level id, boss id, or "world-<n>". */
export function lockedReason(progress, worlds, id) {
  const wm = /^world-(\d+)$/.exec(id);
  const world = wm ? worlds.find((w) => w.id === Number(wm[1]))
    : worlds.find((w) => w.boss?.id === id || w.levels.some((l) => l.id === id));
  if (!world) return "Not available yet.";
  const ws = worldStatus(progress, worlds, world.id);
  if (ws === "coming-soon") return `World ${world.id} is coming soon.`;
  if (ws === "locked") return `Beat the World ${world.id - 1} boss to open World ${world.id}.`;
  if (world.boss?.id === id) return `Clear all ${world.levels.length} levels to unlock the boss.`;
  const i = world.levels.findIndex((l) => l.id === id);
  return i > 0 ? `Clear Level ${i} first.` : "Not available yet.";
}
