// Theme detectors: does the key move really show the level's idea?
import { Chess } from "chess.js";
import { VALUES, hangingSquares } from "./see.mjs";
import { moveLan } from "./common.mjs";

export function isBackRankMate(fen) {
  const c = new Chess(fen);
  if (!c.isCheckmate()) return false;
  const loser = c.turn(), back = loser === "w" ? 1 : 8, fwd = loser === "w" ? 1 : -1;
  const k = c.board().flat().find((p) => p && p.type === "k" && p.color === loser);
  if (!k || Number(k.square[1]) !== back) return false;
  const heavy = c.attackers(k.square, loser === "w" ? "b" : "w")
    .some((s) => Number(s[1]) === back && "rq".includes(c.get(s).type));
  const f = "abcdefgh".indexOf(k.square[0]);
  const front = [f - 1, f, f + 1].filter((x) => x >= 0 && x < 8).map((x) => "abcdefgh"[x] + (back + fwd));
  return heavy && front.filter((s) => c.get(s)?.color === loser).length >= 2;
}

/** tag -> (fen, firstMoveLan) => boolean. Tags without an entry have no theme check. */
export const THEMES = {};

const val = (t) => (t === "k" ? 100 : VALUES[t]);

/** Enemy pieces the piece on `sq` attacks that are worth hitting: the king, anything worth more, or anything loose. */
export function targetsOf(fen, sq) {
  const c = new Chess(fen);
  const me = c.get(sq);
  if (!me) return [];
  const enemy = me.color === "w" ? "b" : "w";
  const loose = new Set(hangingSquares(fen, enemy));
  return c.board().flat()
    .filter((p) => p && p.color === enemy && c.attackers(p.square, me.color).includes(sq))
    .filter((p) => p.type === "k" || val(p.type) > val(me.type) || loose.has(p.square))
    .map((p) => p.square).sort();
}

export function worthyTargets(fen, colour) {
  const c = new Chess(fen);
  const out = new Set();
  for (const p of c.board().flat()) if (p && p.color === colour) for (const t of targetsOf(fen, p.square)) out.add(t);
  return [...out].sort();
}

/** The moved piece (optionally of `type`) hits at least two worthwhile targets. */
export function isFork(fen, lan, type) {
  const c = new Chess(fen);
  const m = moveLan(c, lan);
  if (!m || (type && m.piece !== type)) return false;
  return targetsOf(c.fen(), m.to).length >= 2;
}

/** At least two worthwhile targets are newly attacked (by any of the mover's pieces). */
export function isDoubleAttack(fen, lan) {
  const me = new Chess(fen).turn();
  const pre = new Set(worthyTargets(fen, me));
  const c = new Chess(fen);
  if (!moveLan(c, lan)) return false;
  return worthyTargets(c.fen(), me).filter((s) => !pre.has(s)).length >= 2;
}

Object.assign(THEMES, {
  "fork-n": (f, m) => isFork(f, m, "n"),
  "fork-q": (f, m) => isFork(f, m, "q"),
  "fork-p": (f, m) => isFork(f, m, "p"),
  double: isDoubleAttack,
});
