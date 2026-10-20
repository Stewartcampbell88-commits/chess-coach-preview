// "tb" goal: keys = moves that keep the result (win, or at least a draw). Only-move positions only.
// A Lichess move's `category` is from the opponent's side after the move ("loss" = the mover wins).
import { Chess } from "chess.js";
import { fenAfterLan, pieceCount } from "./common.mjs";

const KEEPS = { win: ["loss"], draw: ["draw", "blessed-loss", "loss"] };
const queenOnly = (uci) => uci.length === 4 || uci.endsWith("q");

export async function tbTree(fen, length, result, probe, errs, path = "") {
  if (!path) {
    if (pieceCount(fen) > 7) { errs.push("tb: more than 7 pieces"); return {}; }
    if (fen.split(" ")[2] !== "-") errs.push("tb: castling rights must be '-'");
    if (!KEEPS[result]) { errs.push(`tb: result must be win or draw (got ${result})`); return {}; }
  }
  const d = await probe(fen);
  const moves = d.moves.filter((m) => queenOnly(m.uci));
  const keys = moves.filter((m) => KEEPS[result].includes(m.category)).map((m) => m.uci).sort();
  if (!keys.length) errs.push(`${path}tb: no move keeps the ${result}`);
  if (keys.length > 3) errs.push(`${path}tb: ${keys.length} moves keep the ${result} — not an only-move position`);
  if (keys.length && keys.length === moves.length) errs.push(`${path}tb: every move keeps the ${result} — nothing to find`);
  const tree = {};
  for (const k of keys) {
    const after = fenAfterLan(fen, k);
    if (length <= 1 || !after || new Chess(after).isGameOver()) { tree[k] = null; continue; }
    const reply = (await probe(after)).moves[0].uci; // best defence is listed first
    tree[k] = { reply, next: await tbTree(fenAfterLan(after, reply), length - 1, result, probe, errs, `${path}${k} ${reply} `) };
  }
  return tree;
}
