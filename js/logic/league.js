// Leagues: one per world. Beating a world's boss is the "promotion match" into the next league.
import { worldStatus } from "./progress.js";

export const LEAGUES = [
  { id: "wood", name: "Wood", worldId: 1, mark: "I" },
  { id: "stone", name: "Stone", worldId: 2, mark: "II" },
  { id: "bronze", name: "Bronze", worldId: 3, mark: "III" },
  { id: "silver", name: "Silver", worldId: 4, mark: "IV" },
  { id: "gold", name: "Gold", worldId: 5, mark: "V" },
  { id: "master", name: "Master", worldId: 6, mark: "1500" },
];

export const leagueForWorld = (worldId) => LEAGUES.find((l) => l.worldId === worldId) || null;

/** Best stars over a world's levels (3 max per level) and how many levels are cleared. */
export function worldStars(progress, world) {
  const ls = world.levels;
  return {
    stars: ls.reduce((s, l) => s + (progress.levels[l.id]?.stars || 0), 0),
    max: ls.length * 3,
    cleared: ls.filter((l) => progress.levels[l.id]?.cleared).length,
    total: ls.length,
  };
}

/** One row per league, Wood first. status: passed | current | locked. */
export function leagueLadder(progress, worlds) {
  let seenCurrent = false;
  return LEAGUES.map((league) => {
    const world = worlds.find((w) => w.id === league.worldId);
    const ws = world ? worldStatus(progress, worlds, world.id) : "coming-soon";
    let status;
    if (ws === "passed") status = "passed";
    else if (!seenCurrent) { status = "current"; seenCurrent = true; }
    else status = "locked";
    return { league, world, status, comingSoon: !world || Boolean(world.comingSoon), ...(world ? worldStars(progress, world) : { stars: 0, max: 0, cleared: 0, total: 0 }) };
  });
}

/** The league you are playing in now (the top league once everything is beaten). */
export function currentLeague(progress, worlds) {
  const rows = leagueLadder(progress, worlds);
  return rows.find((r) => r.status === "current") || rows[rows.length - 1];
}

export function promotionFor(worldId) {
  return { from: leagueForWorld(worldId), to: leagueForWorld(worldId + 1) };
}
