// Move rules for the board UI (legal-move dots, drag validation, hints).
// Uses the vendored chess.js (BSD-2-Clause, see CREDITS.md).
import { Chess } from "../vendor/chess.js";

function load(fen) {
  try { return new Chess(fen); } catch { return null; }
}

/** Legal destinations for the piece on `from`, split into quiet moves and captures (sorted). */
export function legalTargets(fen, from) {
  const c = load(fen);
  if (!c) return { quiet: [], captures: [] };
  let moves = [];
  try { moves = c.moves({ square: from, verbose: true }); } catch { moves = []; }
  const quiet = [...new Set(moves.filter((m) => !m.captured).map((m) => m.to))].sort();
  const captures = [...new Set(moves.filter((m) => m.captured).map((m) => m.to))].sort();
  return { quiet, captures };
}

export function isLegalMove(fen, uci) {
  const c = load(fen);
  if (!c || !uci || uci.length < 4) return false;
  try {
    return c.moves({ verbose: true }).some((m) => m.from === uci.slice(0, 2) && m.to === uci.slice(2, 4));
  } catch { return false; }
}

/** Squares to highlight for a hint. Never reveals a tap-puzzle answer directly. */
export function hintSquares(puzzle) {
  if (puzzle.kind !== "tap-hanging") return [puzzle.accept[0].slice(0, 2)];
  const c = load(puzzle.fen);
  if (!c) return [];
  const target = [...puzzle.accept].sort()[0];
  return [...c.attackers(target, "w")].sort();
}

export function hintText(puzzle) {
  if (puzzle.kind === "take-free") return "Look at the highlighted piece. What can it take for free?";
  if (puzzle.kind === "save-piece") return "The highlighted piece is in danger. Where would it be safe?";
  return "The highlighted piece is attacking something loose. What is it hitting?";
}
