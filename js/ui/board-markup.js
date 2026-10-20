// Pure board markup: squares (with highlight classes + inside-corner coordinates)
// and an absolutely positioned piece layer using bundled SVG pieces (cburnett, GPLv2+).
import { FILES, isLightSquare } from "../chess/board.js";

export const PIECE_DIR = "assets/pieces/cburnett";

export function pieceSrc(piece) {
  const colour = piece === piece.toUpperCase() ? "w" : "b";
  return `${PIECE_DIR}/${colour}${piece.toUpperCase()}.svg`;
}

/** [x, y] grid position from White's side: a8 = [0,0], h1 = [7,7]. */
export function squareXY(sq) {
  return [FILES.indexOf(sq[0]), 8 - Number(sq[1])];
}

export function pieceTransform(sq) {
  const [x, y] = squareXY(sq);
  return `translate(${x * 100}%, ${y * 100}%)`;
}

/**
 * opts: lastMove [from,to], selected, legal {quiet,captures}, hint [], marks [] (tap puzzles),
 *       rings [] (answer squares), badges {sq: "good"|"bad"}
 */
export function boardMarkup(board, opts = {}) {
  const {
    lastMove = [], selected = null, legal = { quiet: [], captures: [] },
    hint = [], marks = [], rings = [], badges = {},
  } = opts;
  const last = new Set(lastMove), quiet = new Set(legal.quiet), caps = new Set(legal.captures);
  const hints = new Set(hint), marked = new Set(marks), ring = new Set(rings);
  let squares = "";
  for (let rank = 8; rank >= 1; rank--) {
    for (let fi = 0; fi < 8; fi++) {
      const sq = FILES[fi] + rank;
      const cls = ["sq", isLightSquare(sq) ? "light" : "dark"];
      if (last.has(sq)) cls.push("last");
      if (selected === sq) cls.push("sel");
      if (hints.has(sq)) cls.push("hint");
      if (quiet.has(sq)) cls.push("dot");
      if (caps.has(sq)) cls.push("cap");
      if (ring.has(sq)) cls.push("ring");
      if (marked.has(sq)) cls.push("marked");
      let inner = "";
      if (fi === 0) inner += `<span class="coord rank">${rank}</span>`;
      if (rank === 1) inner += `<span class="coord file">${FILES[fi]}</span>`;
      if (badges[sq]) {
        inner += `<span class="badge ${badges[sq]}" aria-hidden="true">${badges[sq] === "good" ? "✓" : "✕"}</span>`;
      }
      squares += `<div data-sq="${sq}" class="${cls.join(" ")}">${inner}</div>`;
    }
  }
  let pieces = "";
  for (const [sq, piece] of Object.entries(board)) {
    if (!piece) continue;
    pieces += `<img class="pc" data-at="${sq}" src="${pieceSrc(piece)}" alt="" draggable="false" style="transform:${pieceTransform(sq)}">`;
  }
  return `<div class="squares">${squares}</div><div class="pieces">${pieces}</div>`;
}
