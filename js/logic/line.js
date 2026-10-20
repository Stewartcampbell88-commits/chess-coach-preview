// Multi-move ("line") puzzles. The player's moves must follow `tree`:
//   tree = { [uci]: null | { reply: uci, next: tree } }   (null = solved)
const has = (o, k) => o !== null && typeof o === "object" && Object.prototype.hasOwnProperty.call(o, k);

export function lineStart(puzzle) {
  return { node: puzzle.tree || null, plies: [] };
}

export function lineStep(state, uci) {
  const key = String(uci || "").toLowerCase();
  if (!has(state.node, key)) return { result: "wrong", state };
  const child = state.node[key];
  if (child === null) return { result: "solved", state: { node: null, plies: [...state.plies, key] } };
  return {
    result: "continue",
    reply: child.reply,
    state: { node: child.next, plies: [...state.plies, key, child.reply] },
  };
}

export function lineKeys(state) {
  return state.node ? Object.keys(state.node).sort() : [];
}

/** Player and reply plies, always taking the first sorted key. */
export function lineMainline(tree) {
  const out = [];
  let node = tree;
  while (node && Object.keys(node).length) {
    const k = Object.keys(node).sort()[0];
    out.push(k);
    const child = node[k];
    if (!child) break;
    out.push(child.reply);
    node = child.next;
  }
  return out;
}

export function treeStats(tree) {
  let keys = 0, depth = 0, maxBranch = 0;
  (function walk(node, d) {
    if (!node) return;
    const ks = Object.keys(node);
    if (!ks.length) return;
    keys += ks.length;
    maxBranch = Math.max(maxBranch, ks.length);
    depth = Math.max(depth, d);
    for (const k of ks) if (node[k]) walk(node[k].next, d + 1);
  })(tree, 1);
  return { keys, depth, maxBranch };
}
