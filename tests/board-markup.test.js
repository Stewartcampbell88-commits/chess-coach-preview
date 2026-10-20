import test from "node:test"; import assert from "node:assert/strict";
import { boardMarkup, pieceSrc, squareXY, squareFromXY, pieceTransform } from "../js/ui/board-markup.js";
import { parseFen } from "../js/chess/board.js";
const { board } = parseFen("4k3/8/8/4q3/8/5N2/8/6K1 w - - 0 1");
test("64 squares with data-sq, SVG pieces only", () => { const h = boardMarkup(board);
  assert.equal(h.match(/data-sq="/g).length, 64);
  assert.equal(h.match(/<img /g).length, 4);
  assert.ok(h.includes('src="assets/pieces/cburnett/wN.svg"')); assert.ok(h.includes('src="assets/pieces/cburnett/bQ.svg"'));
  assert.ok(!/[♔♕♖♗♘♙♚♛♜♝♞♟]/.test(h)); });
test("coordinates sit inside edge squares like a phone app", () => { const h = boardMarkup(board);
  assert.equal(h.match(/class="coord rank/g).length, 8); assert.equal(h.match(/class="coord file/g).length, 8);
  assert.match(h, /data-sq="a8"[^>]*>(?:(?!<\/div>).)*coord rank[^>]*>8</s); assert.match(h, /data-sq="h1"[^>]*>(?:(?!<\/div>).)*coord file[^>]*>h</s); });
test("marks render as classes", () => { const h = boardMarkup(board, { lastMove: ["f3", "e5"], selected: "f3", legal: { quiet: ["d4"], captures: ["e5"] }, hint: ["f3"], marks: ["e5"], badges: { e5: "good" } });
  assert.match(h, /data-sq="f3" class="[^"]*\blast\b[^"]*\bsel\b[^"]*\bhint\b/); assert.match(h, /data-sq="d4" class="[^"]*\bdot\b/);
  assert.match(h, /data-sq="e5" class="[^"]*\bcap\b[^"]*\bmarked\b/); assert.ok(h.includes('badge good')); });
test("pieceSrc and squareXY", () => { assert.equal(pieceSrc("p"), "assets/pieces/cburnett/bP.svg"); assert.equal(pieceSrc("K"), "assets/pieces/cburnett/wK.svg");
  assert.deepEqual(squareXY("a8"), [0, 0]); assert.deepEqual(squareXY("h1"), [7, 7]); });
test("Black orientation: h1 top-left, a8 bottom-right", () => {
  assert.deepEqual(squareXY("h1", "b"), [0, 0]);
  assert.deepEqual(squareXY("a8", "b"), [7, 7]);
  assert.equal(squareFromXY(0, 0, "b"), "h1");
  assert.equal(squareFromXY(7, 7, "w"), "h1");
  assert.equal(squareFromXY(8, 0, "w"), null);
  assert.equal(squareFromXY(-1, 3, "b"), null);
  for (const sq of ["a1", "e4", "h8", "c6"]) for (const o of ["w", "b"]) {
    const [x, y] = squareXY(sq, o); assert.equal(squareFromXY(x, y, o), sq);
  }
  assert.equal(pieceTransform("a8", "b"), "translate(700%, 700%)");
  assert.equal(pieceTransform("a8"), "translate(0%, 0%)");
});
test("Black orientation markup: first square h1, coords on h-file and rank 8", () => {
  const html = boardMarkup({ e4: "P" }, { orientation: "b" });
  const squares = [...html.matchAll(/data-sq="(\w\d)"/g)].map((m) => m[1]);
  assert.equal(squares[0], "h1"); assert.equal(squares[63], "a8");
  assert.match(html, /data-sq="h1" class="[^"]*"><span class="coord rank">1<\/span>/);
  assert.match(html, /data-sq="h8" class="[^"]*"><span class="coord rank">8<\/span><span class="coord file">h<\/span>/);
  assert.match(html, /data-sq="a8" class="[^"]*"><span class="coord file">a<\/span><\/div>/);
  assert.doesNotMatch(html, /data-sq="a1" class="[^"]*"><span class="coord rank">/);
  assert.match(html, /data-at="e4"[^>]*translate\(300%, 300%\)/);
});
test("White orientation unchanged", () => {
  const squares = [...boardMarkup({}, {}).matchAll(/data-sq="(\w\d)"/g)].map((m) => m[1]);
  assert.equal(squares[0], "a8"); assert.equal(squares[63], "h1");
});
