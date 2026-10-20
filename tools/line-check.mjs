// Validator for kind "line" puzzles. Recomputes the move tree and compares.
import { Chess } from "chess.js";
import { treeStats, lineMainline } from "../js/logic/line.js";
import { mateTree, mateLength } from "./mate.mjs";
import { isBackRankMate, THEMES } from "./themes.mjs";
import { sanOf, playLine, pieceCount } from "./common.mjs";

export const LIMITS = { keys: 12, depth: 3, branch: 4 };

function sortTree(t) {
  if (!t) return t;
  return Object.fromEntries(Object.keys(t).sort().map((k) => [k, t[k] && { reply: t[k].reply, next: sortTree(t[k].next) }]));
}
export const canonTree = (t) => JSON.stringify(sortTree(t));

export function basicChecks(p) {
  const errs = [];
  const fields = String(p.fen || "").trim().split(/\s+/);
  if (fields.length !== 6) errs.push("FEN must have 6 fields");
  let c;
  try { c = new Chess(p.fen); } catch { return [...errs, "FEN does not load in chess.js"]; }
  if (c.isGameOver()) errs.push("game is already over");
  const other = [...fields]; other[1] = fields[1] === "w" ? "b" : "w"; other[3] = "-";
  try { if (new Chess(other.join(" ")).inCheck()) errs.push("illegal: side not to move is in check"); }
  catch { errs.push("illegal position"); }
  const side = c.turn() === "w" ? "White" : "Black";
  if (!String(p.prompt || "").startsWith(`${side} to move`)) errs.push(`prompt must start "${side} to move"`);
  if (!p.explain) errs.push("missing explain");
  if (!["mate", "engine", "tb", "book"].includes(p.goal)) errs.push(`unknown goal ${p.goal}`);
  return errs;
}

export function treeErrors(fen, tree, { allowCastle = false } = {}) {
  const errs = [];
  const st = treeStats(tree);
  if (!st.keys) errs.push("tree has no moves");
  if (st.keys > LIMITS.keys) errs.push(`tree too big (${st.keys} keys > ${LIMITS.keys})`);
  if (st.depth > LIMITS.depth) errs.push(`line too long (${st.depth} > ${LIMITS.depth} moves)`);
  if (st.maxBranch > LIMITS.branch) errs.push(`too many accepted moves at one point (${st.maxBranch} > ${LIMITS.branch})`);
  (function walk(f, node, path) {
    if (!node) return;
    const c = new Chess(f);
    const legal = new Map(c.moves({ verbose: true }).map((m) => [m.lan, m]));
    for (const [k, child] of Object.entries(node)) {
      const m = legal.get(k);
      if (!m) { errs.push(`${path}${k}: not legal`); continue; }
      if (m.promotion && m.promotion !== "q") errs.push(`${path}${k}: under-promotion not allowed`);
      if (!allowCastle && (m.isKingsideCastle() || m.isQueensideCastle())) errs.push(`${path}${k}: castling not allowed here`);
      if (!child) continue;
      c.move(m);
      const r = c.moves({ verbose: true }).find((x) => x.lan === child.reply);
      if (!r) errs.push(`${path}${k}: reply ${child.reply} not legal`);
      else { c.move(r); walk(c.fen(), child.next, `${path}${k} ${child.reply} `); c.undo(); }
      c.undo();
    }
  })(fen, tree, "");
  return errs;
}

/** Builds the tree a goal implies. spec: { fen, goal, n, result }. Pushes soundness problems to errs. */
export async function suggestLine(spec, ctx, errs) {
  if (spec.goal === "mate") {
    const len = mateLength(spec.fen, spec.n);
    if (len !== spec.n) errs.push(len ? `actually mate in ${len}` : `no forced mate in ${spec.n}`);
    return mateTree(spec.fen, spec.n);
  }
  if (spec.goal === "engine" && ctx.engineTree) return ctx.engineTree(spec.fen, spec.n, ctx.engine, errs);
  if (spec.goal === "tb" && ctx.tbTree) return ctx.tbTree(spec.fen, spec.n, spec.result, ctx.tablebase, errs);
  throw new Error(`no suggestion for goal ${spec.goal}`);
}

export async function validateLine(p, ctx) {
  const errs = basicChecks(p);
  if (errs.length) return errs;
  errs.push(...treeErrors(p.fen, p.tree, { allowCastle: p.goal === "book" }));
  if (errs.length) return errs;

  let expected = null;
  if (p.goal === "mate") {
    if (![1, 2, 3].includes(p.mateIn)) return [...errs, "mate: mateIn must be 1, 2 or 3"];
    if (p.mateIn === 3 && pieceCount(p.fen) > 6) return [...errs, "mate: mate in 3 only with ≤ 6 pieces"];
    const len = mateLength(p.fen, p.mateIn);
    if (len !== p.mateIn) return [...errs, len ? `mate: actually mate in ${len}` : `mate: no forced mate in ${p.mateIn}`];
    expected = mateTree(p.fen, p.mateIn);
    if (p.tag === "backrank" && !isBackRankMate(playLine(p.fen, lineMainline(p.tree)))) {
      errs.push("backrank: the main line does not end in a back-rank mate");
    }
  } else if (p.goal === "engine") {
    if (!ctx.engineTree) return [...errs, "engine goal needs tools/engine.mjs"];
    expected = await ctx.engineTree(p.fen, p.length, ctx.engine, errs);
    await ctx.engineExtras(p, errs);
  } else if (p.goal === "tb") {
    if (!ctx.tbTree) return [...errs, "tb goal needs tools/tablebase.mjs"];
    expected = await ctx.tbTree(p.fen, p.length, p.result, ctx.tablebase, errs);
  } else if (p.goal === "book") {
    if (!ctx.bookChecks) return [...errs, "book goal is not supported yet (v8.2)"];
    await ctx.bookChecks(p, ctx.engine, errs);
  }
  if (expected && canonTree(expected) !== canonTree(p.tree)) {
    errs.push(`tree differs from computed:\n    got      ${canonTree(p.tree)}\n    expected ${canonTree(expected)}`);
  }
  const theme = THEMES[p.tag];
  const first = lineMainline(p.tree)[0];
  if (theme && p.goal !== "mate" && !theme(p.fen, first)) errs.push(`${p.tag}: first move ${first} does not show the theme`);
  const san = (sanOf(p.fen, first) || "").replace(/[+#]$/, "");
  if (!p.explain.includes(san)) errs.push(`explain must mention the first move (${san})`);
  return errs;
}
