// "engine" goal: keys = moves within NEAR of best; must be sharp and not losing.
import { Chess } from "chess.js";
import { fenAfterLan, playLine, materialBalance } from "./common.mjs";
import { lineMainline } from "../js/logic/line.js";

export const NEAR = 50, MARGIN = 200, FLOOR = -100;
const GAIN_TAGS = new Set(["fork-n", "fork-q", "fork-p", "double", "pin-make", "pin-win", "skewer"]);

export async function engineTree(fen, length, engine, errs, path = "") {
  const lines = await engine.analyse(fen);
  const best = lines[0].score;
  const keys = lines.filter((l) => l.score >= best - NEAR).map((l) => l.uci).sort();
  const others = lines.filter((l) => l.score < best - NEAR);
  if (!others.length && new Chess(fen).moves().length > lines.length) errs.push(`${path}not sharp: top ${lines.length} moves all within ${NEAR}cp`);
  if (others.length && others[0].score > best - MARGIN) errs.push(`${path}not sharp: ${others[0].uci} only ${best - others[0].score}cp worse`);
  if (best < FLOOR) errs.push(`${path}best move still loses (${best}cp)`);
  const tree = {};
  for (const k of keys) {
    const after = fenAfterLan(fen, k);
    if (length <= 1 || new Chess(after).isGameOver()) { tree[k] = null; continue; }
    const reply = (await engine.analyse(after, { multipv: 1 }))[0].uci;
    tree[k] = { reply, next: await engineTree(fenAfterLan(after, reply), length - 1, engine, errs, `${path}${k} ${reply} `) };
  }
  return tree;
}

/** Tactic tags must win material along the main line (or mate). */
export async function engineExtras(p, errs) {
  if (!GAIN_TAGS.has(p.tag)) return;
  const end = playLine(p.fen, lineMainline(p.tree));
  const me = new Chess(p.fen).turn();
  if (new Chess(end).isCheckmate()) return;
  const gain = materialBalance(end, me) - materialBalance(p.fen, me);
  if (gain < 2) errs.push(`${p.tag}: main line only gains ${gain} (need ≥ 2)`);
}
