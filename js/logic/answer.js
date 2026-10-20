// Answer checking and tap-to-move selection (pure).

export function checkAnswer(puzzle, answer) {
  if (!answer) return false;
  if (puzzle.kind === "tap-hanging") {
    const got = [...new Set(answer.squares || [])].sort();
    const want = [...puzzle.accept].sort();
    return got.length === want.length && got.every((s, i) => s === want[i]);
  }
  if (!answer.uci) return false;
  return puzzle.accept.includes(String(answer.uci).toLowerCase());
}

const isOwn = (piece, turn) =>
  Boolean(piece) && (turn === "w" ? piece === piece.toUpperCase() : piece === piece.toLowerCase());

/** Tap own piece = select; same again = deselect; other own = reselect; else with a selection = move. */
export function nextSelection(sel, square, board, turn) {
  const piece = board[square];
  if (isOwn(piece, turn)) {
    if (sel === square) return { sel: null, move: null };
    return { sel: square, move: null };
  }
  if (!sel) return { sel: null, move: null };
  return { sel: null, move: sel + square };
}
