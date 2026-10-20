// Pure board markup: squares (with highlight classes + inside-corner coordinates)
// and an absolutely positioned piece layer using bundled SVG pieces (cburnett, GPLv2+).
// orientation "w" = White at the bottom, "b" = Black at the bottom.
import { FILES, isLightSquare } from "../chess/board.js";

export const PIECE_DIR = "assets/pieces/cburnett";

export function pieceSrc(piece) {
  const colour = piece === piece.toUpperCase() ? "w" : "b";
  return `${PIECE_DIR}/${colour}${piece.toUpperCase()}.svg`;
}

/** [x, y] display grid position: x left→right, y top→bottom. */
export function squareXY(sq, orientation = "w") {
  const x = FILES.indexOf(sq[0]), y = 8 - Number(sq[1]);
  return orientation === "b" ? [7 - x, 7 - y] : [x, y];
}

/** Inverse of squareXY; null when off the board. */
export function squareFromXY(x, y, orientation = "w") {
  if (!(x >= 0 && x <= 7 && y >= 0 && y <= 7)) return null;
  const fx = orientation === "b" ? 7 - x : x, fy = orientation === "b" ? 7 - y : y;
  return FILES[fx] + (8 - fy);
}

export function pieceTransform(sq, orientation = "w") {
  const [x, y] = squareXY(sq, orientation);
  return `translate(${x * 100}%, ${y * 100}%)`;
}

/**
 * opts: orientation "w"|"b", lastMove [from,to], selected, legal {quiet,captures}, hint [],
 *       marks [] (tap puzzles), rings [] (answer squares), badges {sq: "good"|"bad"}
 */
export function boardMarkup(board, opts = {}) {
  const {
    orientation = "w", lastMove = [], selected = null, legal = { quiet: [], captures: [] },
    hint = [], marks = [], rings = [], badges = {},
  } = opts;
  const last = new Set(lastMove), quiet = new Set(legal.quiet), caps = new Set(legal.captures);
  const hints = new Set(hint), marked = new Set(marks), ring = new Set(rings);
  let squares = "";
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const sq = squareFromXY(x, y, orientation);
      const cls = ["sq", isLightSquare(sq) ? "light" : "dark"];
      if (last.has(sq)) cls.push("last");
      if (selected === sq) cls.push("sel");
      if (hints.has(sq)) cls.push("hint");
      if (quiet.has(sq)) cls.push("dot");
      if (caps.has(sq)) cls.push("cap");
      if (ring.has(sq)) cls.push("ring");
      if (marked.has(sq)) cls.push("marked");
      let inner = "";
      if (x === 0) inner += `<span class="coord rank">${sq[1]}</span>`;
      if (y === 7) inner += `<span class="coord file">${sq[0]}</span>`;
      if (badges[sq]) {
        inner += `<span class="badge ${badges[sq]}" aria-hidden="true">${badges[sq] === "good" ? "✓" : "✕"}</span>`;
      }
      squares += `<div data-sq="${sq}" class="${cls.join(" ")}">${inner}</div>`;
    }
  }
  let pieces = "";
  for (const [sq, piece] of Object.entries(board)) {
    if (!piece) continue;
    pieces += `<img class="pc" data-at="${sq}" src="${pieceSrc(piece)}" alt="" draggable="false" style="transform:${pieceTransform(sq, orientation)}">`;
  }
  return `<div class="squares">${squares}</div><div class="pieces">${pieces}</div>`;
}
