// Dev-only: pick candidate positions from the Lichess open puzzle database (CC0, database.lichess.org).
// Download once:  curl -L -o tools/data/lichess_db_puzzle.csv.zst https://database.lichess.org/lichess_db_puzzle.csv.zst
// Usage:  zstdcat tools/data/lichess_db_puzzle.csv.zst | node tools/pick-lichess.mjs <theme> <minRating> <maxRating> <count> [w|b|any] [maxPieces]
// Lichess themes used: mateIn1 mateIn2 backRankMate smotheredMate fork pin skewer discoveredAttack endgame pawnEndgame
// Output: [{ source, rating, fen, solution }] — fen is AFTER Lichess's set-up move, so the player is to move.
import readline from "node:readline";
import { Chess } from "chess.js";

const [theme, lo, hi, count, side = "any", maxPieces = "32"] = process.argv.slice(2);
const rl = readline.createInterface({ input: process.stdin });
const out = [];
let header = true;
for await (const line of rl) {
  if (header) { header = false; continue; }
  const [id, fen, moves, rating, , popularity, plays, themes] = line.split(",");
  const r = Number(rating);
  if (r < Number(lo) || r > Number(hi) || Number(popularity) < 80 || Number(plays) < 300) continue;
  if (!themes.split(" ").includes(theme)) continue;
  const c = new Chess(fen);
  const ms = moves.split(" ");
  c.move({ from: ms[0].slice(0, 2), to: ms[0].slice(2, 4), promotion: ms[0][4] });
  if (side !== "any" && c.turn() !== side) continue;
  if (c.board().flat().filter(Boolean).length > Number(maxPieces)) continue;
  out.push({ source: `lichess:${id}`, rating: r, fen: c.fen(), solution: ms.slice(1) });
  if (out.length >= Number(count)) break;
}
console.log(JSON.stringify(out, null, 1));
process.exit(0);
