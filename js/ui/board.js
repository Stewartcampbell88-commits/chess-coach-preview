// Interactive board (DOM). Drag-and-drop and tap-tap moves via pointer events,
// legal-move dots, slide animation, shake, square badges. Rendering is delegated
// to the pure boardMarkup().
import { FILES, applyUci } from "../chess/board.js";
import { boardMarkup, pieceTransform } from "./board-markup.js";
import { legalTargets } from "../chess/rules.js";
import { nextSelection } from "../logic/answer.js";

const EMPTY = { quiet: [], captures: [] };
const reducedMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const isWhite = (p) => Boolean(p) && p === p.toUpperCase();

export function createBoard(host, { onMove = () => {}, onMark = () => {}, onSelect = () => {} } = {}) {
  const el = document.createElement("div");
  el.className = "cb";
  el.setAttribute("role", "grid");
  el.setAttribute("aria-label", "Chess board");
  host.replaceChildren(el);

  let st = { fen: "", board: {}, mode: "view", sel: null, lastMove: [], hint: [], marks: [], rings: [], badges: {} };
  let drag = null;

  function paint() {
    const legal = st.mode === "move" && st.sel ? legalTargets(st.fen, st.sel) : EMPTY;
    el.innerHTML = boardMarkup(st.board, { ...st, selected: st.sel, legal });
    el.dataset.mode = st.mode;
  }

  function squareAt(e) {
    const r = el.getBoundingClientRect();
    const x = Math.floor(((e.clientX - r.left) / r.width) * 8);
    const y = Math.floor(((e.clientY - r.top) / r.height) * 8);
    if (x < 0 || x > 7 || y < 0 || y > 7) return null;
    return FILES[x] + (8 - y);
  }

  function select(sq) {
    st.sel = sq;
    paint();
    if (sq) onSelect(sq);
  }

  el.addEventListener("pointerdown", (e) => {
    if (st.mode === "view" || (e.button !== undefined && e.button > 0)) return;
    const sq = squareAt(e);
    if (!sq) return;
    e.preventDefault();
    if (st.mode === "mark") { onMark(sq); return; }
    if (isWhite(st.board[sq])) {
      const wasSelected = st.sel === sq;
      if (!wasSelected) select(sq);
      drag = { from: sq, x0: e.clientX, y0: e.clientY, moved: false, wasSelected, id: e.pointerId };
      try { el.setPointerCapture(e.pointerId); } catch {}
      return;
    }
    const r = nextSelection(st.sel, sq, st.board, "w");
    st.sel = r.sel;
    if (r.move) onMove(r.move, { dragged: false });
    else paint();
  });

  el.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
    if (!drag.moved && Math.hypot(dx, dy) < 6) return;
    drag.moved = true;
    const img = el.querySelector(`.pc[data-at="${drag.from}"]`);
    if (!img) return;
    const r = el.getBoundingClientRect();
    const size = r.width / 8;
    img.classList.add("dragging");
    img.style.transform = `translate(${e.clientX - r.left - size / 2}px, ${e.clientY - r.top - size / 2}px) scale(1.12)`;
    el.querySelectorAll(".sq.over").forEach((s) => s.classList.remove("over"));
    const over = squareAt(e);
    if (over) el.querySelector(`[data-sq="${over}"]`)?.classList.add("over");
  });

  function endDrag(e, cancelled) {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    if (cancelled) { paint(); return; }
    const to = squareAt(e);
    if (d.moved) {
      if (to && to !== d.from) {
        st.sel = null;
        onMove(d.from + to, { dragged: true });
      } else {
        paint(); // snap back, keep selection for tap-tap
      }
      return;
    }
    if (d.wasSelected) select(null); // second tap on the same piece deselects
  }
  el.addEventListener("pointerup", (e) => endDrag(e, false));
  el.addEventListener("pointercancel", (e) => endDrag(e, true));

  return {
    el,
    set(partial) { st = { ...st, ...partial }; paint(); },
    get state() { return st; },
    /** Plays a move on the board. Slides the piece unless it was dropped by drag. */
    move(uci, { animate = true } = {}) {
      const from = uci.slice(0, 2), to = uci.slice(2, 4);
      st = { ...st, board: applyUci(st.board, uci), lastMove: [from, to], sel: null };
      paint();
      const img = el.querySelector(`.pc[data-at="${to}"]`);
      if (!img || !animate || reducedMotion()) return Promise.resolve();
      img.style.transition = "none";
      img.style.transform = pieceTransform(from);
      img.getBoundingClientRect();
      img.style.transition = "";
      img.style.transform = pieceTransform(to);
      return new Promise((res) => setTimeout(res, 210));
    },
    shake() {
      if (reducedMotion()) return;
      el.classList.remove("shake");
      void el.offsetWidth;
      el.classList.add("shake");
      setTimeout(() => el.classList.remove("shake"), 320);
    },
  };
}
