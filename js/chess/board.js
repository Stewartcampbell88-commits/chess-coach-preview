// Pure board helpers: FEN parsing and applying a UCI move to a square map.
export const FILES = "abcdefgh";

/** @returns {{board: Record<string, string|null>, turn: "w"|"b"}} */
export function parseFen(fen) {
  const parts = String(fen || "").trim().split(/\s+/);
  const ranks = parts[0].split("/");
  if (ranks.length !== 8) throw new Error("Bad FEN");
  const board = {};
  for (let r = 1; r <= 8; r++) for (const f of FILES) board[f + r] = null;
  for (let ri = 0; ri < 8; ri++) {
    const rank = 8 - ri;
    let file = 0;
    for (const ch of ranks[ri]) {
      if (/[1-8]/.test(ch)) file += Number(ch);
      else if (/[prnbqkPRNBQK]/.test(ch)) {
        if (file > 7) throw new Error("Bad FEN");
        board[FILES[file] + rank] = ch;
        file++;
      } else throw new Error("Bad FEN");
    }
    if (file !== 8) throw new Error("Bad FEN");
  }
  const turn = parts[1] === "b" ? "b" : "w";
  return { board, turn };
}

/** Returns a new board with the move applied. 5th char promotes in mover's case. */
export function applyUci(board, uci) {
  const from = uci.slice(0, 2), to = uci.slice(2, 4), promo = uci[4];
  const next = { ...board };
  let piece = next[from];
  if (piece && promo) {
    piece = piece === piece.toUpperCase() ? promo.toUpperCase() : promo.toLowerCase();
  }
  next[to] = piece;
  next[from] = null;
  return next;
}

export function isLightSquare(sq) {
  const fi = FILES.indexOf(sq[0]);
  const rank = Number(sq[1]);
  return (fi + rank) % 2 === 0;
}
