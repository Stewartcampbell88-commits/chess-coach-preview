// Exact forced-mate search (chess.js). n = number of the attacker's moves.
import { Chess } from "chess.js";
import { moveLan } from "./common.mjs";

const movesOf = (c) => c.moves({ verbose: true });

/** Can the side to move force mate within n of its own moves? */
export function forcesMate(c, n) {
  if (n < 1) return false;
  for (const m of movesOf(c)) {
    c.move(m);
    const ok = matesOrForces(c, n);
    c.undo();
    if (ok) return true;
  }
  return false;
}

// After the attacker's move: mate now, or every reply still loses within n-1.
function matesOrForces(c, n) {
  if (c.isCheckmate()) return true;
  if (n < 2 || c.isGameOver()) return false;
  for (const r of movesOf(c)) {
    c.move(r);
    const ok = forcesMate(c, n - 1);
    c.undo();
    if (!ok) return false;
  }
  return true;
}

export function mateLength(fen, max) {
  const c = new Chess(fen);
  for (let n = 1; n <= max; n++) if (forcesMate(c, n)) return n;
  return 0;
}

export function mateKeys(c, n) {
  return movesOf(c).filter((m) => {
    c.move(m);
    const ok = matesOrForces(c, n);
    c.undo();
    return ok;
  }).map((m) => m.lan).sort();
}

/** Defender's reply: longest resistance, then fewest mating answers, then alphabetical. */
export function bestDefence(c, n) {
  let best = null;
  for (const r of movesOf(c)) {
    c.move(r);
    let len = 1;
    while (len < n && !forcesMate(c, len)) len++;
    const answers = mateKeys(c, len).length;
    c.undo();
    const cand = { lan: r.lan, len, answers };
    if (!best || cand.len > best.len
      || (cand.len === best.len && (cand.answers < best.answers || (cand.answers === best.answers && cand.lan < best.lan)))) best = cand;
  }
  return best.lan;
}

export function mateTree(fen, n) {
  const c = new Chess(fen);
  const tree = {};
  for (const k of mateKeys(c, n)) {
    moveLan(c, k);
    if (c.isCheckmate()) tree[k] = null;
    else {
      const reply = bestDefence(c, n - 1);
      moveLan(c, reply);
      tree[k] = { reply, next: mateTree(c.fen(), n - 1) };
      c.undo();
    }
    c.undo();
  }
  return tree;
}
