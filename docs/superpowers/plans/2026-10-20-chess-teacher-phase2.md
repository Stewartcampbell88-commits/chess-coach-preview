# Chess - Teacher Phase 2 (Worlds 2–6) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Worlds 2–6 playable in three content sub-releases: **v8** (Worlds 2–3, plus endgame review), **v8.2** (World 4) and **v8.3** (Worlds 5–6). (**v8.1** was inserted later as a UI-only release: the winding map + rank ladder.) Every puzzle must be checked by a dev-only validator that understands multi-move solutions, the opponent's replies, Black-to-move positions, opening book lines and short tablebase-checked endgames.

**Architecture:** World 1 kinds (`tap-hanging`, `take-free`, `save-piece`) stay exactly as they are. All new puzzles use one new kind, `"line"`, built around a small **move tree** (`{ [playerUci]: null | { reply, next } }`). The app follows the tree with pure code (`js/logic/line.js`) and never needs an engine. The validator in `tools/` **recomputes every tree** and fails if the stored tree differs:
- **mate:** exact chess.js search.
- **engine:** Stockfish, dev-only.
- **tb:** Lichess tablebase, with responses cached in the repo.
- **book:** opening lines that are authored, then sanity-checked by Stockfish.

The board learns to flip for Black. The puzzle flow plays the opponent's reply and ends a line when the tree ends.

**Tech Stack:** Vanilla ES modules (no build step), GitHub Pages PWA, `node --test`, vendored chess.js 1.4.0 in the app. Dev-only tools: chess.js 1.4.0, the `stockfish` npm package 19.0.1 (WASM, single-threaded "lite" build) and the Lichess tablebase HTTP API (`https://tablebase.lichess.ovh/standard`).

**Spec:** `docs/superpowers/specs/2026-10-20-chess-teacher-design.md`. Phase 1 plan: `docs/superpowers/plans/2026-10-20-chess-teacher-v6.md`.

## Sub-releases (recommended)

| Release | Tasks | What Stewart gets | Why this split |
|---|---|---|---|
| **v8** (`chess-coach-v8`) ✅ shipped | A1–A11 | **World 2** Mate in 1 & 2 and **World 3** Forks & Double Attacks, Black-to-move puzzles on a flipped board, and the opponent replying in 2-move puzzles. From World 3 onward, one endgame warm-up appears in every daily session. | Worlds 2 and 3 need almost all of the new machinery (lines, flipping, mate/engine/tablebase checks), so building it once and shipping two worlds gives the most to play soonest. |
| **v8.1** (`chess-coach-v8.1`) | UI only (no plan tasks) | **Game-style Home**: a winding world map (themed zones, level bubbles with stars, pawn token that hops forward, boss castles, fog over locked worlds), a rank badge, and a **Rank ladder** (Wood → Stone → Bronze → Silver → Gold → Master = Rapid 1500; beating a boss = promotion). | Stewart picked mockup A (map) + B (ladder) on 2026-10-20. Everything is derived from existing progress, so no content or storage change. |
| **v8.2** (`chess-coach-v8.2`) | B1–B3 | **World 4** Pins & Skewers (Silver league) | Adds only new theme detectors and content. Small, so it ships quickly. |
| **v8.3** (`chess-coach-v8.3`) | C1–C4 | **World 5** Survive the Opening and **World 6** Simple Endgames | Openings need the "book" check (`from` replay); endgames reuse the tablebase check from v8. |

Each release is a full test → validate → smoke → screenshots → push → live check cycle. Worlds not yet released stay **Coming soon** on the map.

## Global Constraints

- App name **Chess - Teacher**. No Chess.com logos, wordmarks, piece art or sounds. Keep the v7 look and feel: dark `#312e2b` family, board `#ebecd0` / `#739552`, cburnett SVG pieces, drag and tap-tap moves, coach bubble, Hint/Retry/Next bar, WebAudio sounds, and prefers-reduced-motion respected.
- **Storage key stays `chess-teacher-v6`.** Progress shape `version: 6` is unchanged; new data only adds new ids and tags.
- `APP_VERSION` (`js/version.js`) and the sw `CACHE` move together: `chess-coach-v8`, then `chess-coach-v8.1` (map/rank UI), `chess-coach-v8.2` (World 4), `chess-coach-v8.3` (Worlds 5–6).
- Every file under `js/`, `css/`, `assets/pieces/` (svg) and `icons/` (png) must be in `SHELL` in `sw.js` (enforced by `tests/sw.test.js`).
- Keep the update UX: **Check for update**, **Update available** banner, **Update now**.
- Manifest `id` stays `/chess-coach-preview/`; don't touch icons.
- No build step and no npm runtime dependencies. Stockfish and the tablebase API are **dev-only** (`tools/`). The app never loads Stockfish or calls any API.
- Level = **5 puzzles, 3 lives**. Stars: 3 lives left = 3★, 2 = 2★, 1 = 1★; a hint costs 1★ (min 1). 0 lives = soft retry.
- Boss: 5 fresh positions from a pool of **12 per world (3 per level tag)**, pass mark **4 of 5**, no hints. A failed boss routes back to the weakest level.
- Daily session: 10 puzzles, mix 4 weak-spot / 4 current / 2 review. **From World 3 onward one of the 4 "current" slots is an endgame warm-up** (spec: "Endgame positions are mixed into reviews from World 3 onward").
- Dates are local Brisbane `YYYY-MM-DD` (never `toISOString()`). Australian English copy.
- Every level tag is unique across all worlds (stats and boss grading are keyed by tag).
- Line puzzles: at most **3 player moves**, at most **12 player keys** in the tree, at most **4 accepted moves at any point**. Promotions auto-queen (no under-promotion answers). Castling is allowed only in `book` puzzles.
- The prompt must start with the side to move: `White to move` or `Black to move`. Black-to-move puzzles show the board from Black's side.
- Mixed colours: in Worlds 2–4 at least **6 of 20** level puzzles and **4 of 12** boss puzzles are Black to move.

## Review Focus

1. **The app and validator agree on the tree.** The app only follows `tree` and the validator recomputes it. Pinned by `tools/tests/line-check.test.mjs` and `tests/line.test.js`.
2. **Flipped board input.** Taps and drags on a Black-oriented board must map to the right squares, and Black's own pieces must be draggable. Pinned by `squareFromXY` tests (Task A3) and the v8 smoke test.
3. **Castling, en passant and promotion displays.** After any move the board is redrawn from the chess.js FEN, not from `applyUci`, so the rook moves when castling and the pawn disappears after en passant. Pinned in Task A4 and smoke-tested in v8.3 (book castling).
4. **Old saved progress.** v7 progress must load and show Worlds 2–3 locked until the World 1 boss is passed, with no blank screens. Covered by storage tests (unchanged) and a seeded-progress smoke check.
5. **Engine non-determinism.** Stockfish results are cached in `tools/cache/engine.json` (committed), so re-validation is reproducible offline. Tests never assert an engine reply, only player keys.
6. **Tablebase offline.** Responses are cached in `tools/cache/tablebase.json`. A missing cache entry with no network fails loudly with instructions.

---

## File Structure

```
js/data/puzzles.js          NEW  aggregator: PUZZLES = all world files; puzzlesById()
js/data/puzzles-w2.js       NEW  (v8)   World 2: 20 level + 12 boss line puzzles
js/data/puzzles-w3.js       NEW  (v8)   World 3
js/data/puzzles-drip.js     NEW  (v8)   12 endgame warm-ups (world 6, drip: true)
js/data/puzzles-w4.js       NEW  (v8.2) World 4
js/data/puzzles-w5.js       NEW  (v8.3) World 5 (book)
js/data/puzzles-w6.js       NEW  (v8.3) World 6 (tb + mate)
js/data/worlds.js           MOD  levels/boss per world as each release lands
js/logic/line.js            NEW  pure tree follower: lineStart, lineStep, lineKeys, lineMainline, treeStats
js/logic/session.js         MOD  endgame drip: dripActive, DRIP_PER_SESSION
js/chess/rules.js           MOD  normaliseUci, playUci, turnOf, hintSquares(puzzle, keys), hintText for lines
js/ui/board-markup.js       MOD  orientation: squareXY/squareFromXY/pieceTransform(sq, o)
js/ui/board.js              MOD  orientation + side-to-move aware input, redraw from FEN
js/ui/screens.js            MOD  boss buttons carry data-world; review counts drip ids
js/app.js                   MOD  line play (opponent replies), per-world boss, flipped board
tools/common.mjs            NEW  moveLan, fenAfterLan, sanOf, playLine, pieceCount, materialBalance
tools/mate.mjs              NEW  exact mate search + mateTree
tools/themes.mjs            NEW  fork / double attack / back-rank (v8); pin / skewer / escape (v8.2)
tools/engine.mjs            NEW  Stockfish UCI adapter + cache
tools/tablebase.mjs         NEW  Lichess tablebase adapter + cache
tools/line-check.mjs        NEW  validateLine + suggestLine (mate | engine | tb | book)
tools/validate-puzzles.mjs  MOD  dispatch by kind, async, --suggest-line
tools/cache/engine.json     NEW  committed engine cache
tools/cache/tablebase.json  NEW  committed tablebase cache
tools/tests/*.test.mjs      NEW  mate, themes, engine, tablebase, line-check
tests/line.test.js          NEW
tests/rules.test.js         MOD
tests/board-markup.test.js  MOD
tests/data.test.js          MOD  generic per-world checks
tests/session.test.js       MOD  drip
tests/screens.test.js       MOD
tests/sw.test.js            MOD  version
CREDITS.md / README.md      MOD  Stockfish (dev-only, GPL-3.0), Lichess tablebase API
```

## Puzzle schema (v2, additive)

World 1 objects are unchanged. A **line** puzzle is:

```js
{
  id: "w2-l4-01",            // unique
  world: 2,
  level: "w2-l4" | null,     // null for boss / drip items
  boss: "w2-boss" | null,
  drip: true,                // only on endgame warm-ups
  tag: "m2",                 // unique per level across all worlds
  kind: "line",
  goal: "mate" | "engine" | "tb" | "book",
  fen: "<6-field FEN>",      // side to move = the player; "b" flips the board
  mateIn: 1 | 2 | 3,         // goal "mate" only
  length: 1 | 2 | 3,         // goal "engine" / "tb": player moves in the line
  result: "win" | "draw",    // goal "tb" only
  from: ["e4", "e5", ...],   // goal "book" only: SAN from the start position
  prompt: "White to move. Checkmate in two — checks first.",
  explain: "Qb8+! Rxb8 Rxb8#. ...",  // must mention the first move's SAN
  tree: { "b2b8": { reply: "a8b8", next: { "b1b8": null } } },
}
```

`tree` keys are the **accepted player moves** at that point (lower-case UCI, promotions end in `q`). `null` means solved. `reply` is the opponent's move the app plays. Trees are **generated** with `--suggest-line` and pasted in, never hand-typed. The validator regenerates them and must get an identical result (`book` trees are authored, then engine-checked).

**Goal rules (validator):**
- **mate:** first-move keys = every move that forces mate within `mateIn` (exact search). The position must not have a shorter mate. The reply is the longest resistance, then the reply with the fewest mating answers, then alphabetical. Final keys = every mating move. `mateIn: 3` is allowed only with ≤ 6 pieces.
- **engine:** Stockfish depth 16, MultiPV 8 (mover's point of view):
  - keys = moves within **50 cp** of best
  - the best non-key move must be ≥ **200 cp** worse ("sharp")
  - best ≥ **−100 cp**
  - reply = engine best move
  - `THEMES[tag]` must hold for the main first move
  - tactic tags must gain ≥ **2 points** of material along the main line (or mate)
- **tb:** ≤ 7 pieces, no castling rights. Keys = moves the tablebase scores as keeping the `result`, with under-promotions dropped; there must be 1–3 keys and at least one move that doesn't keep the result. Reply = the tablebase's best defence (`moves[0]`).
- **book:**
  - `from` replays to `fen`
  - every player key scores within **60 cp** of the engine's best and ≥ **−80 cp**
  - replies must be legal
  - keys and replies are the repertoire
- **all line goals:**
  - legal tree, size limits
  - prompt starts with the side to move
  - explain mentions the first move's SAN (without `+`/`#`)
  - side not to move is not in check
  - game not over

---

# Part A — v8: engine room + Worlds 2–3 + endgame warm-ups

Work on branch `v8` (`git checkout -b v8` from an up-to-date `main`). Part B uses branch `v8.2` and Part C uses `v8.3`, each cut from `main` after the previous release is live.

### Task A1: One puzzle aggregator

**Files:**
- Create: `js/data/puzzles.js`
- Modify: `js/app.js:4`, `tests/data.test.js:2`, `tests/boss.test.js:2`, `tests/session.test.js:2`, `tools/validate-puzzles.mjs` (import line)
- Test: `tests/data.test.js`

**Interfaces:**
- Produces: `PUZZLES: Puzzle[]` and `puzzlesById(): Map<string, Puzzle>` from `js/data/puzzles.js`. Every later task imports puzzles **only** from here.

- [ ] **Step 1: Write the failing test.** Append to `tests/data.test.js` and change its import line to `import { PUZZLES, puzzlesById } from "../js/data/puzzles.js";`:

```js
test("aggregator exposes every world file", () => {
  assert.ok(PUZZLES.length >= 32);
  assert.equal(puzzlesById().get("w1-l1-01").world, 1);
  assert.equal(puzzlesById().size, PUZZLES.length);
});
```

- [ ] **Step 2: Run it.** `npm test` → FAIL: `Cannot find module '.../js/data/puzzles.js'`.

- [ ] **Step 3: Implement** `js/data/puzzles.js`:

```js
// Every puzzle in the app. Add each new world file here (and nowhere else).
import { PUZZLES as W1 } from "./puzzles-w1.js";

export const PUZZLES = [...W1];

export function puzzlesById() {
  return new Map(PUZZLES.map((p) => [p.id, p]));
}
```

In `js/app.js` replace `import { PUZZLES, puzzlesById } from "./data/puzzles-w1.js";` with `import { PUZZLES, puzzlesById } from "./data/puzzles.js";`. In `tests/boss.test.js` and `tests/session.test.js` change `"../js/data/puzzles-w1.js"` to `"../js/data/puzzles.js"`. In `tools/validate-puzzles.mjs` change `await import("../js/data/puzzles-w1.js")` to `await import("../js/data/puzzles.js")`. Add `"./js/data/puzzles.js",` to `SHELL` in `sw.js` (after `"./js/data/puzzles-w1.js",`).

- [ ] **Step 4: Run.** `npm test && npm run validate` → all pass, `OK 32 puzzles`.

- [ ] **Step 5: Commit.** `git add -A && git commit -m "refactor: single puzzle aggregator js/data/puzzles.js"`

---

### Task A2: Line logic and rules helpers (pure)

**Files:**
- Create: `js/logic/line.js`, `tests/line.test.js`
- Modify: `js/chess/rules.js`, `tests/rules.test.js`

**Interfaces:**
- Produces (`js/logic/line.js`):
  - `lineStart(puzzle) -> LineState`, where `LineState = { node: Tree|null, plies: string[] }`
  - `lineStep(state, uci) -> { result: "wrong"|"continue"|"solved", reply?: string, state: LineState }`
  - `lineKeys(state) -> string[]` (sorted)
  - `lineMainline(tree) -> string[]` (the player and reply plies, always taking the first sorted key)
  - `treeStats(tree) -> { keys, depth, maxBranch }`
- Produces (`js/chess/rules.js`):
  - `turnOf(fen) -> "w"|"b"`
  - `normaliseUci(fen, uci) -> string|null` (the legal LAN, auto-queening pawns that reach the last rank)
  - `playUci(fen, uci) -> { fen, san, captured: boolean, lan } | null`
  - `hintSquares(puzzle, keys?) -> string[]`
  - `hintText(puzzle) -> string`

- [ ] **Step 1: Write the failing tests.** Create `tests/line.test.js`:

```js
import test from "node:test"; import assert from "node:assert/strict";
import { lineStart, lineStep, lineKeys, lineMainline, treeStats } from "../js/logic/line.js";

const tree = { b5c7: { reply: "e8d7", next: { c7a8: null } } };
const pz = { kind: "line", tree };

test("follows the tree to solved", () => {
  let r = lineStep(lineStart(pz), "b5c7");
  assert.equal(r.result, "continue"); assert.equal(r.reply, "e8d7");
  r = lineStep(r.state, "c7a8");
  assert.equal(r.result, "solved");
  assert.deepEqual(r.state.plies, ["b5c7", "e8d7", "c7a8"]);
  assert.deepEqual(lineKeys(r.state), []);
});
test("off-tree move is wrong and keeps the state", () => {
  const s = lineStart(pz), r = lineStep(s, "b5d6");
  assert.equal(r.result, "wrong"); assert.equal(r.state, s);
});
test("upper-case input is accepted", () => assert.equal(lineStep(lineStart(pz), "B5C7").result, "continue"));
test("prototype keys are never moves", () => {
  assert.equal(lineStep(lineStart(pz), "__proto__").result, "wrong");
  assert.equal(lineStep(lineStart(pz), "constructor").result, "wrong");
});
test("keys are sorted", () => assert.deepEqual(lineKeys(lineStart({ tree: { e1e8: null, d1d8: null } })), ["d1d8", "e1e8"]));
test("mainline takes the first sorted key", () => assert.deepEqual(lineMainline(tree), ["b5c7", "e8d7", "c7a8"]));
test("treeStats", () => {
  assert.deepEqual(treeStats(tree), { keys: 2, depth: 2, maxBranch: 1 });
  assert.deepEqual(treeStats({ d1d8: null, e1e8: null }), { keys: 2, depth: 1, maxBranch: 2 });
  assert.deepEqual(treeStats(null), { keys: 0, depth: 0, maxBranch: 0 });
});
```

Append to `tests/rules.test.js` (extend its import from `../js/chess/rules.js` with `normaliseUci, playUci, turnOf`):

```js
test("normaliseUci: legal LAN, auto-queen, illegal null", () => {
  assert.equal(normaliseUci("8/4P3/8/8/8/8/8/k3K3 w - - 0 1", "e7e8"), "e7e8q");
  assert.equal(normaliseUci("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", "E2E4"), "e2e4");
  assert.equal(normaliseUci("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", "e2e5"), null);
  assert.equal(normaliseUci("bad fen", "e2e4"), null);
});
test("playUci returns SAN, capture flag and the new FEN", () => {
  const r = playUci("4k3/8/8/8/8/8/4q3/4K2R w K - 0 1", "e1e2");
  assert.equal(r.san, "Kxe2"); assert.equal(r.captured, true); assert.equal(turnOf(r.fen), "b");
  const castle = playUci("4k3/8/8/8/8/8/8/4K2R w K - 0 1", "e1g1");
  assert.ok(castle.fen.startsWith("4k3/8/8/8/8/8/8/5RK1 b"));
});
test("line hints highlight the first key's piece", () => {
  const p = { kind: "line", goal: "mate", tag: "m2", tree: { b2b8: { reply: "a8b8", next: { b1b8: null } } } };
  assert.deepEqual(hintSquares(p, ["b2b8"]), ["b2"]);
  assert.deepEqual(hintSquares(p, []), []);
  assert.match(hintText(p), /Checks first/);
  assert.match(hintText({ kind: "line", goal: "engine", tag: "fork-n" }), /two things/);
  assert.match(hintText({ kind: "line", goal: "tb", tag: "eg-opp" }), /opposition/);
  assert.match(hintText({ kind: "line", goal: "book", tag: "op-e4" }), /Develop/);
});
```

- [ ] **Step 2: Run.** `npm test` → FAIL (`line.js` missing; `normaliseUci` not exported).

- [ ] **Step 3: Implement** `js/logic/line.js`:

```js
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
```

In `js/chess/rules.js` add below `isLegalMove`, and **replace** the existing `hintSquares` and `hintText`:

```js
export function turnOf(fen) {
  return String(fen || "").trim().split(/\s+/)[1] === "b" ? "b" : "w";
}

function findMove(c, uci) {
  const u = String(uci || "").toLowerCase();
  if (u.length < 4) return null;
  const promo = u[4] || "q";
  let moves = [];
  try { moves = c.moves({ verbose: true }); } catch { return null; }
  return moves.find((m) => m.from === u.slice(0, 2) && m.to === u.slice(2, 4) && (!m.promotion || m.promotion === promo)) || null;
}

/** The legal LAN for a from+to move (pawns reaching the last rank become queens), or null. */
export function normaliseUci(fen, uci) {
  const c = load(fen);
  const m = c && findMove(c, uci);
  return m ? m.lan : null;
}

/** Plays a move: { fen, san, captured, lan } or null if illegal. Handles castling, en passant, promotion. */
export function playUci(fen, uci) {
  const c = load(fen);
  const m = c && findMove(c, uci);
  if (!m) return null;
  c.move({ from: m.from, to: m.to, promotion: m.promotion });
  return { fen: c.fen(), san: m.san, captured: Boolean(m.captured), lan: m.lan };
}

/** Squares to highlight for a hint. Line puzzles: the piece of the first accepted move. */
export function hintSquares(puzzle, keys = null) {
  if (puzzle.kind === "line") return keys && keys.length ? [[...keys].sort()[0].slice(0, 2)] : [];
  if (puzzle.kind !== "tap-hanging") return [puzzle.accept[0].slice(0, 2)];
  const c = load(puzzle.fen);
  if (!c) return [];
  const target = [...puzzle.accept].sort()[0];
  return [...c.attackers(target, "w")].sort();
}

const LINE_HINTS = {
  mate: "Checks first. The highlighted piece starts the mate.",
  fork: "The highlighted piece can attack two things at once.",
  double: "Look for a move that hits two things — a check plus something loose is ideal.",
  pin: "The highlighted piece can use a line: something valuable is hiding behind.",
  skewer: "Attack the big piece first. What's left behind it?",
  escape: "The highlighted piece is the one that gets you out of trouble.",
  opening: "The highlighted piece is the one to play now. Develop and stay safe.",
  endgame: "The highlighted piece makes the key move. Think opposition and the square of the pawn.",
};

function hintFamily(p) {
  const tag = String(p.tag || "");
  if (p.goal === "mate") return "mate";
  if (p.goal === "book") return "opening";
  if (p.goal === "tb" || tag.startsWith("eg-")) return "endgame";
  if (tag.startsWith("fork")) return "fork";
  if (tag === "double") return "double";
  if (tag === "skewer") return "skewer";
  if (tag === "pin-escape") return "escape";
  if (tag.startsWith("pin")) return "pin";
  return "mate";
}

export function hintText(puzzle) {
  if (puzzle.kind === "line") return LINE_HINTS[hintFamily(puzzle)];
  if (puzzle.kind === "take-free") return "Look at the highlighted piece. What can it take for free?";
  if (puzzle.kind === "save-piece") return "The highlighted piece is in danger. Where would it be safe?";
  return "The highlighted piece is attacking something loose. What is it hitting?";
}
```

- [ ] **Step 4: Run.** `npm test` → all pass (the old hint tests still pass because the World 1 paths didn't change).

- [ ] **Step 5: Commit.** `git add -A && git commit -m "feat: line-puzzle tree follower and move helpers"`

---

### Task A3: Board orientation (flip for Black)

**Files:**
- Modify: `js/ui/board-markup.js` (whole file below), `js/ui/board.js` (whole file below), `tests/board-markup.test.js`

**Interfaces:**
- Consumes: `nextSelection(sel, square, board, turn)` from `js/logic/answer.js` (already takes `turn`).
- Produces:
  - `squareXY(sq, orientation="w") -> [x, y]`
  - `squareFromXY(x, y, orientation="w") -> sq|null`
  - `pieceTransform(sq, orientation="w")`
  - `boardMarkup(board, { ..., orientation })`
  - `createBoard(...).set({ orientation: "w"|"b", turn: "w"|"b", fen, board, ... })`

- [ ] **Step 1: Write the failing tests.** Append to `tests/board-markup.test.js` (extend the import with `squareFromXY`):

```js
test("Black orientation: h1 top-left, a8 bottom-right", () => {
  assert.deepEqual(squareXY("h1", "b"), [0, 0]);
  assert.deepEqual(squareXY("a8", "b"), [7, 7]);
  assert.equal(squareFromXY(0, 0, "b"), "h1");
  assert.equal(squareFromXY(7, 7, "w"), "h1");
  assert.equal(squareFromXY(8, 0, "w"), null);
  for (const sq of ["a1", "e4", "h8", "c6"]) for (const o of ["w", "b"]) {
    const [x, y] = squareXY(sq, o); assert.equal(squareFromXY(x, y, o), sq);
  }
  assert.equal(pieceTransform("a8", "b"), "translate(700%, 700%)");
});
test("Black orientation markup: first square h1, coords on h-file and rank 8", () => {
  const html = boardMarkup({ e4: "P" }, { orientation: "b" });
  const squares = [...html.matchAll(/data-sq="(\w\d)"/g)].map((m) => m[1]);
  assert.equal(squares[0], "h1"); assert.equal(squares[63], "a8");
  assert.match(html, /data-sq="h1" class="[^"]*"><span class="coord rank">1<\/span>/);
  assert.match(html, /data-sq="a8" class="[^"]*"><span class="coord rank">8<\/span><span class="coord file">a<\/span>/);
  assert.doesNotMatch(html, /data-sq="a1" class="[^"]*"><span class="coord rank">/);
});
test("White orientation unchanged", () => {
  const squares = [...boardMarkup({}, {}).matchAll(/data-sq="(\w\d)"/g)].map((m) => m[1]);
  assert.equal(squares[0], "a8"); assert.equal(squares[63], "h1");
});
```

- [ ] **Step 2: Run.** `npm test` → FAIL (`squareFromXY` not exported).

- [ ] **Step 3: Implement.** Replace `js/ui/board-markup.js` with:

```js
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
```

Replace `js/ui/board.js` with:

```js
// Interactive board (DOM). Drag-and-drop and tap-tap moves via pointer events,
// legal-move dots, slide animation, shake, square badges, White/Black orientation.
// Rendering is delegated to the pure boardMarkup().
import { applyUci } from "../chess/board.js";
import { boardMarkup, pieceTransform, squareFromXY } from "./board-markup.js";
import { legalTargets } from "../chess/rules.js";
import { nextSelection } from "../logic/answer.js";

const EMPTY = { quiet: [], captures: [] };
export const reducedMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const isOwn = (p, turn) => Boolean(p) && (turn === "w" ? p === p.toUpperCase() : p === p.toLowerCase());

export function createBoard(host, { onMove = () => {}, onMark = () => {}, onSelect = () => {} } = {}) {
  const el = document.createElement("div");
  el.className = "cb";
  el.setAttribute("role", "grid");
  el.setAttribute("aria-label", "Chess board");
  host.replaceChildren(el);

  let st = {
    fen: "", board: {}, mode: "view", orientation: "w", turn: "w",
    sel: null, lastMove: [], hint: [], marks: [], rings: [], badges: {},
  };
  let drag = null;

  function paint() {
    const legal = st.mode === "move" && st.sel ? legalTargets(st.fen, st.sel) : EMPTY;
    el.innerHTML = boardMarkup(st.board, { ...st, selected: st.sel, legal });
    el.dataset.mode = st.mode;
    el.dataset.orientation = st.orientation;
  }

  function squareAt(e) {
    const r = el.getBoundingClientRect();
    const x = Math.floor(((e.clientX - r.left) / r.width) * 8);
    const y = Math.floor(((e.clientY - r.top) / r.height) * 8);
    return squareFromXY(x, y, st.orientation);
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
    if (isOwn(st.board[sq], st.turn)) {
      const wasSelected = st.sel === sq;
      if (!wasSelected) select(sq);
      drag = { from: sq, x0: e.clientX, y0: e.clientY, moved: false, wasSelected, id: e.pointerId };
      try { el.setPointerCapture(e.pointerId); } catch {}
      return;
    }
    const r = nextSelection(st.sel, sq, st.board, st.turn);
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
    /** Slides a piece (unless dropped by drag). Callers redraw from the real FEN afterwards. */
    move(uci, { animate = true } = {}) {
      const from = uci.slice(0, 2), to = uci.slice(2, 4);
      st = { ...st, board: applyUci(st.board, uci), lastMove: [from, to], sel: null };
      paint();
      const img = el.querySelector(`.pc[data-at="${to}"]`);
      if (!img || !animate || reducedMotion()) return Promise.resolve();
      img.style.transition = "none";
      img.style.transform = pieceTransform(from, st.orientation);
      img.getBoundingClientRect();
      img.style.transition = "";
      img.style.transform = pieceTransform(to, st.orientation);
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
```

- [ ] **Step 4: Run.** `npm test` → all pass. Start `python3 -m http.server 8765` in the repo, then run `node /tmp/shots-tool/smoke7.mjs` (copy it from `/workspace/chess-v7-shots/smoke7.mjs` if `/tmp` was wiped) → 39/39 PASS. World 1 behaviour must be unchanged.

- [ ] **Step 5: Commit.** `git add -A && git commit -m "feat: board orientation for Black-to-move puzzles"`

---

### Task A4: App plays line puzzles, flips for Black, per-world boss

**Files:**
- Modify: `js/app.js` (functions below), `js/ui/screens.js` (`bossNode`, `renderLevelResult`), `tests/screens.test.js`

**Interfaces:**
- Consumes:
  - `lineStart`, `lineStep`, `lineKeys`, `lineMainline` (A2)
  - `normaliseUci`, `playUci`, `turnOf`, `hintSquares(p, keys)`, `hintText` (A2)
  - `reducedMotion` from `js/ui/board.js` and `board.set({ orientation, turn })` (A3)
- Produces:
  - the `data-world="<id>"` attribute on every `play-boss` button
  - `play.fen` (current position) and `play.line` (LineState) in app state

- [ ] **Step 1: Write the failing tests.** Append to `tests/screens.test.js` (it already imports `renderMap`, `renderLevelResult`, `WORLDS`, `P`):

```js
test("boss buttons carry their world id", () => {
  const p = ["w1-l1","w1-l2","w1-l3","w1-l4"].reduce((q, id) => P.recordLevelResult(q, id, 3), P.defaultProgress());
  const html = renderMap(p, WORLDS, { today: "2026-10-20", appVersion: "x" });
  assert.match(html, /data-action="play-boss" data-world="1"/);
  assert.match(renderLevelResult({ levelName: "L", stars: 3, livesLeft: 3, nextLevelName: null, bossUnlocked: true, worldId: 2 }),
    /data-action="play-boss" data-world="2"/);
});
```

(If `P`/`WORLDS` aren't imported in that file yet, add `import * as P from "../js/logic/progress.js";` and `import { WORLDS } from "../js/data/worlds.js";`.)

- [ ] **Step 2: Run.** `npm test` → FAIL (no `data-world`).

- [ ] **Step 3: Implement.**

In `js/ui/screens.js` `bossNode`, replace the two button lines with:

```js
  } else if (status === "passed") action = `<button class="btn grey sm" data-action="play-boss" data-world="${world.id}">Replay boss</button>`;
  else action = `<button class="btn gold sm" data-action="play-boss" data-world="${world.id}">${ICONS.crown} Fight the boss</button>`;
```

In `renderLevelResult`, change the signature to `({ levelName, stars, livesLeft, nextLevelName, bossUnlocked, hintsUsed = 0, worldId = 1 })` and replace the boss button with:

```js
    ? `<button class="btn gold big" data-action="play-boss" data-world="${worldId}">${ICONS.crown} Fight the boss</button>`
```

In `js/app.js`:
1. Change the imports:

```js
import { isLegalMove, hintSquares, hintText, normaliseUci, playUci, turnOf } from "./chess/rules.js";
import { lineStart, lineStep, lineKeys, lineMainline } from "./logic/line.js";
import { createBoard, reducedMotion } from "./ui/board.js";
```

   Remove the old `import { createBoard } from "./ui/board.js";`. Remove `isLegalMove` from the import if nothing else uses it.
2. Add `fen: null, line: null,` to the `play` object.
3. Replace `titleFor`, `resetBoard`, `onMove`, `resolve` (the wrong branch only), `hint`, `finishLevel` (one line), `startBoss` and the `play-boss` case as follows:

```js
function titleFor() {
  if (play.mode === "level") {
    const f = findLevel(play.levelId);
    return `Level ${f.index + 1} · ${f.level.name}`;
  }
  if (play.mode === "boss") return WORLDS.find((w) => w.id === play.worldId)?.boss?.name || "Boss";
  return "Today's session";
}

function resetBoard(extra = {}) {
  const pz = currentPuzzle();
  play.fen = pz.fen;
  play.line = pz.kind === "line" ? lineStart(pz) : null;
  const side = turnOf(pz.fen);
  board.set({
    fen: pz.fen, board: parseFen(pz.fen).board, mode: pz.kind === "tap-hanging" ? "mark" : "move",
    orientation: side, turn: side,
    sel: null, lastMove: [], hint: [], marks: [], rings: [], badges: {}, ...extra,
  });
}

const sideName = (t) => (t === "w" ? "White" : "Black");

async function onMove(uci, { dragged }) {
  const pz = currentPuzzle();
  if (!canAnswer()) return;
  const lan = normaliseUci(play.fen, uci);
  if (!lan) { board.set({ sel: null }); return; } // illegal: snap back, no penalty
  busy = true;
  const played = playUci(play.fen, lan);
  const anim = board.move(lan, { animate: !dragged });
  playSound(played.captured ? "capture" : "move");
  await anim;
  // Redraw from the real position so castling, en passant and promotion look right.
  board.set({ fen: played.fen, board: parseFen(played.fen).board });
  if (pz.kind !== "line") return resolve(checkAnswer(pz, { uci: lan }), lan);
  const step = lineStep(play.line, lan);
  if (step.result === "wrong") return resolve(false, lan);
  play.line = step.state;
  play.fen = played.fen;
  if (step.result === "solved") return resolve(true, lan);
  await wait(reducedMotion() ? 0 : 350);
  const reply = playUci(play.fen, step.reply);
  const ranim = board.move(step.reply, { animate: true });
  playSound(reply.captured ? "capture" : "move");
  await ranim;
  play.fen = reply.fen;
  board.set({ fen: reply.fen, board: parseFen(reply.fen).board, mode: "move", hint: [] });
  refreshChrome({ text: `${sideName(turnOf(pz.fen) === "w" ? "b" : "w")} plays ${reply.san}. Your move — keep going.`, mood: "good" });
  busy = false;
}
```

   In `resolve`, replace the wrong-answer tail, from `if (uci) await wait(550);` to the end of the function, with:

```js
  if (uci) await wait(550);
  const first = pz.kind === "line" ? lineMainline(pz.tree)[0] : pz.accept[0];
  resetBoard({
    mode: "view",
    rings: pz.kind === "tap-hanging" ? pz.accept : [first.slice(0, 2), first.slice(2, 4)],
    badges: uci ? {} : badges, // tap puzzles keep the red cross on wrong picks
  });
  play.phase = "wrong";
  play.picked = [];
  refreshChrome({ text: `${pz.kind === "tap-hanging" ? "The hanging pieces are ringed." : "The right first move is ringed."} ${pz.explain}`, mood: "bad" });
  busy = false;
}
```

   Replace `hint`:

```js
function hint() {
  if (!canAnswer() || play.mode === "boss" || play.hinted) return;
  const pz = currentPuzzle();
  play.hinted = true;
  if (play.phase === "solving") play.hintsUsed += 1;
  board.set({ hint: hintSquares(pz, play.line ? lineKeys(play.line) : null) });
  refreshChrome({ text: hintText(pz), mood: "hint" });
}
```

   In `finishLevel`, pass `worldId: f.world.id` inside the `renderLevelResult({...})` call, and set `play.worldId = f.world.id;` before it. Replace `startBoss` and the action case:

```js
function startBoss(worldId) {
  const world = WORLDS.find((w) => w.id === worldId);
  const status = bossStatus(progress, WORLDS, worldId);
  if (!world || !world.boss || (status !== "open" && status !== "passed")) return;
  const prev = progress.bosses[world.boss.id] || { attempts: 0, lastIds: [] };
  const rng = makeRng(seedFrom(`${today()}#${world.id}#${prev.attempts}`));
  begin("boss", buildBoss(world, PUZZLES, prev.lastIds, rng), { worldId });
}
```

```js
    case "play-boss": return startBoss(Number(el.getAttribute("data-world")) || play.worldId || 1);
```

   `renderBossResult(grade, WORLDS, play.worldId)` already receives the world.

   Note: the boss seed now includes the world id, so a World 1 boss retry on the same day may get a different 5 than before. That's harmless, and the boss tests use `buildBoss` directly.

- [ ] **Step 4: Run.** `npm test` → all pass. With the server on 8765, `node /tmp/shots-tool/smoke7.mjs` → 39/39.

- [ ] **Step 5: Commit.** `git add -A && git commit -m "feat: play multi-move line puzzles with opponent replies; per-world boss"`

---

### Task A5: Validator core: line checks + exact mate search

**Files:**
- Create: `tools/common.mjs`, `tools/mate.mjs`, `tools/themes.mjs` (back-rank only for now), `tools/line-check.mjs`, `tools/tests/mate.test.mjs`, `tools/tests/line-check.test.mjs`
- Modify: `tools/validate-puzzles.mjs` (whole file below)

**Interfaces:**
- Consumes: `treeStats`, `lineMainline` from `js/logic/line.js`; `VALUES`, `hangingSquares`, `validatePuzzle`, `expectedAccept` from `tools/see.mjs`.
- Produces:
  - `tools/common.mjs`:
    - `moveLan(chess, lan) -> Move|null`
    - `fenAfterLan(fen, lan) -> fen|null`
    - `sanOf(fen, lan) -> san|null`
    - `playLine(fen, lans) -> fen|null`
    - `pieceCount(fen) -> number`
    - `materialBalance(fen, colour) -> number`
  - `tools/mate.mjs`:
    - `forcesMate(chess, n) -> boolean`
    - `mateLength(fen, max) -> 0..max`
    - `mateKeys(chess, n) -> string[]`
    - `bestDefence(chess, n) -> lan`
    - `mateTree(fen, n) -> Tree`
  - `tools/themes.mjs`: `isBackRankMate(fen) -> boolean` and `THEMES: Record<tag, (fen, lan) => boolean>`
  - `tools/line-check.mjs`:
    - `LIMITS`
    - `canonTree(tree) -> string`
    - `basicChecks(p) -> string[]`
    - `treeErrors(fen, tree, {allowCastle}) -> string[]`
    - `validateLine(p, ctx) -> Promise<string[]>`
    - `suggestLine(spec, ctx, errs) -> Promise<Tree>`
    - `ctx = { engine, tablebase }`; the engine and tablebase parts are filled in by A6 and A7.

- [ ] **Step 1: Write the failing tests.** `tools/tests/mate.test.mjs`:

```js
import test from "node:test"; import assert from "node:assert/strict";
import { Chess } from "chess.js";
import { mateTree, mateLength } from "../mate.mjs";
import { isBackRankMate } from "../themes.mjs";

const J = JSON.stringify;
test("mate in 1, White and Black", () => {
  assert.equal(J(mateTree("6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1", 1)), J({ d1d8: null }));
  assert.equal(J(mateTree("3r2k1/5ppp/8/8/8/8/5PPP/6K1 b - - 0 1", 1)), J({ d8d1: null }));
});
test("every mating move is accepted", () =>
  assert.equal(J(mateTree("6k1/5ppp/8/8/8/8/5PPP/3RR1K1 w - - 0 1", 1)), J({ d1d8: null, e1e8: null })));
test("mate in 2 with the forced reply", () => {
  const fen = "r5k1/5ppp/8/8/8/8/1Q3PPP/1R4K1 w - - 0 1";
  assert.equal(mateLength(fen, 2), 2);
  assert.equal(J(mateTree(fen, 2)), J({ b2b8: { reply: "a8b8", next: { b1b8: null } } }));
});
test("a mate-in-1 position is not mate in 2", () => assert.equal(mateLength("6k1/5ppp/8/8/8/8/5PPP/3RR1K1 w - - 0 1", 2), 1));
test("back-rank detector", () => {
  const c = new Chess("6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1"); c.move("Rd8#");
  assert.equal(isBackRankMate(c.fen()), true);
  assert.equal(isBackRankMate("6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1"), false);
});
```

`tools/tests/line-check.test.mjs`:

```js
import test from "node:test"; import assert from "node:assert/strict";
import { validateLine, treeErrors } from "../line-check.mjs";

const ctx = { engine: null, tablebase: null };
const base = {
  id: "t", kind: "line", goal: "mate", mateIn: 1, tag: "backrank",
  fen: "6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1",
  prompt: "White to move. Checkmate in one.", explain: "Rd8# — the king is trapped by its own pawns.",
  tree: { d1d8: null },
};
test("a correct mate-in-1 passes", async () => assert.deepEqual(await validateLine(base, ctx), []));
test("wrong side in prompt fails", async () =>
  assert.match((await validateLine({ ...base, prompt: "Black to move. Mate." }, ctx)).join(), /White to move/));
test("explain must name the move", async () =>
  assert.match((await validateLine({ ...base, explain: "Nice." }, ctx)).join(), /explain must mention the first move \(Rd8\)/));
test("tree must match the search", async () =>
  assert.match((await validateLine({ ...base, tree: { d1d7: null } }, ctx)).join(), /tree differs|not legal/));
test("mislabelled mate length fails", async () =>
  assert.match((await validateLine({ ...base, mateIn: 2, tree: { d1d8: null } }, ctx)).join(), /actually mate in 1/));
test("back-rank tag needs a back-rank finish", async () => {
  const p = { ...base, fen: "6k1/8/6K1/8/8/8/8/3R4 w - - 0 1", explain: "Rd8# — the king has no squares.", tree: { d1d8: null } };
  assert.match((await validateLine(p, ctx)).join(), /backrank/);
});
test("illegal reply is caught", () =>
  assert.match(treeErrors("r5k1/5ppp/8/8/8/8/1Q3PPP/1R4K1 w - - 0 1", { b2b8: { reply: "a8a1", next: { b1b8: null } } }).join(), /reply a8a1 not legal/));
test("castling only in book puzzles", () =>
  assert.match(treeErrors("4k3/8/8/8/8/8/8/4K2R w K - 0 1", { e1g1: null }).join(), /castling not allowed/));
```

- [ ] **Step 2: Run.** `npm --prefix tools install --silent && node --test tools/tests/` → FAIL (modules missing).

- [ ] **Step 3: Implement.** `tools/common.mjs`:

```js
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
```

`tools/mate.mjs`:

```js
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
```

`tools/themes.mjs` (A6 and B1 add more detectors to `THEMES`):

```js
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
```

`tools/line-check.mjs` (A6 and A7 fill in `engine` / `tb`):

```js
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
  if (spec.goal === "mate") return mateTree(spec.fen, spec.n);
  if (spec.goal === "engine") return ctx.engineTree(spec.fen, spec.n, ctx.engine, errs);
  if (spec.goal === "tb") return ctx.tbTree(spec.fen, spec.n, spec.result, ctx.tablebase, errs);
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
    if (!ctx.engineTree) return [...errs, "engine goal needs tools/engine.mjs (Task A6)"];
    expected = await ctx.engineTree(p.fen, p.length, ctx.engine, errs);
    await ctx.engineExtras(p, errs);
  } else if (p.goal === "tb") {
    if (!ctx.tbTree) return [...errs, "tb goal needs tools/tablebase.mjs (Task A7)"];
    expected = await ctx.tbTree(p.fen, p.length, p.result, ctx.tablebase, errs);
  } else if (p.goal === "book") {
    if (!ctx.bookChecks) return [...errs, "book goal needs Task C1"];
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
```

Replace `tools/validate-puzzles.mjs`:

```js
// Usage: node tools/validate-puzzles.mjs                                       -> validate every puzzle
//        node tools/validate-puzzles.mjs --suggest "<fen>" <kind>              (World 1 kinds)
//        node tools/validate-puzzles.mjs --suggest-line "<fen>" mate <n>
//        node tools/validate-puzzles.mjs --suggest-line "<fen>" engine <length>
//        node tools/validate-puzzles.mjs --suggest-line "<fen>" tb <length> <win|draw>
import { validatePuzzle, expectedAccept } from "./see.mjs";
import { validateLine, suggestLine } from "./line-check.mjs";
import { makeContext, closeContext } from "./context.mjs";

const args = process.argv.slice(2);
const ctx = await makeContext();
try {
  if (args[0] === "--suggest") {
    console.log(JSON.stringify(expectedAccept({ fen: args[1], kind: args[2] })));
  } else if (args[0] === "--suggest-line") {
    const errs = [];
    const tree = await suggestLine({ fen: args[1], goal: args[2], n: Number(args[3]), result: args[4] || "win" }, ctx, errs);
    console.log(JSON.stringify(tree));
    for (const e of errs) console.error(`WARN ${e}`);
  } else {
    const { PUZZLES } = await import("../js/data/puzzles.js");
    let bad = 0;
    for (const p of PUZZLES) {
      const errs = p.kind === "line" ? await validateLine(p, ctx) : validatePuzzle(p);
      for (const e of errs) { console.log(`FAIL ${p.id}: ${e}`); bad++; }
    }
    if (bad) process.exitCode = 1;
    else console.log(`OK ${PUZZLES.length} puzzles`);
  }
} finally {
  await closeContext(ctx);
}
```

Create `tools/context.mjs`. A6 and A7 extend it, and each extension is shown in full in its own task:

```js
// Wires optional engine / tablebase support into the validator.
export async function makeContext() {
  return { engine: null, tablebase: null };
}
export async function closeContext() {}
```

- [ ] **Step 4: Run.** `node --test tools/tests/` → all pass. `npm run validate` → `OK 32 puzzles` (World 1 still goes through `validatePuzzle`).

- [ ] **Step 5: Commit.** `git add -A && git commit -m "feat(tools): line-puzzle validator with exact mate search"`

---

### Task A6: Stockfish adapter, `engine` goal, fork and double-attack detectors

**Files:**
- Create: `tools/engine.mjs`, `tools/engine-tree.mjs`, `tools/tests/engine.test.mjs`, `tools/tests/themes.test.mjs`, `tools/cache/engine.json` (generated)
- Modify: `tools/package.json` (devDependency), `tools/themes.mjs` (add detectors), `tools/context.mjs`

**Interfaces:**
- Consumes: `moveLan`, `fenAfterLan`, `playLine`, `materialBalance` (A5), and `hangingSquares`, `VALUES` from `see.mjs`.
- Produces:
  - `tools/engine.mjs`:
    - `parseScore(line) -> number|null` (mover POV; mate in N = 100000−N, mated in N = −100000+N)
    - `parseMultiPv(output) -> [{uci, score}]`
    - `analyse(fen, {depth=16, multipv=8}) -> Promise<[{uci, score}]>`
    - `saveCache()`, `stop()`
  - `tools/engine-tree.mjs`:
    - `NEAR=50`, `MARGIN=200`, `FLOOR=-100`
    - `engineTree(fen, length, engine, errs) -> Promise<Tree>`
    - `engineExtras(p, errs)` (material gain for tactic tags)
  - `tools/themes.mjs`:
    - `targetsOf(fen, sq)`, `worthyTargets(fen, colour)`
    - `isFork(fen, lan, type?)`, `isDoubleAttack(fen, lan)`
    - `THEMES["fork-n" | "fork-q" | "fork-p" | "double"]`

- [ ] **Step 1: Add the dependency.** In `tools/package.json` set `"devDependencies": { "chess.js": "1.4.0", "stockfish": "19.0.1" }`, then run `npm --prefix tools install`. Expected: `tools/node_modules/stockfish/bin/stockfish-19-lite-single.js` exists.

- [ ] **Step 2: Write the failing tests.** `tools/tests/engine.test.mjs`:

```js
import test from "node:test"; import assert from "node:assert/strict";
import { parseScore, parseMultiPv, analyse, stop } from "../engine.mjs";
import { engineTree } from "../engine-tree.mjs";
import * as engine from "../engine.mjs";

test("score parsing (mover POV)", () => {
  assert.equal(parseScore("info depth 9 multipv 1 score cp -35 pv e2e4"), -35);
  assert.equal(parseScore("info depth 9 multipv 1 score mate 1 pv h5f7"), 99999);
  assert.equal(parseScore("info depth 9 multipv 1 score mate -2 pv a2a3"), -99998);
});
test("multipv keeps the deepest exact line per slot", () => {
  const out = [
    "info depth 15 seldepth 20 multipv 1 score cp 30 nodes 1 pv e2e4 e7e5",
    "info depth 16 seldepth 21 multipv 1 score cp 25 lowerbound nodes 1 pv d2d4",
    "info depth 16 seldepth 21 multipv 1 score cp 20 nodes 1 pv g1f3",
    "info depth 16 seldepth 21 multipv 2 score cp 10 nodes 1 pv c2c4",
    "bestmove g1f3",
  ].join("\n");
  assert.deepEqual(parseMultiPv(out), [{ uci: "g1f3", score: 20 }, { uci: "c2c4", score: 10 }]);
});
test("engine finds the scholar's mate", async () => {
  const lines = await analyse("r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4", { multipv: 3 });
  assert.equal(lines[0].uci, "h5f7"); assert.equal(lines[0].score, 99999);
});
test("knight fork tree: only Nc7+, then only Nxa8", async () => {
  const errs = [];
  const t = await engineTree("r3k3/8/8/1N6/8/8/PP6/4K3 w - - 0 1", 2, engine, errs);
  assert.deepEqual(errs, []);
  assert.deepEqual(Object.keys(t), ["b5c7"]);
  assert.deepEqual(Object.keys(t.b5c7.next), ["c7a8"]);
});
test("a quiet position is rejected as not sharp", async () => {
  const errs = [];
  await engineTree("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", 1, engine, errs);
  assert.match(errs.join(), /not sharp/);
  stop();
});
```

`tools/tests/themes.test.mjs`:

```js
import test from "node:test"; import assert from "node:assert/strict";
import { isFork, isDoubleAttack, targetsOf } from "../themes.mjs";

test("knight fork of king and rook", () => {
  assert.equal(isFork("r3k3/8/8/1N6/8/8/PP6/4K3 w - - 0 1", "b5c7", "n"), true);
  assert.equal(isFork("r3k3/8/8/1N6/8/8/PP6/4K3 w - - 0 1", "b5c7", "q"), false);
  assert.equal(isFork("r3k3/8/8/1N6/8/8/PP6/4K3 w - - 0 1", "b5d6"), false);
  assert.deepEqual(targetsOf("r3k3/2N5/8/8/8/8/PP6/4K3 b - - 1 1", "c7"), ["a8", "e8"]);
});
test("Black knight fork on a flipped board", () =>
  assert.equal(isFork("4k3/pp3ppp/8/8/1n6/8/5PPP/R3K3 b - - 0 1", "b4c2", "n"), true));
test("double attack needs two new targets", () => {
  assert.equal(isDoubleAttack("r3k3/8/8/1N6/8/8/PP6/4K3 w - - 0 1", "b5c7"), true);
  assert.equal(isDoubleAttack("r3k3/8/8/1N6/8/8/PP6/4K3 w - - 0 1", "a2a3"), false);
});
```

- [ ] **Step 3: Run.** `node --test tools/tests/` → FAIL (modules and exports missing).

- [ ] **Step 4: Implement.** `tools/engine.mjs`:

```js
// Dev-only Stockfish (npm "stockfish" 19.0.1, GPL-3.0). Never shipped to the app.
// Results are cached in tools/cache/engine.json (committed) so validation is reproducible offline.
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const ENGINE = new URL("./node_modules/stockfish/bin/stockfish-19-lite-single.js", import.meta.url);
const CACHE_DIR = new URL("./cache/", import.meta.url);
const CACHE_FILE = new URL("./cache/engine.json", import.meta.url);
export const DEPTH = 16, MULTIPV = 8;

let cache = existsSync(CACHE_FILE) ? JSON.parse(readFileSync(CACHE_FILE, "utf8")) : {};
let dirty = false, proc = null, buf = "", waiter = null;

function start() {
  proc = spawn(process.execPath, [fileURLToPath(ENGINE)], { stdio: ["pipe", "pipe", "inherit"] });
  proc.stdout.on("data", (d) => {
    buf += d;
    if (waiter && waiter.re.test(buf)) { const w = waiter, out = buf; waiter = null; buf = ""; w.resolve(out); }
  });
}
function send(cmd, re) {
  return new Promise((resolve) => { waiter = { re, resolve }; proc.stdin.write(cmd + "\n"); });
}

export function parseScore(line) {
  const m = / score (cp|mate) (-?\d+)/.exec(line);
  if (!m) return null;
  const v = Number(m[2]);
  if (m[1] === "cp") return v;
  return v > 0 ? 100000 - v : -100000 - v;
}

export function parseMultiPv(out) {
  const best = new Map();
  for (const line of out.split("\n")) {
    const d = / depth (\d+) /.exec(line), k = / multipv (\d+) /.exec(line), pv = / pv (\S+)/.exec(line);
    const score = parseScore(line);
    if (!d || !k || !pv || score === null || / (upperbound|lowerbound) /.test(line)) continue;
    const prev = best.get(Number(k[1]));
    if (!prev || Number(d[1]) >= prev.depth) best.set(Number(k[1]), { depth: Number(d[1]), uci: pv[1], score });
  }
  return [...best.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => ({ uci: v.uci, score: v.score }));
}

export async function analyse(fen, { depth = DEPTH, multipv = MULTIPV } = {}) {
  const key = `${fen}|d${depth}|m${multipv}`;
  if (cache[key]) return cache[key];
  if (!proc) { start(); await send("uci", /uciok/); }
  proc.stdin.write(`setoption name MultiPV value ${multipv}\nucinewgame\n`);
  await send("isready", /readyok/);
  const lines = parseMultiPv(await send(`position fen ${fen}\ngo depth ${depth}`, /bestmove/));
  cache[key] = lines;
  dirty = true;
  return lines;
}

export function saveCache() {
  if (!dirty) return;
  mkdirSync(CACHE_DIR, { recursive: true });
  const sorted = Object.fromEntries(Object.keys(cache).sort().map((k) => [k, cache[k]]));
  writeFileSync(CACHE_FILE, JSON.stringify(sorted, null, 1) + "\n");
  dirty = false;
}

export function stop() {
  saveCache();
  if (proc) proc.kill();
  proc = null;
}
```

`tools/engine-tree.mjs`:

```js
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
```

Append to `tools/themes.mjs` (and add `import { VALUES, hangingSquares } from "./see.mjs";` and `import { moveLan } from "./common.mjs";` at the top):

```js
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
```

Replace `tools/context.mjs`:

```js
// Wires engine (and, from A7, tablebase) support into the validator.
import * as engine from "./engine.mjs";
import { engineTree, engineExtras } from "./engine-tree.mjs";

export async function makeContext() {
  return { engine, engineTree, engineExtras, tablebase: null };
}
export async function closeContext(ctx) {
  ctx.engine?.stop();
}
```

- [ ] **Step 5: Run.** `node --test tools/tests/` → all pass (the engine tests take a few seconds and write `tools/cache/engine.json`). `npm run validate` → `OK 32 puzzles`.

- [ ] **Step 6: Commit.** `git add -A && git commit -m "feat(tools): Stockfish-checked engine goal, fork and double-attack detectors"`

---

### Task A7: Tablebase adapter and `tb` goal

**Files:**
- Create: `tools/tablebase.mjs`, `tools/tb-tree.mjs`, `tools/tests/tablebase.test.mjs`, `tools/cache/tablebase.json` (generated)
- Modify: `tools/context.mjs`

**Interfaces:**
- Consumes: `fenAfterLan`, `pieceCount` (A5).
- Produces:
  - `tools/tablebase.mjs`: `probe(fen) -> Promise<{category, moves:[{uci, category, dtm, dtz}]}>` (cached) and `saveCache()`
  - `tools/tb-tree.mjs`: `tbTree(fen, length, result, probe, errs) -> Promise<Tree>`
  - Lichess `moves` are best-first for the side to move. A move's `category` is from the **opponent's** side after the move (`"loss"` = the mover wins).

- [ ] **Step 1: Write the failing test** `tools/tests/tablebase.test.mjs`. It runs offline with fixtures recorded from the real API on 2026-10-20:

```js
import test from "node:test"; import assert from "node:assert/strict";
import { tbTree } from "../tb-tree.mjs";

const FIX = {
  "8/4k3/8/3K4/4P3/8/8/8 w - - 0 1": { category: "win", moves: [
    { uci: "d5e5", category: "loss", dtm: -28, dtz: -4 }, { uci: "e4e5", category: "draw", dtm: 0, dtz: 0 },
    { uci: "d5c4", category: "draw", dtm: 0, dtz: 0 }, { uci: "d5d4", category: "draw", dtm: 0, dtz: 0 },
    { uci: "d5c5", category: "draw", dtm: 0, dtz: 0 }, { uci: "d5c6", category: "draw", dtm: 0, dtz: 0 } ] },
  "8/4k3/8/4K3/4P3/8/8/8 b - - 1 1": { category: "loss", moves: [
    { uci: "e7d7", category: "win", dtm: 27, dtz: 3 }, { uci: "e7f7", category: "win", dtm: 25, dtz: 3 },
    { uci: "e7e8", category: "win", dtm: 25, dtz: 3 }, { uci: "e7f8", category: "win", dtm: 25, dtz: 3 },
    { uci: "e7d8", category: "win", dtm: 23, dtz: 3 } ] },
};
const probe = async (fen) => { if (!FIX[fen]) throw new Error(`no fixture ${fen}`); return FIX[fen]; };

test("opposition: Ke5 is the only win", async () => {
  const errs = [];
  assert.deepEqual(await tbTree("8/4k3/8/3K4/4P3/8/8/8 w - - 0 1", 1, "win", probe, errs), { d5e5: null });
  assert.deepEqual(errs, []);
});
test("reply is the tablebase's best defence (first listed)", async () => {
  const errs = [], seen = [];
  const spy = async (fen) => { seen.push(fen); return FIX[fen] || { category: "win", moves: [{ uci: "e5f5", category: "loss", dtm: -26, dtz: -2 }] }; };
  const t = await tbTree("8/4k3/8/3K4/4P3/8/8/8 w - - 0 1", 2, "win", spy, errs);
  assert.equal(t.d5e5.reply, "e7d7");
});
test("too many winning moves is rejected", async () => {
  const errs = [];
  const many = async () => ({ category: "win", moves: ["e2e3", "e2e4", "e1d1", "e1f1"].map((uci) => ({ uci, category: "loss", dtm: -9, dtz: -1 })) });
  await tbTree("4k3/8/8/8/8/8/4P3/4K3 w - - 0 1", 1, "win", many, errs);
  assert.match(errs.join(), /only-move/);
});
```

- [ ] **Step 2: Run.** `node --test tools/tests/tablebase.test.mjs` → FAIL (module missing).

- [ ] **Step 3: Implement.** `tools/tablebase.mjs`:

```js
// Dev-only Lichess tablebase client (https://tablebase.lichess.ovh). Responses are cached in
// tools/cache/tablebase.json (committed) so validation works offline once filled.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const API = "https://tablebase.lichess.ovh/standard?fen=";
const CACHE_DIR = new URL("./cache/", import.meta.url);
const CACHE_FILE = new URL("./cache/tablebase.json", import.meta.url);
let cache = existsSync(CACHE_FILE) ? JSON.parse(readFileSync(CACHE_FILE, "utf8")) : {};
let dirty = false, last = 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, Math.max(0, ms)));

export async function probe(fen) {
  if (cache[fen]) return cache[fen];
  await sleep(1100 - (Date.now() - last)); // be polite: ≤ 1 request per second
  last = Date.now();
  let res;
  try {
    res = await fetch(API + fen.replace(/ /g, "_"), {
      headers: { "User-Agent": "chess-teacher-validator (github.com/Stewartcampbell88-commits/chess-coach-preview)" },
    });
  } catch (e) {
    throw new Error(`tablebase offline and ${fen} not cached — run npm run validate once with internet (${e.message})`);
  }
  if (!res.ok) throw new Error(`tablebase HTTP ${res.status} for ${fen}`);
  const d = await res.json();
  cache[fen] = {
    category: d.category,
    moves: d.moves.map((m) => ({ uci: m.uci, category: m.category, dtm: m.dtm ?? null, dtz: m.dtz ?? null })),
  };
  dirty = true;
  return cache[fen];
}

export function saveCache() {
  if (!dirty) return;
  mkdirSync(CACHE_DIR, { recursive: true });
  const sorted = Object.fromEntries(Object.keys(cache).sort().map((k) => [k, cache[k]]));
  writeFileSync(CACHE_FILE, JSON.stringify(sorted, null, 1) + "\n");
  dirty = false;
}
```

`tools/tb-tree.mjs`:

```js
// "tb" goal: keys = moves that keep the result (win, or at least a draw). Only-move positions only.
import { Chess } from "chess.js";
import { fenAfterLan, pieceCount } from "./common.mjs";

const KEEPS = { win: ["loss"], draw: ["draw", "blessed-loss", "loss"] };
const queenOnly = (uci) => uci.length === 4 || uci.endsWith("q");

export async function tbTree(fen, length, result, probe, errs, path = "") {
  if (!path) {
    if (pieceCount(fen) > 7) errs.push("tb: more than 7 pieces");
    if (fen.split(" ")[2] !== "-") errs.push("tb: castling rights must be '-'");
    if (!KEEPS[result]) errs.push(`tb: result must be win or draw (got ${result})`);
  }
  const d = await probe(fen);
  const moves = d.moves.filter((m) => queenOnly(m.uci));
  const keys = moves.filter((m) => (KEEPS[result] || []).includes(m.category)).map((m) => m.uci).sort();
  if (!keys.length) errs.push(`${path}tb: no move keeps the ${result}`);
  if (keys.length > 3) errs.push(`${path}tb: ${keys.length} moves keep the ${result} — not an only-move position`);
  if (keys.length === moves.length) errs.push(`${path}tb: every move keeps the ${result} — nothing to find`);
  const tree = {};
  for (const k of keys) {
    const after = fenAfterLan(fen, k);
    if (length <= 1 || new Chess(after).isGameOver()) { tree[k] = null; continue; }
    const reply = (await probe(after)).moves[0].uci; // best defence is listed first
    tree[k] = { reply, next: await tbTree(fenAfterLan(after, reply), length - 1, result, probe, errs, `${path}${k} ${reply} `) };
  }
  return tree;
}
```

Replace `tools/context.mjs`:

```js
// Wires engine and tablebase support into the validator.
import * as engine from "./engine.mjs";
import * as tb from "./tablebase.mjs";
import { engineTree, engineExtras } from "./engine-tree.mjs";
import { tbTree } from "./tb-tree.mjs";

export async function makeContext() {
  return { engine, engineTree, engineExtras, tablebase: tb.probe, tbTree };
}
export async function closeContext(ctx) {
  ctx.engine?.stop();
  tb.saveCache();
}
```

- [ ] **Step 4: Run.** `node --test tools/tests/` → all pass. Live sanity check (needs internet): `node tools/validate-puzzles.mjs --suggest-line "8/4k3/8/3K4/4P3/8/8/8 w - - 0 1" tb 1 win` → prints `{"d5e5":null}`.

- [ ] **Step 5: Commit.** `git add -A && git commit -m "feat(tools): tablebase-checked endgame lines (cached)"`

---

### Task A8: World 2 — Mate in 1 & 2 (content + candidate picker)

**Files:**
- Create: `js/data/puzzles-w2.js`, `tools/pick-lichess.mjs`
- Modify: `js/data/worlds.js` (World 2 entry), `js/data/puzzles.js`, `sw.js` (SHELL), `tests/data.test.js`, `tools/line-check.mjs` (mating-piece check), `tools/tests/line-check.test.mjs`, `.gitignore`

**Interfaces:**
- Consumes: the `--suggest-line` CLI and `validateLine` (A5).
- Produces:
  - World 2 levels `w2-l1..w2-l4`, tags `m1-qr`, `backrank`, `m1-minor`, `m2`; boss `w2-boss`
  - `PUZZLES` now includes 32 World 2 puzzles

**Level brief (5 puzzles each + 3 boss each; ≥ 6 of 20 level puzzles and ≥ 4 of 12 boss Black to move):**

| Level | Tag | Goal | Prompt (exact) | Idea |
|---|---|---|---|---|
| w2-l1 Mate in 1: Queen & Rook | `m1-qr` | mate, `mateIn: 1`, mating piece Q or R | `White to move. Checkmate in one.` / `Black to move. Checkmate in one.` | Queen-and-king mates, queen supported by a piece, rook ladder |
| w2-l2 Back-Rank Mate | `backrank` | mate 1, `isBackRankMate` | same | Rook/queen to the back rank against a king boxed in by its own pawns; include defending-rook decoys |
| w2-l3 Mate in 1: Knight, Bishop & Pawn | `m1-minor` | mate 1, mating piece N, B or P | same | Smothered mate, bishop + queen battery, pawn mates near the king |
| w2-l4 Mate in 2 | `m2` | mate, `mateIn: 2` | `White to move. Checkmate in two — checks first.` / `Black to move. Checkmate in two — checks first.` | Queen sacrifice then back-rank mate, check → forced reply → mate |

**Copy rules for `explain`:** one or two plain sentences in Australian English. Give the move(s) in SAN, then *why* (e.g. "Rd8# — Black's own pawns on f7, g7 and h7 box the king in"). Use no engine numbers.

**Seed puzzles (already verified with the A5 search, so use these as the first entries):**

```js
// js/data/puzzles-w2.js
// World 2: Mate in 1 & 2. Every entry is checked by `npm run validate`:
// the validator recomputes `tree` with an exact mate search and must match.
const M1W = "White to move. Checkmate in one.";
const M1B = "Black to move. Checkmate in one.";
const M2W = "White to move. Checkmate in two — checks first.";
const M2B = "Black to move. Checkmate in two — checks first.";

const L = (id, level, tag, mateIn, prompt, fen, tree, explain, source = null) =>
  ({ id, world: 2, level, boss: null, tag, kind: "line", goal: "mate", mateIn, fen, prompt, explain, tree, ...(source ? { source } : {}) });
const B = (id, tag, mateIn, prompt, fen, tree, explain, source = null) =>
  ({ id, world: 2, level: null, boss: "w2-boss", tag, kind: "line", goal: "mate", mateIn, fen, prompt, explain, tree, ...(source ? { source } : {}) });

export const PUZZLES = [
  // ——— Level 2: Back-Rank Mate ———
  L("w2-l2-01", "w2-l2", "backrank", 1, M1W, "6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1", { d1d8: null },
    "Rd8# — Black's own pawns on f7, g7 and h7 box the king in on the back rank."),
  L("w2-l2-02", "w2-l2", "backrank", 1, M1B, "3r2k1/5ppp/8/8/8/8/5PPP/6K1 b - - 0 1", { d8d1: null },
    "Rd1# — this time it's White whose pawns trap their own king. Always check your back rank!"),
  // ——— Level 4: Mate in 2 ———
  L("w2-l4-01", "w2-l4", "m2", 2, M2W, "r5k1/5ppp/8/8/8/8/1Q3PPP/1R4K1 w - - 0 1",
    { b2b8: { reply: "a8b8", next: { b1b8: null } } },
    "Qb8+! Rxb8 Rxb8#. Give up the queen to drag Black's rook off the back rank, then mate there."),
  // …remaining 29 entries authored with the loop below…
];
```

- [ ] **Step 1: Write the failing data tests.** In `tests/data.test.js`:
  - replace `test("worlds 2-6 coming soon", …)` and `test("no duplicate positions", …)`
  - add the generic checks below
  - add `import { treeStats } from "../js/logic/line.js";`

```js
const live = WORLDS.filter((w) => !w.comingSoon);
test("coming-soon worlds have no levels yet", () => {
  for (const w of WORLDS.filter((w) => w.comingSoon)) assert.equal(w.levels.length, 0, `world ${w.id}`);
});
test("live worlds: 4 levels × 5 puzzles; boss pool 12 = 3 per tag, never in levels", () => {
  for (const w of live) {
    assert.equal(w.levels.length, 4, `world ${w.id}`);
    for (const l of w.levels) {
      const ps = PUZZLES.filter((p) => p.level === l.id);
      assert.equal(ps.length, 5, l.id);
      assert.ok(ps.every((p) => p.tag === l.tag && p.boss === null && p.world === w.id), l.id);
    }
    const b = PUZZLES.filter((p) => p.boss === w.boss.id);
    assert.equal(b.length, 12, w.boss.id);
    for (const l of w.levels) assert.equal(b.filter((p) => p.tag === l.tag).length, 3, `${w.boss.id} ${l.tag}`);
    assert.ok(b.every((p) => p.level === null && p.world === w.id));
  }
});
test("level tags are unique across worlds", () => {
  const tags = WORLDS.flatMap((w) => w.levels.map((l) => l.tag));
  assert.equal(new Set(tags).size, tags.length);
});
test("Worlds 2–4 mix in Black to move (≥ 6 of 20 level, ≥ 4 of 12 boss)", () => {
  const black = (ps) => ps.filter((p) => p.fen.split(" ")[1] === "b").length;
  for (const w of live.filter((w) => w.id >= 2 && w.id <= 4)) {
    assert.ok(black(PUZZLES.filter((p) => p.world === w.id && p.level)) >= 6, `world ${w.id} levels`);
    assert.ok(black(PUZZLES.filter((p) => p.boss === w.boss.id)) >= 4, `world ${w.id} boss`);
  }
});
test("line puzzles have a goal and a non-empty tree", () => {
  for (const p of PUZZLES.filter((p) => p.kind === "line")) {
    assert.ok(["mate", "engine", "tb", "book"].includes(p.goal), p.id);
    assert.ok(treeStats(p.tree).keys > 0, p.id);
  }
});
test("no duplicate positions (placement + side to move)", () =>
  assert.equal(new Set(PUZZLES.map((p) => p.fen.split(" ").slice(0, 2).join(" "))).size, PUZZLES.length));
```

Add the World 2 entry to `js/data/worlds.js` (replacing the `comingSoon: true` line for id 2):

```js
  {
    id: 2,
    name: "Mate in 1 & 2",
    blurb: "Checks first. Back-rank mates.",
    comingSoon: false,
    levels: [
      { id: "w2-l1", name: "Mate in 1: Queen & Rook", tag: "m1-qr" },
      { id: "w2-l2", name: "Back-Rank Mate", tag: "backrank" },
      { id: "w2-l3", name: "Mate in 1: Knight, Bishop & Pawn", tag: "m1-minor" },
      { id: "w2-l4", name: "Mate in 2", tag: "m2" },
    ],
    boss: { id: "w2-boss", name: "Boss: Mate in 1 & 2" },
  },
```

- [ ] **Step 2: Run.** `npm test` → FAIL: `w2-l1` has 0 puzzles.

- [ ] **Step 3: Add the mating-piece rule (validator), with a test.** Append to `tools/tests/line-check.test.mjs`:

```js
test("m1-minor must be mated by a knight, bishop or pawn", async () =>
  assert.match((await validateLine({ ...base, tag: "m1-minor" }, ctx)).join(), /m1-minor: mate is delivered by r/));
```

In `tools/line-check.mjs`, inside the `if (p.goal === "mate")` branch after the back-rank check, add:

```js
    const MATE_PIECES = { "m1-qr": "qr", "m1-minor": "nbp" };
    if (MATE_PIECES[p.tag]) {
      const ml = lineMainline(p.tree);
      const before = playLine(p.fen, ml.slice(0, -1));
      const piece = new Chess(before).get(ml[ml.length - 1].slice(0, 2)).type;
      if (!MATE_PIECES[p.tag].includes(piece)) errs.push(`${p.tag}: mate is delivered by ${piece}, expected one of ${MATE_PIECES[p.tag]}`);
    }
```

Run `node --test tools/tests/` → PASS.

- [ ] **Step 4: Add the candidate picker.** It's optional, but much faster than inventing positions. The Lichess open puzzle database is **CC0** (public domain). Add `tools/data/` to `.gitignore`. Create `tools/pick-lichess.mjs`:

```js
// Dev-only: pick candidate positions from the Lichess open puzzle database (CC0, database.lichess.org).
// Download once:  curl -L -o tools/data/lichess_db_puzzle.csv.zst https://database.lichess.org/lichess_db_puzzle.csv.zst
// Usage:  zstdcat tools/data/lichess_db_puzzle.csv.zst | node tools/pick-lichess.mjs <theme> <minRating> <maxRating> <count> [w|b|any] [maxPieces]
// Lichess themes used: mateIn1 mateIn2 backRankMate smotheredMate fork pin skewer discoveredAttack endgame pawnEndgame
// Output: [{ source, rating, fen, solution }] — fen is AFTER Lichess's set-up move, so the player is to move.
import readline from "node:readline";
import { Chess } from "chess.js";

const [theme, lo, hi, count, side = "any", maxPieces = "32"] = process.argv.slice(2);
const rl = readline.createInterface({ input: process.stdin });
const out = [];
let header = true;
for await (const line of rl) {
  if (header) { header = false; continue; }
  const [id, fen, moves, rating, , popularity, plays, themes] = line.split(",");
  const r = Number(rating);
  if (r < Number(lo) || r > Number(hi) || Number(popularity) < 80 || Number(plays) < 300) continue;
  if (!themes.split(" ").includes(theme)) continue;
  const c = new Chess(fen);
  const ms = moves.split(" ");
  c.move({ from: ms[0].slice(0, 2), to: ms[0].slice(2, 4), promotion: ms[0][4] });
  if (side !== "any" && c.turn() !== side) continue;
  if (c.board().flat().filter(Boolean).length > Number(maxPieces)) continue;
  out.push({ source: `lichess:${id}`, rating: r, fen: c.fen(), solution: ms.slice(1) });
  if (out.length >= Number(count)) break;
}
console.log(JSON.stringify(out, null, 1));
process.exit(0);
```

If `zstdcat` is missing, run `sudo apt-get install -y zstd`. Smoke check: `zstdcat tools/data/lichess_db_puzzle.csv.zst | node tools/pick-lichess.mjs backRankMate 600 1100 3 b` prints 3 Black-to-move candidates.

- [ ] **Step 5: Author the remaining 29 puzzles** (to reach 5 + 5 + 5 + 5 level and 3 + 3 + 3 + 3 boss). For each one:
  1. Get a FEN, either your own construction or a picker candidate (`mateIn1` / `backRankMate` / `smotheredMate` / `mateIn2`, rating 600–1200, player to move, ≤ 20 pieces preferred).
  2. Run `node tools/validate-puzzles.mjs --suggest-line "<fen>" mate <1|2>` and paste the printed tree. An output of `{}` means no forced mate, so drop the position.
  3. Write the `explain` (SAN of the first move + why), and keep `source: "lichess:<id>"` when it came from the picker.
  4. Keep the Black-to-move quota (≥ 2 per level, ≥ 4 in the boss).

  Then run `npm run validate`. Iterate until `OK`. Typical errors and their fixes:
  - `actually mate in 1`: wrong level, so move the puzzle to l1–l3
  - `too many accepted moves`: pick another position
  - `explain must mention`: fix the copy

- [ ] **Step 6: Wire it in.**
  - In `js/data/puzzles.js` add `import { PUZZLES as W2 } from "./puzzles-w2.js";` and `export const PUZZLES = [...W1, ...W2];`.
  - Add `"./js/data/puzzles-w2.js",` and `"./js/logic/line.js",` to `SHELL` in `sw.js`, if they aren't already there.

- [ ] **Step 7: Run.** `npm test && npm run validate` → all pass, `OK 64 puzzles`.

- [ ] **Step 8: Commit.** `git add -A && git commit -m "content: World 2 Mate in 1 & 2 (32 validated puzzles)"`

---

### Task A9: World 3 — Forks & Double Attacks

**Files:**
- Create: `js/data/puzzles-w3.js`
- Modify: `js/data/worlds.js`, `js/data/puzzles.js`, `sw.js`

**Interfaces:**
- Consumes: the `engine` goal and the `THEMES` `fork-n|fork-q|fork-p|double` (A6).
- Produces: World 3 levels `w3-l1..w3-l4`, tags `fork-n`, `fork-q`, `fork-p`, `double`; boss `w3-boss`.

**Level brief (engine goal, `length` 1–2; ≥ 6 Black-to-move level puzzles, ≥ 4 boss):**

| Level | Tag | Prompt (exact) | Idea |
|---|---|---|---|
| w3-l1 Knight Forks | `fork-n` | `White to move. Win material with a knight fork.` / `Black to move. …` | Royal forks (Nc7+ on Ke8 + Ra8), family forks, fork after a check |
| w3-l2 Queen Forks | `fork-q` | `White to move. Win material with a queen fork.` / `Black to move. …` | Queen check + loose piece, centralised queen hitting two loose pieces |
| w3-l3 Pawn Forks | `fork-p` | `White to move. Win material with a pawn fork.` / `Black to move. …` | Pawn push forking two pieces (e.g. d5 vs Nc6 + Be6) |
| w3-l4 Double Attacks | `double` | `White to move. Hit two things at once.` / `Black to move. Hit two things at once.` | Discovered attacks, check + attack with two pieces, rook/bishop hitting two loose pieces |

`length: 2` when the win is "fork, they move, take". `length: 1` only when the target can't escape and the engine margin rule still holds.

World 3 entry for `js/data/worlds.js`:

```js
  {
    id: 3,
    name: "Forks & Double Attacks",
    blurb: "One move, two targets.",
    comingSoon: false,
    levels: [
      { id: "w3-l1", name: "Knight Forks", tag: "fork-n" },
      { id: "w3-l2", name: "Queen Forks", tag: "fork-q" },
      { id: "w3-l3", name: "Pawn Forks", tag: "fork-p" },
      { id: "w3-l4", name: "Double Attacks", tag: "double" },
    ],
    boss: { id: "w3-boss", name: "Boss: Forks & Double Attacks" },
  },
```

File skeleton with two seeds. These were checked in a scratch run on 2026-10-20: both were sharp, with Nc7+/Nc2+ the only key and Nxa8/Nxa1 the only follow-up. **Paste the tree that `--suggest-line` prints**, because engine replies can differ between runs; the cache then pins them.

```js
// js/data/puzzles-w3.js
// World 3: Forks & Double Attacks. Goal "engine": Stockfish (dev-only) recomputes `tree`;
// the first move must also pass the level's theme detector (tools/themes.mjs).
const P = (tag, side) => ({
  "fork-n": `${side} to move. Win material with a knight fork.`,
  "fork-q": `${side} to move. Win material with a queen fork.`,
  "fork-p": `${side} to move. Win material with a pawn fork.`,
  double: `${side} to move. Hit two things at once.`,
})[tag];
const side = (fen) => (fen.split(" ")[1] === "b" ? "Black" : "White");
const L = (id, level, tag, length, fen, tree, explain, source = null) =>
  ({ id, world: 3, level, boss: null, tag, kind: "line", goal: "engine", length, fen, prompt: P(tag, side(fen)), explain, tree, ...(source ? { source } : {}) });
const B = (id, tag, length, fen, tree, explain, source = null) =>
  ({ id, world: 3, level: null, boss: "w3-boss", tag, kind: "line", goal: "engine", length, fen, prompt: P(tag, side(fen)), explain, tree, ...(source ? { source } : {}) });

export const PUZZLES = [
  // ——— Level 1: Knight Forks ———
  L("w3-l1-01", "w3-l1", "fork-n", 2, "r3k3/8/8/1N6/8/8/PP6/4K3 w - - 0 1",
    /* paste: node tools/validate-puzzles.mjs --suggest-line "r3k3/8/8/1N6/8/8/PP6/4K3 w - - 0 1" engine 2 */
    { b5c7: { reply: "e8f7", next: { c7a8: null } } },
    "Nc7+ forks the king and the rook on a8. The king has to move, then Nxa8."),
  L("w3-l1-02", "w3-l1", "fork-n", 2, "4k3/pp3ppp/8/8/1n6/8/5PPP/R3K3 b - - 0 1",
    { b4c2: { reply: "e1d2", next: { c2a1: null } } },
    "Nc2+ forks White's king and the rook on a1. After the king steps away, Nxa1."),
  // …remaining 30 entries authored with the loop below…
];
```

- [ ] **Step 1: Write the failing test.** Add World 3 to `worlds.js` as above. Running `npm test` → FAIL (`w3-l1` has 0 puzzles), via the generic data tests from A8.

- [ ] **Step 2: Author 32 puzzles.** For each one:
  1. Pick candidates: `zstdcat tools/data/lichess_db_puzzle.csv.zst | node tools/pick-lichess.mjs fork 700 1300 40 any 24`, or `discoveredAttack` for `double`, or your own construction.
  2. Run `--suggest-line "<fen>" engine <1|2>`.
  3. Read any `WARN` lines. `not sharp` or `best move still loses` means drop the position.
  4. Check the theme: the first move must be a knight/queen/pawn fork for that level. The validator reports `fork-q: first move … does not show the theme`.
  5. Paste the tree and write the `explain`.

- [ ] **Step 3: Wire it in.** Add W3 to `js/data/puzzles.js` (`[...W1, ...W2, ...W3]`) and `"./js/data/puzzles-w3.js",` to `SHELL`.

- [ ] **Step 4: Run.** `npm test && npm run validate` → all pass, `OK 96 puzzles`. Commit `tools/cache/engine.json` with it.

- [ ] **Step 5: Commit.** `git add -A && git commit -m "content: World 3 Forks & Double Attacks (32 engine-checked puzzles)"`

---

### Task A10: Endgame warm-ups from World 3 onward

**Files:**
- Create: `js/data/puzzles-drip.js`
- Modify: `js/logic/session.js` (whole file below), `js/ui/screens.js` (`renderReview`), `js/data/puzzles.js`, `sw.js`, `tests/session.test.js`, `tests/screens.test.js`, `tests/data.test.js`

**Interfaces:**
- Consumes: `worldStatus(p, worlds, id)` from `js/logic/progress.js`, `dueIds` from `js/logic/review.js`, and the `tb`/`mate` goals (A5, A7).
- Produces:
  - `DRIP_PER_SESSION = 1`
  - `dripActive(progress, worlds) -> boolean` (true once World 3 is open or passed)
  - drip puzzles: `{ world: 6, level: null, boss: null, drip: true, tag: "eg-drip" }`

- [ ] **Step 1: Write the failing tests.** Append to `tests/session.test.js`:

```js
const passBoss = (p, id) => P.recordBossResult(p, id, [], { score: 5, passed: true, weakLevelId: null, weakTags: [] });
const clearWorld = (p, w) => passBoss(w.levels.reduce((q, l) => P.recordLevelResult(q, l.id, 3), p), w.boss.id);
test("no endgame warm-up before World 3 opens", () => {
  const p = clearWorld(P.defaultProgress(), WORLDS[0]);
  assert.ok(run(p).every((id) => !byId.get(id).drip));
});
test("exactly one endgame warm-up per session once World 3 is open", () => {
  const p = clearWorld(clearWorld(P.defaultProgress(), WORLDS[0]), WORLDS[1]);
  const ids = run(p);
  assert.equal(ids.length, 10);
  assert.equal(new Set(ids).size, 10);
  assert.equal(ids.filter((id) => byId.get(id).drip).length, 1);
});
test("a due warm-up comes back before a fresh one", () => {
  let p = clearWorld(clearWorld(P.defaultProgress(), WORLDS[0]), WORLDS[1]);
  const dripId = PUZZLES.filter((x) => x.drip).map((x) => x.id).sort().at(-1);
  p = { ...p, review: { [dripId]: { box: 0, due: "2026-10-19" } } };
  assert.ok(run(p).includes(dripId));
});
```

Append to `tests/data.test.js`:

```js
test("endgame warm-ups: ≥ 12, World 6, outside levels and bosses, tb or mate", () => {
  const d = PUZZLES.filter((p) => p.drip);
  assert.ok(d.length >= 12);
  assert.ok(d.every((p) => p.world === 6 && p.level === null && p.boss === null && p.tag === "eg-drip"
    && p.kind === "line" && (p.goal === "tb" || p.goal === "mate")));
});
```

Append to `tests/screens.test.js` (import `renderReview` and `PUZZLES` if needed):

```js
test("review counts due endgame warm-ups", () => {
  const id = PUZZLES.find((p) => p.drip).id;
  const p = { ...P.defaultProgress(), review: { [id]: { box: 0, due: "2026-10-19" } } };
  assert.match(renderReview(p, WORLDS, PUZZLES, { today: "2026-10-20" }), /<p class="hero-num">1<\/p>/);
});
```

- [ ] **Step 2: Run.** `npm test` → FAIL (no drip puzzles; session never adds one).

- [ ] **Step 3: Implement.** Create `js/data/puzzles-drip.js` with 12 puzzles: 4 opposition (`tb`, `result: "win"` or `"draw"`, `length` 1–2), 4 square-of-the-pawn races (`tb`), and 4 Q+K or R+K mates (`mate`, `mateIn` 1–2). Seed (verified against the live tablebase on 2026-10-20; Ke5 is the only winning move):

```js
// js/data/puzzles-drip.js
// Endgame warm-ups mixed into daily sessions from World 3 onward (spec). Checked by
// the Lichess tablebase (goal "tb", cached in tools/cache/tablebase.json) or exact mate search.
const D = (id, goal, extra, fen, prompt, tree, explain) =>
  ({ id, world: 6, level: null, boss: null, drip: true, tag: "eg-drip", kind: "line", goal, ...extra, fen, prompt, tree, explain });

export const PUZZLES = [
  D("eg-d-01", "tb", { length: 1, result: "win" }, "8/4k3/8/3K4/4P3/8/8/8 w - - 0 1",
    "White to move. Win this — find the only winning move.", { d5e5: null },
    "Ke5! takes the opposition: the kings face each other with one square between and Black must give way. Pushing the pawn first only draws."),
  // …11 more, each tree pasted from --suggest-line … tb <length> <win|draw> or … mate <n>…
];
```

Replace `js/logic/session.js`:

```js
// Daily session: ~40% weak spots, ~40% current level, ~20% spaced review.
// From World 3 onward one "current" slot becomes an endgame warm-up (spec).
import { levelStatus, currentLevelId, worldStatus } from "./progress.js";
import { dueIds } from "./review.js";
import { shuffle } from "./rng.js";

export const SESSION_SIZE = 10;
export const SESSION_MIX = { weak: 4, current: 4, review: 2 };
export const DRIP_PER_SESSION = 1;

export function dripActive(progress, worlds) {
  const s = worldStatus(progress, worlds, 3);
  return s === "open" || s === "passed";
}

export function buildDailySession({ progress, worlds, puzzles, today, rng }) {
  const playable = puzzles.filter((p) => p.level && levelStatus(progress, worlds, p.level) !== "locked");
  const playableIds = new Set(playable.map((p) => p.id));
  const chosen = [];
  const taken = new Set();
  const take = (list, n) => {
    for (const p of list) {
      if (n <= 0) break;
      if (!p || taken.has(p.id)) continue;
      chosen.push(p.id);
      taken.add(p.id);
      n--;
    }
  };
  const due = dueIds(progress.review, today);

  // 1. Spaced review: earliest due first.
  const byId = new Map(playable.map((p) => [p.id, p]));
  take(due.filter((id) => playableIds.has(id)).map((id) => byId.get(id)), SESSION_MIX.review);

  // 1b. Endgame warm-up: due first, then never-missed ones, then any.
  const drip = dripActive(progress, worlds) ? puzzles.filter((p) => p.drip) : [];
  if (drip.length) {
    const dripById = new Map(drip.map((p) => [p.id, p]));
    const dueDrip = due.filter((id) => dripById.has(id)).map((id) => dripById.get(id));
    const fresh = shuffle(drip.filter((p) => !progress.review[p.id]), rng);
    take([...dueDrip, ...fresh, ...shuffle(drip, rng)], DRIP_PER_SESSION);
  }

  // 2. Weak spots: tags ranked by miss rate, random within each tag.
  const rate = (t) => (progress.tagMisses[t] || 0) / Math.max(1, progress.tagSeen[t] || 0);
  const weakTags = [...new Set(playable.map((p) => p.tag))]
    .filter((t) => (progress.tagMisses[t] || 0) > 0)
    .sort((a, b) => rate(b) - rate(a));
  const weakList = weakTags.flatMap((t) => shuffle(playable.filter((p) => p.tag === t), rng));
  take(weakList, SESSION_MIX.weak);

  // 3. Current level (or everything playable once all levels are cleared).
  const cur = currentLevelId(progress, worlds);
  const curList = cur ? playable.filter((p) => p.level === cur) : playable;
  take(shuffle(curList, rng), SESSION_MIX.current - (drip.length ? DRIP_PER_SESSION : 0));

  // 4. Fill up to the session size (never with extra warm-ups).
  take(shuffle(playable, rng), SESSION_SIZE - chosen.length);

  return shuffle(chosen, rng);
}
```

(`shuffle` is only called for drip when it's active, so World 1–2 sessions keep the same seeded order as v7.)

In `js/ui/screens.js` `renderReview`, change the first line to `const known = new Set(puzzles.filter((p) => p.level || p.drip).map((p) => p.id));`. After the `rows` map add:

```js
  const egSeen = progress.tagSeen["eg-drip"] || 0, egMiss = progress.tagMisses["eg-drip"] || 0;
  const egRow = egSeen
    ? `<li><span>Endgame warm-ups</span><span class="bar"><i style="width:${Math.round(((egSeen - egMiss) / egSeen) * 100)}%"></i></span><b>${Math.round(((egSeen - egMiss) / egSeen) * 100)}%</b></li>`
    : "";
```

Then use `${rows}${egRow}` in the skill list.

Add `import { PUZZLES as DRIP } from "./puzzles-drip.js";` to `js/data/puzzles.js` with `[...W1, ...W2, ...W3, ...DRIP]`, and add `"./js/data/puzzles-drip.js",` to `SHELL`. Author the 11 remaining warm-ups (`--suggest-line … tb 1 win`, `… tb 2 draw`, `… mate 2`). Use these prompts:
- `White to move. Win this — find the only winning move.`
- `Black to move. Save the draw.`
- `White to move. Checkmate in two.`

- [ ] **Step 4: Run.** `npm test && npm run validate` → all pass, `OK 108 puzzles`. Commit `tools/cache/tablebase.json` with it.

- [ ] **Step 5: Commit.** `git add -A && git commit -m "feat: endgame warm-ups in daily sessions from World 3"`

---

### Task A11: Release v8

**Files:**
- Modify: `js/version.js`, `sw.js` (`CACHE`), `tests/sw.test.js`, `README.md`, `CREDITS.md`, `/tmp/shots-tool/smoke7.mjs` (one check)
- Create: `/tmp/shots-tool/smoke8.mjs` (copied to `/workspace/chess-v8-shots/smoke8.mjs`), plus the screenshots

**Interfaces:**
- Consumes: everything from A1–A10.

- [ ] **Step 1: Write the failing test.** In `tests/sw.test.js` change the expected version to `"chess-coach-v8"`. Running `npm test` → FAIL.

- [ ] **Step 2: Bump.** `js/version.js`: `export const APP_VERSION = "chess-coach-v8";` (`STORAGE_KEY` unchanged `"chess-teacher-v6"`). `sw.js`: `const CACHE = "chess-coach-v8";`. Run `npm test` → PASS. `tests/sw.test.js` also proves every new `js/` file is in `SHELL`.

- [ ] **Step 3: Docs.**
  - `CREDITS.md`: add rows for:
    - **Stockfish 19** (npm `stockfish` 19.0.1, GPL-3.0, by the Stockfish developers; WASM build by Nathan Rugg). Dev-only and used only to check puzzles; not shipped to or run in the app.
    - **Lichess tablebase API** (tablebase.lichess.ovh, Syzygy/Gaviota data). Dev-only; answers cached in `tools/cache/tablebase.json`.
    - **Lichess open puzzle database** (CC0), if any puzzle has a `source: "lichess:…"`. Positions were picked from it and re-validated; the ids are kept for credit.
  - `README.md`: add a "Worlds" section (2 and 3 playable, 4–6 coming soon), an "Endgame warm-ups" note, and a "Validator" section listing the four goals and the `--suggest-line` commands.

- [ ] **Step 4: Update the v7 smoke.** In `smoke7.mjs`, change the check `worlds 2–6 Coming soon` to `worlds 4–6 Coming soon` (count 3 `soon-tag` "Coming soon" elements). The World 1 flow is otherwise unchanged and must still pass 39/39.

- [ ] **Step 5: Write the v8 smoke test** `/tmp/shots-tool/smoke8.mjs`:

```js
// v8 phone smoke (390x844): Worlds 2-3, flipped board, opponent replies, wrong mid-line, hint, boss, drip, review.
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";
import { PUZZLES } from "/workspace/chess-coach-preview/js/data/puzzles.js";
import { WORLDS } from "/workspace/chess-coach-preview/js/data/worlds.js";
import { lineMainline, lineStart, lineStep, lineKeys } from "/workspace/chess-coach-preview/js/logic/line.js";
import * as P from "/workspace/chess-coach-preview/js/logic/progress.js";
import { Chess } from "/workspace/chess-coach-preview/js/vendor/chess.js";

const URL = "http://localhost:8765/";
const OUT = "/workspace/chess-v8-shots/";
mkdirSync(OUT, { recursive: true });
const byId = new Map(PUZZLES.map((p) => [p.id, p]));
let fails = 0;
const check = (ok, name) => { console.log(`${ok ? "PASS" : "FAIL"} ${name}`); if (!ok) fails++; };

const b = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] });
const page = await b.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: false });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
const shot = (n) => page.screenshot({ path: `${OUT}${n}.png` });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Seed: World 1 fully passed.
const w1 = WORLDS[0];
let seed = w1.levels.reduce((q, l) => P.recordLevelResult(q, l.id, 3), P.defaultProgress());
seed = P.recordBossResult(seed, "w1-boss", [], { score: 5, passed: true, weakLevelId: null, weakTags: [] });
await page.goto(URL, { waitUntil: "networkidle0" });
await page.evaluate((s) => localStorage.setItem("chess-teacher-v6", s), JSON.stringify(seed));
await page.reload({ waitUntil: "networkidle0" });

const pid = () => page.$eval("#board-host", (el) => el.dataset.puzzle);
const tap = async (sq) => page.click(`.cb [data-sq="${sq}"]`);
const tapMove = async (lan) => { await tap(lan.slice(0, 2)); await tap(lan.slice(2, 4)); };
const fenAt = (pz, plies) => { const c = new Chess(pz.fen); for (const l of plies) c.move({ from: l.slice(0, 2), to: l.slice(2, 4), promotion: l[4] }); return c; };
async function waitReply(pz, plies, reply) {
  const san = fenAt(pz, plies).move({ from: reply.slice(0, 2), to: reply.slice(2, 4), promotion: reply[4] }).san;
  await page.waitForFunction((s) => document.querySelector("#coach").innerText.includes(`plays ${s}.`), { timeout: 5000 }, san);
}
async function solve({ wrongAtStep = -1, shotAfterReply = null } = {}) {
  const pz = byId.get(await pid());
  const ml = lineMainline(pz.tree);
  let state = lineStart(pz), plies = [];
  for (let i = 0; i < ml.length; i += 2) {
    if (i / 2 === wrongAtStep) {
      const keys = new Set(lineKeys(state));
      const bad = fenAt(pz, plies).moves({ verbose: true }).find((m) => !keys.has(m.lan));
      await tapMove(bad.lan);
      await page.waitForSelector("#panel .fb.bad", { timeout: 5000 });
      return { pz, wrong: true };
    }
    await tapMove(ml[i]);
    state = lineStep(state, ml[i]).state; plies.push(ml[i]);
    if (i + 1 < ml.length) {
      await waitReply(pz, plies, ml[i + 1]);
      plies.push(ml[i + 1]);
      if (shotAfterReply) { await shot(shotAfterReply); shotAfterReply = null; }
    }
  }
  await page.waitForSelector("#panel .fb.good", { timeout: 5000 });
  return { pz, wrong: false };
}
const next = async () => { await page.click('#panel [data-action="next"]'); await wait(150); };

// 1. Map shows Worlds 2 and 3, 4–6 coming soon.
const soon = await page.$$eval(".soon-tag", (els) => els.filter((e) => /Coming soon/.test(e.textContent)).length);
check(soon === 3, "worlds 4–6 Coming soon");
check(await page.$('[data-action="play-level"][data-level="w2-l1"]') !== null, "World 2 level 1 playable");
await page.$eval(".world:nth-of-type(2)", (el) => el.scrollIntoView()).catch(() => {});
await shot("01-map-world2-3");

// 2. World 2: play every level; check flips, hint, wrong mid-line, replies.
let sawBlack = false, sawReply = false, sawWrongMid = false;
for (const l of WORLDS[1].levels) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.click(`[data-action="play-level"][data-level="${l.id}"]`);
  for (let i = 0; i < 5; i++) {
    await page.waitForSelector(".cb .pc");
    const pz = byId.get(await pid());
    if (pz.fen.split(" ")[1] === "b" && !sawBlack) {
      const first = await page.$eval(".cb .sq", (el) => el.dataset.sq);
      check(first === "h1", "Black to move: board flipped (h1 top-left)");
      await shot("03-black-flipped");
      sawBlack = true;
    }
    if (l.id === "w2-l1" && i === 0) {
      await page.click('#panel [data-action="hint"]');
      const h = await page.$$eval(".cb .sq.hint", (els) => els.map((e) => e.dataset.sq));
      check(h.length === 1 && h[0] === lineKeys(lineStart(pz))[0].slice(0, 2), "line hint highlights the first move's piece");
    }
    const midWrong = l.id === "w2-l4" && i === 1 && !sawWrongMid;
    const r = await solve({ wrongAtStep: midWrong ? 1 : -1, shotAfterReply: !sawReply && pz.mateIn === 2 ? "04-mate-in-2-reply" : null });
    if (pz.mateIn === 2) sawReply = true;
    if (midWrong) {
      const lives = await page.$$eval("#topbar .lives .on", (els) => els.length);
      check(r.wrong && lives === 2, "wrong move mid-line costs one life");
      await shot("05-wrong-mid-line");
      sawWrongMid = true;
    }
    if (l.id === "w2-l1" && i === 0) await shot("02-mate-in-1-correct");
    await next();
  }
  await page.waitForSelector(".result");
  await page.click('[data-action="home"]');
}
check(sawBlack && sawReply && sawWrongMid, "World 2 covered Black-to-move, replies and a mid-line mistake");

// 3. World 2 boss: solve all five.
await page.click('[data-action="play-boss"][data-world="2"]');
for (let i = 0; i < 5; i++) { await page.waitForSelector(".cb .pc"); await solve(); await next(); }
await page.waitForSelector(".result");
check(/World 2 complete!/.test(await page.$eval(".result", (e) => e.innerText)), "World 2 boss passed");
await shot("06-w2-boss-pass");
await page.click('[data-action="home"]');

// 4. World 3 level 1: fork line.
await page.click('[data-action="play-level"][data-level="w3-l1"]');
await page.waitForSelector(".cb .pc");
await solve();
check(await page.$("#panel .fb.good") !== null, "fork line solved");
await shot("07-fork-line");
await page.click('#topbar [data-action="home"]');

// 5. Daily session includes one endgame warm-up.
await page.click('[data-action="play-session"]');
let drips = 0;
for (let i = 0; i < 10; i++) {
  await page.waitForSelector(".cb .pc");
  const pz = byId.get(await pid());
  if (pz.drip) { drips++; await shot("08-session-endgame-warmup"); }
  if (pz.kind === "line") await solve();
  else { await page.click('#panel [data-action="hint"]').catch(() => {}); break; } // World 1 kinds are covered by smoke7
  await next();
}
check(drips <= 1, "at most one warm-up seen (exactly one per session overall)");
await page.goto(URL, { waitUntil: "networkidle0" });

// 6. Review tab.
await page.click('[data-action="tab"][data-tab="review"]');
await shot("09-tab-review");

check(errors.length === 0, `no console errors (${errors.join(" | ")})`);
await b.close();
console.log(fails ? `${fails} FAILED` : "ALL PASS");
process.exit(fails ? 1 : 0);
```

(Lives are `#topbar .lives .on`, the same selector as `smoke7.mjs`; the top-bar back button is `#topbar [data-action="home"]`.)

- [ ] **Step 6: Run everything.**
  - `npm test` → all pass (expect ≈ 86 + 30 new).
  - `npm run validate` → `OK 108 puzzles`, plus the tools tests.
  - Start `python3 -m http.server 8765` in the repo.
  - `node /tmp/shots-tool/smoke7.mjs` → 39/39.
  - `node /tmp/shots-tool/smoke8.mjs` → ALL PASS.
  - View every PNG in `/workspace/chess-v8-shots/` and check: flipped board coordinates read `h…a` along the bottom and `1…8` top-down on the left; the reply lands with its yellow last-move highlight; the coach shows "Black plays …".
  - Then `cp /tmp/shots-tool/smoke8.mjs /workspace/chess-v8-shots/`.

- [ ] **Step 7: Commit, push, verify.**

```bash
git add -A && git commit -m "release: v8 — Worlds 2–3, flipped board, multi-move puzzles, endgame warm-ups"
git checkout main && git merge --ff-only v8 && git push origin main
B=https://stewartcampbell88-commits.github.io/chess-coach-preview
for i in $(seq 1 24); do curl -s "$B/sw.js?x=$RANDOM" | grep -q '"chess-coach-v8"' && break; sleep 10; done
for f in sw.js js/version.js js/data/puzzles-w2.js js/data/puzzles-w3.js js/data/puzzles-drip.js js/logic/line.js; do echo "$f $(curl -s -o /dev/null -w '%{http_code}' "$B/$f?x=1")"; done
```

Expected: `sw.js` contains `chess-coach-v8`, and every file returns `200`. Also run a headless load of the live URL with no console errors. Kill the local server.

---

# Part B — v8.2: World 4 Pins & Skewers

### Task B1: Pin, skewer and pin-escape detectors

**Files:**
- Modify: `tools/themes.mjs`, `tools/tests/themes.test.mjs`

**Interfaces:**
- Produces:
  - `xrays(fen, colour) -> [{ pinner, front: {sq,type,color}, behind: {...} }]` (`colour`'s bishops/rooks/queens looking through one enemy piece to a second)
  - `pinsOf(fen, colour)`
  - `isPin(fen, lan)`, `isSkewer(fen, lan)`, `isPinWin(fen, lan)`, `isPinEscape(fen, lan)`
  - `THEMES["pin-make" | "pin-win" | "skewer" | "pin-escape"]`

- [ ] **Step 1: Write the failing tests.** These were checked in a scratch run on 2026-10-20. Append to `tools/tests/themes.test.mjs` (extend the import):

```js
test("pin: Re1 pins the queen to the king", () => {
  assert.equal(isPin("4k3/8/8/4q3/8/8/8/R4K2 w - - 0 1", "a1e1"), true);
  assert.equal(isPin("4k3/8/8/4q3/8/8/8/R4K2 w - - 0 1", "a1a2"), false);
});
test("skewer: Rh8+ through the king to the queen", () => {
  assert.equal(isSkewer("q3k3/8/8/8/8/8/8/4K2R w - - 0 1", "h1h8"), true);
  assert.equal(isPin("q3k3/8/8/8/8/8/8/4K2R w - - 0 1", "h1h8"), false);
  assert.equal(isSkewer("q3k3/8/8/8/8/8/8/4K2R w - - 0 1", "h1h7"), false);
});
test("pin-win: d5 attacks the pinned knight again", () => {
  assert.equal(isPinWin("4k3/8/2n5/1B6/3P4/8/8/4K3 w - - 0 1", "d4d5"), true);
  assert.equal(isPinWin("4k3/8/2n5/1B6/3P4/8/8/4K3 w - - 0 1", "e1d2"), false);
});
test("pin-escape: stepping off the diagonal breaks the pin", () => {
  assert.equal(isPinEscape("4k3/8/8/1b6/8/3N4/8/5K2 w - - 0 1", "f1g1"), true);
  assert.equal(isPinEscape("4k3/8/8/1b6/8/3N4/8/5K2 w - - 0 1", "f1e2"), false);
});
```

- [ ] **Step 2: Run.** `node --test tools/tests/themes.test.mjs` → FAIL.

- [ ] **Step 3: Implement.** Append to `tools/themes.mjs`:

```js
const DIRS = { b: [[1, 1], [1, -1], [-1, 1], [-1, -1]], r: [[1, 0], [-1, 0], [0, 1], [0, -1]] };
DIRS.q = [...DIRS.b, ...DIRS.r];
const FILES = "abcdefgh";

function firstTwo(c, from, [dx, dy]) {
  const out = [];
  let x = FILES.indexOf(from[0]) + dx, y = Number(from[1]) + dy;
  while (x >= 0 && x < 8 && y >= 1 && y <= 8 && out.length < 2) {
    const p = c.get(FILES[x] + y);
    if (p) out.push({ sq: FILES[x] + y, type: p.type, color: p.color });
    x += dx; y += dy;
  }
  return out;
}

/** colour's line pieces that see one enemy piece with another enemy piece directly behind it. */
export function xrays(fen, colour) {
  const c = new Chess(fen);
  const res = [];
  for (const p of c.board().flat()) {
    if (!p || p.color !== colour || !DIRS[p.type]) continue;
    for (const d of DIRS[p.type]) {
      const [front, behind] = firstTwo(c, p.square, d);
      if (front && behind && front.color !== colour && behind.color !== colour) res.push({ pinner: p.square, front, behind });
    }
  }
  return res;
}

export function pinsOf(fen, colour) {
  return xrays(fen, colour).filter((x) => val(x.behind.type) > val(x.front.type));
}

/** The moved line piece pins something to a more valuable piece (or the king). */
export function isPin(fen, lan) {
  const c = new Chess(fen);
  const m = moveLan(c, lan);
  return Boolean(m) && pinsOf(c.fen(), m.color).some((x) => x.pinner === m.to);
}

/** The moved line piece attacks a king or bigger piece with a worthwhile piece behind it. */
export function isSkewer(fen, lan) {
  const c = new Chess(fen);
  const m = moveLan(c, lan);
  if (!m) return false;
  const enemy = m.color === "w" ? "b" : "w";
  const loose = new Set(hangingSquares(c.fen(), enemy));
  return xrays(c.fen(), m.color).some((x) => x.pinner === m.to
    && (x.front.type === "k" || val(x.front.type) > val(x.behind.type))
    && (val(x.behind.type) >= 3 || loose.has(x.behind.sq)));
}

/** A pin already exists and the move adds an attacker on the pinned piece. */
export function isPinWin(fen, lan) {
  const me = new Chess(fen).turn();
  const pins = pinsOf(fen, me);
  if (!pins.length) return false;
  const before = new Chess(fen), c = new Chess(fen);
  if (!moveLan(c, lan)) return false;
  return pins.some((x) => c.attackers(x.front.sq, me).length > before.attackers(x.front.sq, me).length);
}

/** One of the mover's pieces is pinned and the move breaks that pin. */
export function isPinEscape(fen, lan) {
  const me = new Chess(fen).turn(), enemy = me === "w" ? "b" : "w";
  const before = pinsOf(fen, enemy);
  if (!before.length) return false;
  const c = new Chess(fen);
  if (!moveLan(c, lan)) return false;
  const after = pinsOf(c.fen(), enemy);
  return before.some((x) => !after.some((y) => y.pinner === x.pinner && y.front.sq === x.front.sq));
}

Object.assign(THEMES, { "pin-make": isPin, "pin-win": isPinWin, skewer: isSkewer, "pin-escape": isPinEscape });
```

- [ ] **Step 4: Run.** `node --test tools/tests/` → all pass.

- [ ] **Step 5: Commit.** `git add -A && git commit -m "feat(tools): pin, skewer and pin-escape detectors"`

---

### Task B2: World 4 content

**Files:**
- Create: `js/data/puzzles-w4.js`
- Modify: `js/data/worlds.js`, `js/data/puzzles.js`, `sw.js`

**Interfaces:**
- Produces: World 4 levels `w4-l1..w4-l4`, tags `pin-make`, `pin-win`, `skewer`, `pin-escape`; boss `w4-boss`.

World 4 entry:

```js
  {
    id: 4,
    name: "Pins & Skewers",
    blurb: "Line up the pieces, then strike.",
    comingSoon: false,
    levels: [
      { id: "w4-l1", name: "Pin It", tag: "pin-make" },
      { id: "w4-l2", name: "Attack the Pinned Piece", tag: "pin-win" },
      { id: "w4-l3", name: "Skewers", tag: "skewer" },
      { id: "w4-l4", name: "Get Out of a Pin", tag: "pin-escape" },
    ],
    boss: { id: "w4-boss", name: "Boss: Pins & Skewers" },
  },
```

| Level | Prompt (exact, `${side}` = White/Black) | Idea |
|---|---|---|
| Pin It | `${side} to move. Pin a piece and win material.` | Rook/bishop pins a queen or rook to the king (seed below) |
| Attack the Pinned Piece | `${side} to move. That piece is pinned — attack it again.` | Pawn push or piece hitting an already pinned piece |
| Skewers | `${side} to move. Skewer them.` | Check through the king to a queen/rook, or queen-to-rook skewers |
| Get Out of a Pin | `${side} to move. You're pinned — find the move that saves material.` | Break the pin with tempo, or counter-attack the pinner; engine margin rule picks out the only good move |

Seeds (detectors and engine sharpness checked in a scratch run on 2026-10-20; paste the `--suggest-line` trees):
- `pin-make`, `length: 2`: `"4k3/8/8/4q3/8/8/8/R4K2 w - - 0 1"`. Key `a1e1` (Re1 pins the queen; Qxe1+ Kxe1 wins the queen for the rook, +4). Explain: `"Re1 pins the queen to the king. She can only take the rook, and after Kxe1 you've won a queen for a rook."`
- `skewer`, `length: 2`: `"q3k3/8/8/8/8/8/8/4K2R w - - 0 1"`. Key `h1h8` (Rh8+ skewers the king to the queen on a8). Explain: `"Rh8+ checks the king along the back rank. Once it steps aside, Rxa8 wins the queen."`

Same helpers as `puzzles-w3.js` (`goal: "engine"`, `world: 4`), the same authoring loop (picker themes `pin`, `skewer`), and the same Black-to-move quota.

- [ ] **Step 1:** Add the World 4 entry. `npm test` → FAIL (generic data tests).
- [ ] **Step 2:** Author the 32 puzzles; `npm run validate` until `OK 140 puzzles`.
- [ ] **Step 3:** Wire up `puzzles.js` (`...W4`) and `SHELL`.
- [ ] **Step 4:** `npm test && npm run validate` → pass.
- [ ] **Step 5:** `git add -A && git commit -m "content: World 4 Pins & Skewers (32 engine-checked puzzles)"`

### Task B3: Release v8.2

Same steps as A11 with these changes:
- version `chess-coach-v8.2` in `js/version.js`, `sw.js` and `tests/sw.test.js`
- smoke7: `worlds 5–6 Coming soon` (count 2)
- `smoke8.mjs`: seed Worlds 1–3 passed, then play `w4-l1` and `w4-l4` once and the World 4 boss
- screenshots to `/workspace/chess-v8.2-shots/` (`01-map-world4`, `02-pin`, `03-skewer`, `04-pin-escape-black`, `05-w4-boss`)
- live check `js/data/puzzles-w4.js` returns 200 and `sw.js` contains `chess-coach-v8.2`

Commit: `release: v8.2 — World 4 Pins & Skewers`.

---

# Part C — v8.3: World 5 Survive the Opening + World 6 Simple Endgames

### Task C1: `book` goal (opening lines)

**Files:**
- Create: `tools/book.mjs`, `tools/tests/book.test.mjs`
- Modify: `tools/context.mjs`

**Interfaces:**
- Consumes: `engine.analyse` (A6), `fenAfterLan` (A5).
- Produces: `bookChecks(p, engine, errs) -> Promise<void>`, set as `ctx.bookChecks`.

- [ ] **Step 1: Write the failing test** `tools/tests/book.test.mjs`:

```js
import test from "node:test"; import assert from "node:assert/strict";
import { bookChecks } from "../book.mjs";
import * as engine from "../engine.mjs";

const italian = {
  goal: "book", from: ["e4", "e5", "Nf3", "Nc6"],
  fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
  tree: { f1c4: null },
};
test("Bc4 in the Italian passes", async () => { const errs = []; await bookChecks(italian, engine, errs); assert.deepEqual(errs, []); });
test("fen must match the moves", async () => {
  const errs = []; await bookChecks({ ...italian, from: ["e4", "e5"] }, engine, errs);
  assert.match(errs.join(), /fen does not match/);
});
test("a blunder is not a book move", async () => {
  const errs = []; await bookChecks({ ...italian, tree: { f3g5: null } }, engine, errs);
  assert.match(errs.join(), /worse than|below/);
  engine.stop();
});
```

- [ ] **Step 2: Run.** `node --test tools/tests/book.test.mjs` → FAIL.

- [ ] **Step 3: Implement** `tools/book.mjs`:

```js
// "book" goal: authored repertoire lines, sanity-checked by Stockfish.
import { Chess } from "chess.js";
import { fenAfterLan } from "./common.mjs";

export const BOOK_NEAR = 60, BOOK_FLOOR = -80;

export async function bookChecks(p, engine, errs) {
  if (!Array.isArray(p.from) || !p.from.length) errs.push("book: needs `from` (SAN moves from the start)");
  else {
    const c = new Chess();
    try { for (const san of p.from) c.move(san); } catch { errs.push("book: `from` has an illegal move"); return; }
    const a = c.fen().split(" ").slice(0, 4).join(" "), b = p.fen.split(" ").slice(0, 4).join(" ");
    if (a !== b) errs.push(`book: fen does not match \`from\` (${a})`);
  }
  async function walk(fen, node, path) {
    const lines = await engine.analyse(fen);
    const best = lines[0].score;
    for (const [k, child] of Object.entries(node)) {
      const line = lines.find((l) => l.uci === k) || (await engine.analyse(fenAfterLan(fen, k), { multipv: 1 }))
        .map((l) => ({ uci: k, score: -l.score }))[0];
      if (line.score < best - BOOK_NEAR) errs.push(`${path}${k}: ${best - line.score}cp worse than ${lines[0].uci}`);
      if (line.score < BOOK_FLOOR) errs.push(`${path}${k}: eval ${line.score}cp is below ${BOOK_FLOOR}`);
      if (child) await walk(fenAfterLan(fenAfterLan(fen, k), child.reply), child.next, `${path}${k} ${child.reply} `);
    }
  }
  await walk(p.fen, p.tree, "");
}
```

(A key outside the engine's top 8 is scored by analysing the position after it, negated to the mover's view.)

In `tools/context.mjs` add `import { bookChecks } from "./book.mjs";` and include `bookChecks` in the object `makeContext` returns.

- [ ] **Step 4: Run.** `node --test tools/tests/` → pass.

- [ ] **Step 5: Commit.** `git add -A && git commit -m "feat(tools): book goal for opening lines"`

### Task C2: World 5 content — Survive the Opening

**Files:** Create `js/data/puzzles-w5.js`; modify `js/data/worlds.js`, `js/data/puzzles.js`, `sw.js`.

World 5 entry:

```js
  {
    id: 5,
    name: "Survive the Opening",
    blurb: "e4, Nf3, Bc4 — and calm replies as Black.",
    comingSoon: false,
    levels: [
      { id: "w5-l1", name: "Your Italian (White)", tag: "op-italian" },
      { id: "w5-l2", name: "Meeting 1.e4 (Black)", tag: "op-e4" },
      { id: "w5-l3", name: "Meeting 1.d4 (Black)", tag: "op-d4" },
      { id: "w5-l4", name: "Fried Liver Defence", tag: "op-fried" },
    ],
    boss: { id: "w5-boss", name: "Boss: Survive the Opening" },
  },
```

**Repertoire (default; see decision 2):**
- **White (`op-italian`):** 1.e4 e5 2.Nf3 Nc6 3.Bc4.
  - vs 3…Bc5: 4.c3 or 4.O-O, then d3 and Re1.
  - vs 3…Nf6: the calm 4.d3 (no Ng5 gambles).
  - Also punish early mistakes: free pawns, and Qh5-style attacks on f7.
- **Black vs 1.e4 (`op-e4`):** 1…e5 2…Nc6.
  - vs 3.Bc4: 3…Nf6 (Two Knights). vs 3.Bb5: 3…a6.
  - vs the early 2.Qh5 / 3.Qf3 attack on f7: …Nc6, …g6 or …Qe7 / …Nf6 (stop Scholar's Mate).
- **Black vs 1.d4 (`op-d4`), Queen's Gambit Declined:** 1…d5 2.c4 e6 3.Nc3 Nf6 4.Bg5 Be7, then …O-O and …h6.
  - vs the London (2.Bf4): 2…Nf6 3.e3 c5.
- **Fried Liver Defence (`op-fried`, Black):** 1.e4 e5 2.Nf3 Nc6 3.Bc4 Nf6 4.Ng5 d5 5.exd5 **Na5!** (not 5…Nxd5? 6.Nxf7!).
  - Then 6.Bb5+ c6 7.dxc6 bxc6, and 8.Be2 h6 or 8.Qf3 Rb8 (book lines).
  - Positions at 4…d5, 5…Na5, 6…c6, 7…bxc6 and 8…h6, plus "after 5…Nxd5? 6.Nxf7! find …Kxf7 then …Ke6" survival items, are all engine-checked.

**Prompts:** `White to move. Play your system move.`, `Black to move. Play the book move.`, `Black to move. Survive the attack.` Explanations name the idea in one sentence ("Na5! hits the bishop on c4 and takes the heat off f7").

Each puzzle is `{ goal: "book", from: [SAN…], fen, tree, … }`. Build the FEN by replaying `from` in chess.js, e.g. `node -e "import('chess.js').then(({Chess})=>{const c=new Chess();for(const m of process.argv.slice(1))c.move(m);console.log(c.fen())})" e4 e5 Nf3 Nc6` from `tools/`. Trees are authored, e.g. `{ c6a5: { reply: "f1b5", next: { c7c6: null } } }` with `length` ≤ 3, and castling is allowed. Validate them with `npm run validate`. Black-to-move: l2–l4 are all Black, l1 is all White, and the boss is 4 White + 8 Black.

- [ ] Steps: add the world entry (FAIL generic tests) → author 32 → wire up → `npm test && npm run validate` (`OK 172 puzzles`) → `git commit -m "content: World 5 Survive the Opening (32 book puzzles)"`.

### Task C3: World 6 content — Simple Endgames

**Files:** Create `js/data/puzzles-w6.js`; modify `js/data/worlds.js`, `js/data/puzzles.js`, `sw.js`.

```js
  {
    id: 6,
    name: "Simple Endgames",
    blurb: "King and pawn, basic mates, converting a win.",
    comingSoon: false,
    levels: [
      { id: "w6-l1", name: "Opposition", tag: "eg-opp" },
      { id: "w6-l2", name: "The Square & Pawn Races", tag: "eg-square" },
      { id: "w6-l3", name: "Basic Mates", tag: "eg-mate" },
      { id: "w6-l4", name: "Converting a Win", tag: "eg-convert" },
    ],
    boss: { id: "w6-boss", name: "Boss: Simple Endgames" },
  },
```

| Level | Goal | Notes |
|---|---|---|
| Opposition | `tb`, `length` 1–3, `result` win (attacker) or draw (defender) | K+P v K and K+P v K+P only-move positions; "play it out" lines of 2–3 moves where every step is an only move |
| Square & Races | `tb`, `length` 1–2 | Rule of the square, outside passed pawn, "which pawn to push" races |
| Basic Mates | `mate`, `mateIn` 1–3, ≤ 6 pieces | K+Q v K and K+R v K box mates; 2 R ladder |
| Converting a Win | `tb` (≤ 7 pieces) or `engine` (`length` 1–2) | Trade into a won K+P ending, rook behind the passed pawn, cut the king off |

**Prompts:**
- `${side} to move. Win this — find the only winning move.`
- `… and keep finding them.` when `length` > 1
- `${side} to move. Save the draw.`
- `${side} to move. Checkmate in ${n}.`

Positions must differ from the warm-ups (the duplicate-position test enforces this). Each level and the boss need at least 1 Black-to-move puzzle.

- [ ] Steps: add the world entry (FAIL) → author 32 with `--suggest-line … tb|mate|engine` → wire up → `npm test && npm run validate` (`OK 204 puzzles`) → commit `content: World 6 Simple Endgames (32 tablebase/mate-checked puzzles)`.

### Task C4: Release v8.3

Same as A11, with these changes:
- version `chess-coach-v8.3`
- smoke7: no "Coming soon" worlds remain, so the count is 0
- `smoke8.mjs`: seed Worlds 1–4 passed, then play `w5-l1` (checks that **castling** O-O redraws the rook on f1 when it's a key or reply) and `w5-l4`, then `w6-l1` (a 2-move tablebase line with a reply), `w6-l3`, and the World 6 boss
- screenshots `/workspace/chess-v8.3-shots/`: `01-map-all-worlds`, `02-italian-castle`, `03-fried-liver-na5`, `04-opposition-line`, `05-basic-mate`, `06-w6-boss`
- live check `js/data/puzzles-w5.js` and `js/data/puzzles-w6.js` return 200 and `sw.js` contains `chess-coach-v8.3`

Commit: `release: v8.3 — World 5 openings, World 6 endgames`.

---

## Self-review (done while writing)

**Spec coverage:**
- Worlds 2–6 in spec order with the spec's themes: A8, A9, B2, C2, C3.
- Italian e4/Nf3/Bc4, replies to e4 and d4, Fried Liver defence: C2.
- K+P, basic mates, converting: C3.
- Boss = mastery check with 4 of 5, routing back on fail: unchanged logic, now per world (A4).
- Endgames mixed into reviews from World 3: A10.
- Validator handles multi-move solutions (A2, A5), mate in 2 with replies (A5), Black-to-move with a flipped board (A3, A4, A5 prompt check), endgame "play it out" kept short and verifiable (A7: ≤ 3 moves, only-move nodes), and book lines (C1).
- Keep v7 UI, storage key and update flow: Global Constraints and A11.
- Versions v8, v8.2, v8.3: A11, B3, C4.
- The Chess.com blunder import is **Phase 3** and is out of scope here.

**Placeholder scan:** the code steps contain the full code. The content tasks deliberately specify *how* each puzzle is generated and checked (brief, seed entries, exact commands, quotas, prompts) rather than listing 200 FENs inside a plan. The validator is the gate, and the trees are machine-generated.

**Type consistency:**
- `lineStart`, `lineStep`, `lineKeys`, `lineMainline`, `treeStats` (A2) are used unchanged in A4, A5, A6 and the smoke test.
- `hintSquares(p, keys)` (A2) is used in A4.
- `squareFromXY` (A3) is used in `board.js`.
- `ctx = { engine, engineTree, engineExtras, tablebase, tbTree, bookChecks }` is built up in A5 → A6 → A7 → C1, and `validateLine` reads exactly those keys.
- `THEMES` is extended in A6 and B1 and read in A5.
- Puzzle fields `goal`, `mateIn`, `length`, `result`, `from`, `tree`, `drip`, `source` are consistent across the schema, the validator and the tests.

## Execution handoff

Recommended: **subagent-driven** (superpowers:subagent-driven-development), one fresh subagent per task with a review between tasks. Ship and verify each release (A11, B3, C4) before starting the next part, so Stewart can play as soon as each one lands. Content tasks (A8, A9, B2, C2, C3) are the long ones; each can run as its own session.
