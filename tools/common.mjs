// Shared chess.js helpers for the dev-only validator.
import { Chess } from "chess.js";
import { VALUES } from "./see.mjs";

export function moveLan(c, lan) {
  try { return c.move({ from: lan.slice(0, 2), to: lan.slice(2, 4), promotion: lan[4] }); } catch { return null; }
}
export function fenAfterLan(fen, lan) {
  const c = new Chess(fen);
  return moveLan(c, lan) ? c.fen() : null;
}
export function sanOf(fen, lan) {
  const c = new Chess(fen);
  const m = moveLan(c, lan);
  return m ? m.san : null;
}
export function playLine(fen, lans) {
  const c = new Chess(fen);
  for (const l of lans) if (!moveLan(c, l)) return null;
  return c.fen();
}
export function pieceCount(fen) {
  return new Chess(fen).board().flat().filter(Boolean).length;
}
/** Material (P=1 N=B=3 R=5 Q=9) for `colour` minus the other side. */
export function materialBalance(fen, colour) {
  let s = 0;
  for (const p of new Chess(fen).board().flat()) if (p && p.type !== "k") s += (p.color === colour ? 1 : -1) * VALUES[p.type];
  return s;
}
