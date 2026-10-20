// Dev-only puzzle checker. Uses chess.js to compute the correct answer for
// each World 1 puzzle kind; authored answers must match exactly.
import { Chess } from "chess.js";

export const VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9 };

function capturesOn(chess, square) {
  return chess.moves({ verbose: true }).filter((m) => m.to === square && m.captured);
}

/** Static exchange: best gain for side to move from capturing on `square` (>= 0). */
export function see(chess, square) {
  const caps = capturesOn(chess, square);
  if (!caps.length) return 0;
  caps.sort((a, b) => (VALUES[a.piece] || 100) - (VALUES[b.piece] || 100));
  const m = caps[0];
  chess.move(m);
  const gain = (VALUES[m.captured] || 0) - see(chess, square);
  chess.undo();
  return Math.max(0, gain);
}

function withTurn(fen, turn) {
  const p = fen.trim().split(/\s+/);
  p[1] = turn;
  p[3] = "-";
  return p.join(" ");
}

function load(fen) {
  try { return new Chess(fen); } catch { return null; }
}

/** Sorted squares of non-king `colour` pieces the other side wins material by capturing. */
export function hangingSquares(fen, colour) {
  const opp = colour === "w" ? "b" : "w";
  const c = load(withTurn(fen, opp));
  if (!c) return [];
  return c.board().flat()
    .filter((p) => p && p.color === colour && p.type !== "k")
    .map((p) => p.square)
    .filter((sq) => see(c, sq) > 0)
    .sort();
}

function opponentHasMateInOne(chess) {
  for (const m of chess.moves({ verbose: true })) {
    chess.move(m);
    const mate = chess.isCheckmate();
    chess.undo();
    if (mate) return true;
  }
  return false;
}

function legalWhiteMoves(fen) {
  const c = load(fen);
  return c ? c.moves({ verbose: true }) : [];
}

function afterFen(fen, move) {
  const c = new Chess(fen);
  c.move(move);
  return c.fen();
}

/** Computes the full accepted answer set for a puzzle (sorted). */
export function expectedAccept(puzzle) {
  const { fen, kind } = puzzle;
  if (kind === "tap-hanging") return hangingSquares(fen, "b");
  const moves = legalWhiteMoves(fen);
  if (kind === "take-free") {
    const hang = hangingSquares(fen, "b");
    if (!hang.length) return [];
    const c = new Chess(fen);
    const best = Math.max(...hang.map((sq) => VALUES[c.get(sq).type]));
    return moves
      .filter((m) => m.captured && hang.includes(m.to) && VALUES[m.captured] === best)
      .filter((m) => !hangingSquares(afterFen(fen, m), "w").includes(m.to))
      .map((m) => m.lan).sort();
  }
  if (kind === "save-piece") {
    return moves
      .filter((m) => hangingSquares(afterFen(fen, m), "w").length === 0)
      .map((m) => m.lan).sort();
  }
  return [];
}

/** Returns error strings; empty array = valid. */
export function validatePuzzle(puzzle) {
  const errs = [];
  const { fen, kind, tag } = puzzle;
  const fields = String(fen || "").trim().split(/\s+/);
  if (fields.length !== 6) errs.push("FEN must have 6 fields");
  const c = load(fen);
  if (!c) return [...errs, "FEN does not load in chess.js"];
  if (c.turn() !== "w") errs.push("must be White to move");
  if (c.isGameOver()) errs.push("game is already over");
  const flipped = load(withTurn(fen, "b"));
  if (!flipped || flipped.inCheck()) errs.push("illegal: Black (not to move) is in check");
  if (!["tap-hanging", "take-free", "save-piece"].includes(kind)) errs.push(`unknown kind ${kind}`);
  if (!puzzle.prompt) errs.push("missing prompt");
  if (!puzzle.explain) errs.push("missing explain");
  if (errs.length) return errs;

  if (kind === "save-piece" && hangingSquares(fen, "w").length === 0) errs.push("save-piece: no White piece is hanging");
  const expected = expectedAccept(puzzle);
  if (!expected.length) errs.push("no correct answer exists");
  if (kind === "save-piece" && expected.length > 6) errs.push(`save-piece: too many answers (${expected.length})`);

  if (kind !== "tap-hanging") {
    const byLan = new Map(c.moves({ verbose: true }).map((m) => [m.lan, m]));
    for (const lan of expected) {
      const m = byLan.get(lan);
      if (m.promotion) errs.push(`${lan}: promotion not allowed`);
      if (m.isKingsideCastle() || m.isQueensideCastle()) errs.push(`${lan}: castling not allowed`);
      if (m.isEnPassant()) errs.push(`${lan}: en passant not allowed`);
      const after = new Chess(fen); after.move(m);
      if (opponentHasMateInOne(after)) errs.push(`${lan}: allows mate in 1`);
    }
  }

  if (tag === "count") {
    const flip = load(withTurn(fen, "b"));
    const counted = c.board().flat().some((p) => p && p.color === "b" && p.type !== "k"
      && c.attackers(p.square, "w").length >= 1 && flip.attackers(p.square, "b").length >= 1);
    if (!counted) errs.push("count: no attacked-and-defended black piece");
  }

  const got = [...(puzzle.accept || [])].sort();
  if (JSON.stringify(got) !== JSON.stringify(expected)) {
    errs.push(`accept ${JSON.stringify(got)} != expected ${JSON.stringify(expected)}`);
  }
  return errs;
}
