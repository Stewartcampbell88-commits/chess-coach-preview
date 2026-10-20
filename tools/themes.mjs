// Theme detectors: does the key move really show the level's idea?
import { Chess } from "chess.js";

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
