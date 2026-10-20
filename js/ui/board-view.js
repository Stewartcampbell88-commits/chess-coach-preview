// Board renderer: board map -> HTML string. White at the bottom.
import { FILES, isLightSquare } from "../chess/board.js";

const GLYPH = {
  K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
  k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟",
};

/**
 * opts: selected (square), picked (squares), highlight (squares, e.g. last move),
 *       answer (squares to ring), interactive (adds data-sq).
 */
export function renderBoard(board, opts = {}) {
  const { selected = null, picked = [], highlight = [], answer = [], interactive = false } = opts;
  const pk = new Set(picked), hi = new Set(highlight), ans = new Set(answer);
  let html = '<div class="board-wrap"><div class="board" role="grid" aria-label="Chess board">';
  for (let rank = 8; rank >= 1; rank--) {
    for (let fi = 0; fi < 8; fi++) {
      const sq = FILES[fi] + rank;
      const piece = board[sq];
      const cls = ["sq", isLightSquare(sq) ? "light" : "dark"];
      if (hi.has(sq)) cls.push("hi");
      if (pk.has(sq)) cls.push("picked");
      if (selected === sq) cls.push("sel");
      if (ans.has(sq)) cls.push("answer");
      if (piece) cls.push("has-piece");
      let coords = "";
      if (rank === 1) coords += `<span class="coord file">${FILES[fi]}</span>`;
      if (fi === 0) coords += `<span class="coord rank">${rank}</span>`;
      const pieceHtml = piece
        ? `<span class="piece ${piece === piece.toUpperCase() ? "piece-w" : "piece-b"}">${GLYPH[piece]}\uFE0E</span>`
        : "";
      const data = interactive ? ` data-sq="${sq}"` : "";
      html += `<div class="${cls.join(" ")}"${data}>${coords}${pieceHtml}</div>`;
    }
  }
  return html + "</div></div>";
}
