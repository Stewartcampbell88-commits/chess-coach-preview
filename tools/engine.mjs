// Dev-only Stockfish (npm "stockfish" 19.0.1, GPL-3.0). Never shipped to the app.
// Results are cached in tools/cache/engine.json (committed) so validation is reproducible offline.
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const ENGINE = new URL("./node_modules/stockfish/bin/stockfish-19-lite-single.js", import.meta.url);
const CACHE_DIR = new URL("./cache/", import.meta.url);
const CACHE_FILE = new URL("./cache/engine.json", import.meta.url);
export const DEPTH = 16, MULTIPV = 8;

const cache = existsSync(CACHE_FILE) ? JSON.parse(readFileSync(CACHE_FILE, "utf8")) : {};
let dirty = false, proc = null, buf = "", waiter = null;

function start() {
  proc = spawn(process.execPath, [fileURLToPath(ENGINE)], { stdio: ["pipe", "pipe", "inherit"] });
  proc.stdout.on("data", (d) => {
    buf += d;
    if (waiter && waiter.re.test(buf)) { const w = waiter, out = buf; waiter = null; buf = ""; w.resolve(out); }
  });
}
function send(cmd, re) {
  return new Promise((resolve) => { waiter = { re, resolve }; proc.stdin.write(cmd + "\n"); });
}

/** Mover's point of view. Mate in N = 100000 - N; getting mated in N = -100000 + N. */
export function parseScore(line) {
  const m = / score (cp|mate) (-?\d+)/.exec(line);
  if (!m) return null;
  const v = Number(m[2]);
  if (m[1] === "cp") return v;
  return v > 0 ? 100000 - v : -100000 - v;
}

/** Deepest exact (non-bound) line for each MultiPV slot, in slot order. */
export function parseMultiPv(out) {
  const best = new Map();
  for (const line of out.split("\n")) {
    const d = / depth (\d+) /.exec(line), k = / multipv (\d+) /.exec(line), pv = / pv (\S+)/.exec(line);
    const score = parseScore(line);
    if (!d || !k || !pv || score === null || / (upperbound|lowerbound) /.test(line)) continue;
    const prev = best.get(Number(k[1]));
    if (!prev || Number(d[1]) >= prev.depth) best.set(Number(k[1]), { depth: Number(d[1]), uci: pv[1], score });
  }
  return [...best.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => ({ uci: v.uci, score: v.score }));
}

export async function analyse(fen, { depth = DEPTH, multipv = MULTIPV } = {}) {
  const key = `${fen}|d${depth}|m${multipv}`;
  if (cache[key]) return cache[key];
  if (!proc) { start(); await send("uci", /uciok/); }
  proc.stdin.write(`setoption name MultiPV value ${multipv}\nucinewgame\n`);
  await send("isready", /readyok/);
  const lines = parseMultiPv(await send(`position fen ${fen}\ngo depth ${depth}`, /bestmove/));
  cache[key] = lines;
  dirty = true;
  return lines;
}

export function saveCache() {
  if (!dirty) return;
  mkdirSync(CACHE_DIR, { recursive: true });
  const sorted = Object.fromEntries(Object.keys(cache).sort().map((k) => [k, cache[k]]));
  writeFileSync(CACHE_FILE, JSON.stringify(sorted, null, 1) + "\n");
  dirty = false;
}

export function stop() {
  saveCache();
  if (proc) proc.kill();
  proc = null;
}
