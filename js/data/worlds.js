// World map data. Order follows the approved spec (GM priority).
export const WORLDS = [
  {
    id: 1,
    name: "Don't Hang Pieces",
    blurb: "Before every move: what's attacked, what's defended?",
    comingSoon: false,
    levels: [
      { id: "w1-l1", name: "Spot the Hanging Piece", tag: "spot" },
      { id: "w1-l2", name: "Free Lunch", tag: "free" },
      { id: "w1-l3", name: "Count Attackers & Defenders", tag: "count" },
      { id: "w1-l4", name: "Save Your Piece", tag: "save" },
    ],
    boss: { id: "w1-boss", name: "Boss: Don't Hang Pieces" },
  },
  { id: 2, name: "Mate in 1 & 2", blurb: "Checks first. Back-rank mates.", comingSoon: true, levels: [], boss: null },
  { id: 3, name: "Forks & Double Attacks", blurb: "One move, two targets.", comingSoon: true, levels: [], boss: null },
  { id: 4, name: "Pins & Skewers", blurb: "Line up the pieces, then strike.", comingSoon: true, levels: [], boss: null },
  { id: 5, name: "Survive the Opening", blurb: "e4, Nf3, Bc4 — and calm replies as Black.", comingSoon: true, levels: [], boss: null },
  { id: 6, name: "Simple Endgames", blurb: "King and pawn, basic mates, converting a win.", comingSoon: true, levels: [], boss: null },
];

export function worldById(id) {
  return WORLDS.find((w) => w.id === id) || null;
}

/** Finds a level and its world by level id. */
export function findLevel(levelId) {
  for (const w of WORLDS) {
    const level = w.levels.find((l) => l.id === levelId);
    if (level) return { world: w, level };
  }
  return null;
}
