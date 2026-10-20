// Dev-only Lichess tablebase client (https://tablebase.lichess.ovh). Responses are cached in
// tools/cache/tablebase.json (committed) so validation works offline once filled.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const API = "https://tablebase.lichess.ovh/standard?fen=";
const CACHE_DIR = new URL("./cache/", import.meta.url);
const CACHE_FILE = new URL("./cache/tablebase.json", import.meta.url);
const cache = existsSync(CACHE_FILE) ? JSON.parse(readFileSync(CACHE_FILE, "utf8")) : {};
let dirty = false, last = 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, Math.max(0, ms)));

export async function probe(fen) {
  if (cache[fen]) return cache[fen];
  await sleep(1100 - (Date.now() - last)); // be polite: ≤ 1 request per second
  last = Date.now();
  let res;
  try {
    res = await fetch(API + fen.replace(/ /g, "_"), {
      headers: { "User-Agent": "chess-teacher-validator (github.com/Stewartcampbell88-commits/chess-coach-preview)" },
    });
  } catch (e) {
    throw new Error(`tablebase offline and ${fen} not cached — run npm run validate once with internet (${e.message})`);
  }
  if (!res.ok) throw new Error(`tablebase HTTP ${res.status} for ${fen}`);
  const d = await res.json();
  cache[fen] = {
    category: d.category,
    moves: d.moves.map((m) => ({ uci: m.uci, category: m.category, dtm: m.dtm ?? null, dtz: m.dtz ?? null })),
  };
  dirty = true;
  return cache[fen];
}

export function saveCache() {
  if (!dirty) return;
  mkdirSync(CACHE_DIR, { recursive: true });
  const sorted = Object.fromEntries(Object.keys(cache).sort().map((k) => [k, cache[k]]));
  writeFileSync(CACHE_FILE, JSON.stringify(sorted, null, 1) + "\n");
  dirty = false;
}
