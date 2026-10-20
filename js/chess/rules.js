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

export function turnOf(fen) {
  return String(fen || "").trim().split(/\s+/)[1] === "b" ? "b" : "w";
}

function findMove(c, uci) {
  const u = String(uci || "").toLowerCase();
  if (u.length < 4) return null;
  const promo = u[4] || "q";
  let moves = [];
  try { moves = c.moves({ verbose: true }); } catch { return null; }
  return moves.find((m) => m.from === u.slice(0, 2) && m.to === u.slice(2, 4) && (!m.promotion || m.promotion === promo)) || null;
}

/** The legal LAN for a from+to move (pawns reaching the last rank become queens), or null. */
export function normaliseUci(fen, uci) {
  const c = load(fen);
  const m = c && findMove(c, uci);
  return m ? m.lan : null;
}

/** Plays a move: { fen, san, captured, lan } or null if illegal. Handles castling, en passant, promotion. */
export function playUci(fen, uci) {
  const c = load(fen);
  const m = c && findMove(c, uci);
  if (!m) return null;
  c.move({ from: m.from, to: m.to, promotion: m.promotion });
  return { fen: c.fen(), san: m.san, captured: Boolean(m.captured), lan: m.lan };
}

/** Squares to highlight for a hint. Never reveals a tap-puzzle answer directly.
 *  Line puzzles: the piece of the first accepted move at the current point (`keys`). */
export function hintSquares(puzzle, keys = null) {
  if (puzzle.kind === "line") return keys && keys.length ? [[...keys].sort()[0].slice(0, 2)] : [];
  if (puzzle.kind !== "tap-hanging") return [puzzle.accept[0].slice(0, 2)];
  const c = load(puzzle.fen);
  if (!c) return [];
  const target = [...puzzle.accept].sort()[0];
  return [...c.attackers(target, "w")].sort();
}

const LINE_HINTS = {
  mate: "Checks first. The highlighted piece starts the mate.",
  fork: "The highlighted piece can attack two things at once.",
  double: "Look for a move that hits two things — a check plus something loose is ideal.",
  pin: "The highlighted piece can use a line: something valuable is hiding behind.",
  skewer: "Attack the big piece first. What's left behind it?",
  escape: "The highlighted piece is the one that gets you out of trouble.",
  opening: "The highlighted piece is the one to play now. Develop and stay safe.",
  endgame: "The highlighted piece makes the key move. Think opposition and the square of the pawn.",
};

function hintFamily(p) {
  const tag = String(p.tag || "");
  if (p.goal === "mate") return "mate";
  if (p.goal === "book") return "opening";
  if (p.goal === "tb" || tag.startsWith("eg-")) return "endgame";
  if (tag.startsWith("fork")) return "fork";
  if (tag === "double") return "double";
  if (tag === "skewer") return "skewer";
  if (tag === "pin-escape") return "escape";
  if (tag.startsWith("pin")) return "pin";
  return "mate";
}

export function hintText(puzzle) {
  if (puzzle.kind === "line") return LINE_HINTS[hintFamily(puzzle)];
  if (puzzle.kind === "take-free") return "Look at the highlighted piece. What can it take for free?";
  if (puzzle.kind === "save-piece") return "The highlighted piece is in danger. Where would it be safe?";
  return "The highlighted piece is attacking something loose. What is it hitting?";
}
