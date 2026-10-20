# Chess - Teacher v6 (Phase 1 preview) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a thin, playable v6 preview to GitHub Pages: a dark Chess.com-style map showing all 6 worlds, with World 1 "Don't Hang Pieces" fully playable (4 levels × 5 puzzles, 3 lives, stars), the World 1 mastery boss (pass 4 of 5; a fail sends you back to your weakest level), and a one-tap daily session with a streak.

**Architecture:** The ~1750-line `index.html` monolith is split into plain ES modules under `js/` with no build step. Pure logic (`js/logic/*`, `js/chess/board.js`, `js/storage.js`, `js/ui/screens.js`) has no DOM access and is unit-tested with `node --test`. Only `js/app.js` and `js/ui/update.js` touch the DOM. Puzzle positions are checked by a dev-only validator (`tools/`, using chess.js) that works out the correct answers itself and fails if the authored answers differ.

**Tech Stack:** Vanilla HTML/CSS/JS (ES modules), service worker PWA on GitHub Pages, Node 20 `node --test` (no runtime deps), chess.js 1.4.0 (dev-only, in `tools/` only).

**Spec:** `docs/superpowers/specs/2026-10-20-chess-teacher-design.md`

## Phases (only Phase 1 is detailed here)

| Phase | What | Gate |
|---|---|---|
| **1 (this plan)** | v6 preview: module split, World 1 + boss, daily session, streak, map with Worlds 2–6 locked | Stewart plays it on his phone and says OK |
| 2 | Worlds 2–6 content (mates, forks, pins/skewers, openings, endgames) + validator rules per theme; endgames mixed into review from World 3 | Separate plan after the Phase 1 OK |
| 3 | Chess.com blunder import into bosses and weak-spot practice | Separate plan |
| 4 | Spaced-repetition and weak-spot tuning using real play data | Separate plan |

**Phase 2 validation note:** mate puzzles are checked with chess.js `isCheckmate()` over every line. Endgames with 7 or fewer pieces are checked against the Lichess tablebase API (`https://tablebase.lichess.ovh/standard?fen=`) by the dev validator. The app never calls it.

**Phase 3 approach (decided): offline preprocess, not in-browser Stockfish.** A dev script `tools/import-chesscom.mjs` runs on the box. It fetches `https://api.chess.com/pub/player/stewartcamp/games/archives` and each monthly archive with a `User-Agent` header (Chess.com asks for one), keeps `time_class === "rapid"` games, and replays them with chess.js. Each of Stewart's positions is evaluated with native Stockfish at a fixed depth of 14. A **blunder** is an evaluation drop of ≥ 200 centipawns from Stewart's side, ignoring positions already worse than −500. Each blunder is tagged to a world with the validator's own detectors: piece left hanging (SEE) → World 1, missed or allowed mate → World 2, and so on. The output is `js/data/my-positions.js`, which gets committed. Bosses take up to 2 of these per attempt, and the weak-spot pool gives them extra weight. Why: (1) a Stockfish WASM download of about 1–7 MB, plus several minutes of analysis, would drain the phone and slow a 5-minute session; (2) results are deterministic and reviewable before they reach the app; (3) the theme-tagging code is already built for the validator; (4) no extra moving parts or API calls on the phone. The cost is that new games appear only after the script is re-run (on request or on a weekly schedule).

## Global Constraints

- App name: **Chess - Teacher**. No Chess.com logos or wordmarks anywhere in the UI or icons.
- Colours: bg `#262421` / `#302e2c`, green CTA `#81b64c`, board light `#eeeed2` / dark `#769656`.
- `APP_VERSION` and sw `CACHE` are both `chess-coach-v6`. Storage key is `chess-teacher-v6`. v5 data (`chess-teacher-v5`) is ignored and left untouched; v6 starts fresh.
- No build step and no npm runtime dependencies. Everything Pages serves must be plain files loaded via `<script type="module">`. chess.js lives only in `tools/` and is never imported from `js/`.
- Level = 5 puzzles, 3 lives. Stars: 3 lives left = 3★, 2 = 2★, 1 = 1★, 0 lives = soft retry (no progress lost).
- Sequential unlock: levels in order; boss unlocks once all levels in its world are cleared; the next world unlocks when the boss is passed.
- Boss: 5 fresh positions (never used in levels), pass mark **4 of 5**. A fail sends Stewart to the level whose theme he missed most, and the boss stays gated until that level is cleared again.
- Daily session: one tap, **10 puzzles** (fewer only when not enough are unlocked), mix **4 weak-spot / 4 current level / 2 spaced review** (≈40/40/20). The streak goes up only when a session is completed.
- Spaced review intervals in days: `[1, 3, 7, 16, 35]`.
- Dates are the phone's local calendar day (Brisbane), as `YYYY-MM-DD`. Never `toISOString()`.
- Australian English copy ("practise" as a verb, "colour", "centre").
- Phase 1 puzzles: White to move, board shown from White's side, no castling, en passant or promotion in any answer.
- Keep the service-worker update UX: **Check for update** button, **Update available** banner, **Update now** button.

## Review Focus

1. **Old or corrupt saved data** (v5 leftovers, half-written JSON) must give a fresh v6 start, not a blank screen. This happened in v3. Pinned in Task 4 `storage` tests.
2. **Stray taps** (an empty square, an opponent's piece, the same piece twice, taps while feedback shows) must never cost a life. Pinned in Task 8 `nextSelection` tests, and Task 9 ignores square taps outside the `puzzle` screen.
3. **Midnight boundary:** a session at 11:50 pm and another at 12:10 am count as two days; two sessions on one day count once; a missed day resets the streak to 0 on screen. Pinned in Task 5 streak tests.
4. **Stale update mix** (new `index.html` with old cached modules, or the reverse) must not happen. Every module and stylesheet must be in the SW shell list under the new cache name. Pinned in Task 9 `sw.test.js`.
5. **Small boss pool or a repeat attempt:** a retried boss should show different positions, and a pool that's too small should fail loudly in tests, not quietly show duplicates. Pinned in Task 6 boss tests.

---

## File Structure

```
index.html              Shell only: meta/manifest links, <link css>, #app, #toast, <script type="module" src="js/app.js">
css/app.css             Styles moved from index.html:14-610, plus world/map/boss styles
js/version.js           APP_VERSION, STORAGE_KEY
js/chess/board.js       FEN parsing and applying a move to a board map (pure)
js/data/worlds.js       WORLDS: 6 worlds, World 1 levels + boss
js/data/puzzles-w1.js   PUZZLES: 20 level puzzles + 12 boss puzzles
js/logic/rng.js         seeded RNG and shuffle
js/logic/dates.js       addDays, dayDiff, localDateKey
js/logic/stars.js       starsForLives, LIVES_PER_LEVEL
js/logic/progress.js    progress shape, unlock rules, recording results
js/logic/review.js      Leitner spaced review
js/logic/streak.js      streak update and display
js/logic/boss.js        build and grade the boss
js/logic/session.js     daily session builder
js/logic/answer.js      answer checking and tap-to-move selection
js/storage.js           localStorage load/save, defensive
js/ui/board-view.js     renderBoard(board, opts) -> HTML string
js/ui/screens.js        pure screen renderers (state -> HTML string)
js/ui/update.js         SW registration + check/apply update (ported from v5)
js/app.js               screen state machine, events, persistence
sw.js                   CACHE v6, full SHELL list
manifest.json           description updated
package.json            {"private":true,"type":"module"}, scripts test/validate
.gitignore              tools/node_modules/
tools/package.json      devDependency chess.js 1.4.0, "type":"module"
tools/see.mjs           SEE + hanging detector + expected-answer computation
tools/validate-puzzles.mjs  CLI validator / --suggest helper
tools/tests/see.test.mjs    validator self-tests
tests/*.test.js         unit tests for js/ (node --test, no deps)
README.md               updated for v6
```

**Shared types** (JSDoc in the owning file; listed here so every task uses the same names):

```js
// Puzzle (js/data/puzzles-w1.js)
{ id: "w1-l1-01", world: 1, level: "w1-l1" | null, boss: "w1-boss" | null,
  tag: "spot" | "free" | "count" | "save",
  kind: "tap-hanging" | "take-free" | "save-piece",
  fen: "<full 6-field FEN, White to move>",
  prompt: "Tap every black piece that's hanging.",
  accept: ["e5"],            // squares for tap-hanging; UCI moves (e.g. "f3e5") otherwise
  explain: "The queen on e5 is attacked by the knight and nothing defends her." }

// World (js/data/worlds.js)
{ id: 1, name: "Don't Hang Pieces", blurb: "...", comingSoon: false,
  levels: [{ id: "w1-l1", name: "Spot the Hanging Piece", tag: "spot" }, ...],
  boss: { id: "w1-boss", name: "Boss: Don't Hang Pieces" } | null }

// Progress (js/logic/progress.js)
{ version: 6,
  levels: { [levelId]: { stars: 0|1|2|3, cleared: boolean } },
  bosses: { [bossId]: { passed: boolean, attempts: number, lastIds: string[] } },
  bossGate: { [bossId]: levelId },          // present only while gated
  tagSeen: { [tag]: number }, tagMisses: { [tag]: number },
  review: { [puzzleId]: { box: 0..4, due: "YYYY-MM-DD" } },
  streak: { count: number, lastDate: "YYYY-MM-DD" | null } }
```

---

### Task 1: Scaffold, test harness, board module

**Files:**
- Create: `package.json`, `.gitignore`, `js/chess/board.js`
- Test: `tests/board.test.js`

**Interfaces:**
- Produces: `FILES = "abcdefgh"`; `parseFen(fen: string) -> { board: Record<string, string|null>, turn: "w"|"b" }` (64 keys `a1`..`h8`, pieces as FEN letters; throws `Error("Bad FEN")` if there aren't 8 ranks or a rank doesn't sum to 8); `applyUci(board, uci: string) -> board` (returns a new object; a 5th char promotes to that piece in the mover's case); `isLightSquare(sq: string) -> boolean`.

- [ ] **Step 1: Create branch and harness**

```bash
cd /workspace/chess-coach-preview && git checkout -b v6-phase1
```
`package.json`: `{"name":"chess-teacher","private":true,"type":"module","scripts":{"test":"node --test tests/","validate":"npm --prefix tools install --silent && node --test tools/tests/ && node tools/validate-puzzles.mjs"}}`. `.gitignore`: `tools/node_modules/`.

- [ ] **Step 2: Write the failing test** `tests/board.test.js`

```js
import test from "node:test"; import assert from "node:assert/strict";
import { parseFen, applyUci, isLightSquare } from "../js/chess/board.js";
const F = "4k3/8/8/4q3/8/5N2/8/6K1 w - - 0 1";
test("parseFen reads pieces and turn", () => {
  const { board, turn } = parseFen(F);
  assert.equal(Object.keys(board).length, 64);
  assert.equal(board.e5, "q"); assert.equal(board.f3, "N"); assert.equal(board.g1, "K");
  assert.equal(board.a1, null); assert.equal(turn, "w");
});
test("parseFen rejects malformed FEN", () => {
  assert.throws(() => parseFen("8/8/8 w - - 0 1"));
  assert.throws(() => parseFen("4k3/8/8/4q3/8/5N2/8/6K w - - 0 1"));
});
test("applyUci moves/captures without mutating", () => {
  const { board } = parseFen(F); const b2 = applyUci(board, "f3e5");
  assert.equal(b2.e5, "N"); assert.equal(b2.f3, null); assert.equal(board.e5, "q");
});
test("applyUci promotes in mover's case", () => {
  const { board } = parseFen("8/4P3/8/8/8/8/k7/4K3 w - - 0 1");
  assert.equal(applyUci(board, "e7e8q").e8, "Q");
});
test("square colours", () => { assert.equal(isLightSquare("a1"), false); assert.equal(isLightSquare("h1"), true); });
```

- [ ] **Step 3: Run it:** `npm test` → FAIL (`Cannot find module .../js/chess/board.js`).
- [ ] **Step 4: Implement `js/chess/board.js`** (port `fromFen` from `index.html:638-654`, adding the validation).
- [ ] **Step 5: Run it:** `npm test` → PASS, 5 tests.
- [ ] **Step 6: Commit:** `git add package.json .gitignore js/chess tests/board.test.js && git commit -m "feat(v6): scaffold modules + board parsing with tests"`

---

### Task 2: Dev-only puzzle validator (chess.js)

**Files:**
- Create: `tools/package.json`, `tools/see.mjs`, `tools/validate-puzzles.mjs`
- Test: `tools/tests/see.test.mjs`

**Interfaces:**
- Consumes: `PUZZLES` from `js/data/puzzles-w1.js` (Task 3). The CLI imports it dynamically (`await import`) only when run without `--suggest`, so `--suggest` and the self-tests work before Task 3 exists.
- Produces (in `tools/see.mjs`): `VALUES = {p:1,n:3,b:3,r:5,q:9}`; `see(chess, square) -> number` (side to move's best gain from capturing on `square`, ≥ 0); `hangingSquares(fen, colour) -> string[]` (sorted); `expectedAccept(puzzle) -> string[]` (sorted); `validatePuzzle(puzzle) -> string[]` (error messages; empty means valid).

`tools/package.json`: `{"private":true,"type":"module","devDependencies":{"chess.js":"1.4.0"}}`. Run `npm --prefix tools install` once and commit `tools/package-lock.json`.

**Rules the validator enforces** (it computes the answer and compares; authors cannot pass a wrong answer key):
- FEN loads in `new Chess(fen)`, has 6 fields, White to move, game not over, and Black (the side not to move) is not in check. chess.js does not reject that last case itself.
- **SEE algorithm** (`see`): list legal captures onto `square`, take the one by the least valuable piece, play it, `gain = VALUES[captured] − see(chess, square)`, undo, return `max(0, gain)` (0 if there are no captures). `hangingSquares(fen, colour)`: set the side to move to the *other* colour (en passant field `-`) and return every non-king `colour` piece square with `see > 0`. Using legal moves means pins are respected.
- `tap-hanging`: `expectedAccept = hangingSquares(fen, "b")`, which must be non-empty.
- `take-free`: `expectedAccept` = legal White captures `m` where `m.to ∈ hangingSquares(fen,"b")`, the captured value equals the maximum value among hanging black pieces, and `m.to ∉ hangingSquares(after,"w")`. Must be non-empty.
- `save-piece`: precondition `hangingSquares(fen,"w")` non-empty. `expectedAccept` = legal White moves after which `hangingSquares(after,"w")` is empty. Must be non-empty and have ≤ 6 moves (otherwise the position is too vague to teach).
- For every accepted move: no promotion, no castling, no en passant, and Black has no mate-in-1 in the resulting position.
- `tag === "count"`: at least one black non-king piece has ≥ 1 White attacker *and* ≥ 1 Black defender, so counting actually matters.
- `accept` sorted must deep-equal `expectedAccept`; `prompt` and `explain` must be non-empty.
- CLI: `node tools/validate-puzzles.mjs` prints `FAIL <id>: <reason>` per problem and exits 1, or prints `OK <n> puzzles` and exits 0. `node tools/validate-puzzles.mjs --suggest "<fen>" <kind>` prints `expectedAccept` as JSON (an authoring aid).

- [ ] **Step 1: Write the failing test** `tools/tests/see.test.mjs` (every position below has been checked with chess.js 1.4.0):

```js
import test from "node:test"; import assert from "node:assert/strict";
import { hangingSquares, validatePuzzle } from "../see.mjs";
test("undefended queen hangs", () =>
  assert.deepEqual(hangingSquares("4k3/8/8/4q3/8/5N2/8/6K1 w - - 0 1", "b"), ["e5"]));
test("v5 bug: Ne2 does NOT attack e5", () =>
  assert.deepEqual(hangingSquares("4k3/8/8/4q3/8/8/4N3/4K3 w - - 0 1", "b"), []));
test("pawn-defended bishop is not hanging", () =>
  assert.deepEqual(hangingSquares("4k3/8/8/3p4/4b3/2N5/8/4K3 w - - 0 1", "b"), []));
test("two attackers vs one defender: hanging", () =>
  assert.deepEqual(hangingSquares("4k3/8/2n5/4n3/8/3N1N2/8/6K1 w - - 0 1", "b"), ["e5"]));
test("extra pawn defender: not hanging", () =>
  assert.deepEqual(hangingSquares("4k3/8/2n2p2/4n3/8/3N1N2/8/6K1 w - - 0 1", "b"), []));
test("v5 bug: illegal position rejected", () =>
  assert.ok(validatePuzzle({ id:"x", kind:"tap-hanging", tag:"spot", fen:"4k3/8/8/3n4/8/8/4R3/4K3 w - - 0 1",
    accept:["d5"], prompt:"p", explain:"e" }).length > 0));
test("wrong answer key rejected", () =>
  assert.ok(validatePuzzle({ id:"y", kind:"take-free", tag:"free", fen:"4k3/8/8/4q3/8/5N2/8/6K1 w - - 0 1",
    accept:["f3d4"], prompt:"p", explain:"e" }).length > 0));
test("correct take-free accepted", () =>
  assert.deepEqual(validatePuzzle({ id:"z", kind:"take-free", tag:"free", fen:"4k3/8/8/4q3/8/5N2/8/6K1 w - - 0 1",
    accept:["f3e5"], prompt:"p", explain:"e" }), []));
```

- [ ] **Step 2: Run it:** `npm --prefix tools install && node --test tools/tests/` → FAIL (`see.mjs` missing).
- [ ] **Step 3: Implement `tools/see.mjs` and `tools/validate-puzzles.mjs`** following the rules above.
- [ ] **Step 4: Run it:** `node --test tools/tests/` → PASS, 8 tests. Also run `node tools/validate-puzzles.mjs --suggest "4k3/8/8/4q3/8/5N2/8/6K1 w - - 0 1" take-free` → `["f3e5"]`.
- [ ] **Step 5: Commit:** `git add tools/package.json tools/package-lock.json tools/see.mjs tools/validate-puzzles.mjs tools/tests && git commit -m "feat(v6): dev-only puzzle validator with SEE hanging detection"`

---

### Task 3: World data + World 1 puzzles (validated)

**Files:**
- Create: `js/data/worlds.js`, `js/data/puzzles-w1.js`
- Test: `tests/data.test.js`

**Interfaces:**
- Consumes: `validatePuzzle` CLI (Task 2).
- Produces: in `js/data/worlds.js`: `WORLDS: World[]` (6, in spec order), `worldById(id: number) -> World`; in `js/data/puzzles-w1.js`: `PUZZLES: Puzzle[]`, `puzzlesById() -> Map<string, Puzzle>`.

**Fixed values:**

| World | name | levels | boss |
|---|---|---|---|
| 1 | Don't Hang Pieces | `w1-l1` Spot the Hanging Piece (`spot`, kind tap-hanging) · `w1-l2` Free Lunch (`free`, take-free) · `w1-l3` Count Attackers & Defenders (`count`, mix of tap-hanging and take-free) · `w1-l4` Save Your Piece (`save`, save-piece) | `w1-boss` "Boss: Don't Hang Pieces" |
| 2 | Mate in 1 & 2 | `[]`, `comingSoon: true` | `null` |
| 3 | Forks & Double Attacks | same | `null` |
| 4 | Pins & Skewers | same | `null` |
| 5 | Survive the Opening | same | `null` |
| 6 | Simple Endgames | same | `null` |

World 1 blurb: "Before every move: what's attacked, what's defended?". Level puzzles get ids `w1-l{n}-0{1..5}`; boss puzzles get ids `w1-b-{01..12}` with `level: null, boss: "w1-boss"`, 3 per tag, using the tag's kind. Positions should look like real middlegames (6–14 pieces each), not two-piece diagrams. Every `explain` names the squares, e.g. "The rook on d5 is attacked twice and defended once — Nxd5 wins it."

- [ ] **Step 1: Write the failing test** `tests/data.test.js`

```js
import test from "node:test"; import assert from "node:assert/strict";
import { WORLDS } from "../js/data/worlds.js"; import { PUZZLES } from "../js/data/puzzles-w1.js";
test("six worlds in spec order", () => assert.deepEqual(WORLDS.map(w => w.name),
  ["Don't Hang Pieces","Mate in 1 & 2","Forks & Double Attacks","Pins & Skewers","Survive the Opening","Simple Endgames"]));
test("worlds 2-6 coming soon", () => assert.ok(WORLDS.slice(1).every(w => w.comingSoon && w.levels.length === 0)));
test("unique ids", () => assert.equal(new Set(PUZZLES.map(p => p.id)).size, PUZZLES.length));
test("5 puzzles per level, matching tag", () => { for (const l of WORLDS[0].levels) {
  const ps = PUZZLES.filter(p => p.level === l.id); assert.equal(ps.length, 5, l.id);
  assert.ok(ps.every(p => p.tag === l.tag && p.boss === null)); } });
test("boss pool: 12, 3 per tag, never in levels", () => {
  const b = PUZZLES.filter(p => p.boss === "w1-boss"); assert.equal(b.length, 12);
  for (const t of ["spot","free","count","save"]) assert.equal(b.filter(p => p.tag === t).length, 3);
  assert.ok(b.every(p => p.level === null)); });
test("no duplicate positions", () => assert.equal(new Set(PUZZLES.map(p => p.fen.split(" ")[0])).size, PUZZLES.length));
```

- [ ] **Step 2: Run it:** `npm test` → FAIL (module missing).
- [ ] **Step 3: Write `js/data/worlds.js`** with the table above.
- [ ] **Step 4: Author the 32 puzzles in `js/data/puzzles-w1.js`**, using `--suggest` to fill each `accept`.
- [ ] **Step 5: Validate:** `npm run validate` → `OK 32 puzzles`, exit 0. Fix any `FAIL` line by changing the position, never by editing the validator.
- [ ] **Step 6: Run it:** `npm test` → PASS.
- [ ] **Step 7: Commit:** `git add js/data tests/data.test.js && git commit -m "feat(v6): World 1 data with 32 validated puzzles"`

---

### Task 4: Stars, progress rules, storage

**Files:**
- Create: `js/version.js`, `js/logic/stars.js`, `js/logic/progress.js`, `js/storage.js`
- Test: `tests/progress.test.js`, `tests/storage.test.js`

**Interfaces:**
- Consumes: `WORLDS` (Task 3).
- Produces:
  - `js/version.js`: `APP_VERSION = "chess-coach-v6"`, `STORAGE_KEY = "chess-teacher-v6"`.
  - `js/logic/stars.js`: `LIVES_PER_LEVEL = 3`; `starsForLives(n: number) -> 0|1|2|3` (clamped).
  - `js/logic/progress.js`: `defaultProgress() -> Progress`; `levelStatus(p, worlds, levelId) -> "locked"|"open"|"cleared"`; `bossStatus(p, worlds, worldId) -> "locked"|"gated"|"open"|"passed"`; `worldStatus(p, worlds, worldId) -> "coming-soon"|"locked"|"open"|"passed"`; `currentLevelId(p, worlds) -> string|null` (first open, uncleared level); `recordLevelResult(p, levelId, livesLeft) -> Progress` (never mutates; 0 lives returns `p` unchanged; clearing a level removes any `bossGate` entry pointing at it); `recordBossResult(p, bossId, ids: string[], grade: BossGrade) -> Progress`.
  - `js/storage.js`: `loadProgress(storage = globalThis.localStorage) -> Progress` (never throws; returns `defaultProgress()` if data is missing, unparsable or `version !== 6`, otherwise does a shallow merge over the defaults); `saveProgress(p, storage = globalThis.localStorage) -> boolean` (false on any throw).
- Rule: a world with `comingSoon` is always `"coming-soon"`. World 1 is `"open"`, or `"passed"` once its boss is passed. In Phase 1 a passed World 1 does not open World 2.

- [ ] **Step 1: Write the failing tests**

```js
// tests/progress.test.js
import test from "node:test"; import assert from "node:assert/strict";
import { WORLDS } from "../js/data/worlds.js"; import { starsForLives } from "../js/logic/stars.js";
import * as P from "../js/logic/progress.js";
const clearAll = (p) => ["w1-l1","w1-l2","w1-l3","w1-l4"].reduce((q, id) => P.recordLevelResult(q, id, 3), p);
test("stars from lives", () => assert.deepEqual([3,2,1,0,5,-1].map(starsForLives), [3,2,1,0,3,0]));
test("fresh: only w1-l1 open", () => { const p = P.defaultProgress();
  assert.equal(P.levelStatus(p, WORLDS, "w1-l1"), "open"); assert.equal(P.levelStatus(p, WORLDS, "w1-l2"), "locked");
  assert.equal(P.bossStatus(p, WORLDS, 1), "locked"); assert.equal(P.worldStatus(p, WORLDS, 2), "coming-soon");
  assert.equal(P.currentLevelId(p, WORLDS), "w1-l1"); });
test("clearing unlocks next and keeps best stars", () => {
  let p = P.recordLevelResult(P.defaultProgress(), "w1-l1", 2);
  assert.deepEqual(p.levels["w1-l1"], { stars: 2, cleared: true }); assert.equal(P.levelStatus(p, WORLDS, "w1-l2"), "open");
  p = P.recordLevelResult(P.recordLevelResult(p, "w1-l1", 3), "w1-l1", 1); assert.equal(p.levels["w1-l1"].stars, 3); });
test("0 lives changes nothing", () => { const p = P.defaultProgress(); assert.equal(P.recordLevelResult(p, "w1-l1", 0), p); });
test("boss opens after all levels", () => assert.equal(P.bossStatus(clearAll(P.defaultProgress()), WORLDS, 1), "open"));
test("boss fail gates until weak level re-cleared", () => {
  let p = P.recordBossResult(clearAll(P.defaultProgress()), "w1-boss", ["a"], { score: 3, passed: false, weakLevelId: "w1-l3", weakTags: ["count"] });
  assert.equal(P.bossStatus(p, WORLDS, 1), "gated"); assert.equal(p.bossGate["w1-boss"], "w1-l3");
  assert.equal(p.bosses["w1-boss"].attempts, 1);
  p = P.recordLevelResult(p, "w1-l3", 1); assert.equal(P.bossStatus(p, WORLDS, 1), "open"); });
test("boss pass completes world 1 only", () => {
  const p = P.recordBossResult(clearAll(P.defaultProgress()), "w1-boss", ["a"], { score: 4, passed: true, weakLevelId: null, weakTags: [] });
  assert.equal(P.worldStatus(p, WORLDS, 1), "passed"); assert.equal(P.worldStatus(p, WORLDS, 2), "coming-soon"); });
```

```js
// tests/storage.test.js
import test from "node:test"; import assert from "node:assert/strict";
import { loadProgress, saveProgress } from "../js/storage.js"; import { defaultProgress } from "../js/logic/progress.js";
const mem = (init = {}) => { const d = { ...init }; return { d, getItem: k => d[k] ?? null, setItem: (k, v) => { d[k] = v; } }; };
test("missing -> default", () => assert.deepEqual(loadProgress(mem()), defaultProgress()));
test("corrupt -> default", () => assert.deepEqual(loadProgress(mem({ "chess-teacher-v6": "{oops" })), defaultProgress()));
test("wrong version -> default", () => assert.deepEqual(loadProgress(mem({ "chess-teacher-v6": '{"level":3}' })), defaultProgress()));
test("partial merges over defaults", () => { const p = loadProgress(mem({ "chess-teacher-v6": '{"version":6,"streak":{"count":2,"lastDate":"2026-10-19"}}' }));
  assert.equal(p.streak.count, 2); assert.deepEqual(p.levels, {}); });
test("round trip on v6 key, v5 untouched", () => { const s = mem({ "chess-teacher-v5": "old" });
  assert.equal(saveProgress(defaultProgress(), s), true); assert.ok(s.d["chess-teacher-v6"]); assert.equal(s.d["chess-teacher-v5"], "old"); });
test("quota error -> false, no throw", () => assert.equal(saveProgress(defaultProgress(), { setItem() { throw new Error("full"); } }), false));
```

- [ ] **Step 2: Run them:** `npm test` → FAIL (modules missing).
- [ ] **Step 3: Implement** `js/version.js`, `js/logic/stars.js`, `js/logic/progress.js`, `js/storage.js` to the signatures above.
- [ ] **Step 4: Run them:** `npm test` → PASS.
- [ ] **Step 5: Commit:** `git add js/version.js js/logic/stars.js js/logic/progress.js js/storage.js tests/progress.test.js tests/storage.test.js && git commit -m "feat(v6): stars, unlock rules, defensive storage"`

---

### Task 5: Dates, spaced review, streak, answer recording

**Files:**
- Create: `js/logic/dates.js`, `js/logic/review.js`, `js/logic/streak.js`
- Modify: `js/logic/progress.js` (add `recordAnswer`)
- Test: `tests/review.test.js`, `tests/streak.test.js`

**Interfaces:**
- Produces:
  - `dates.js`: `localDateKey(d: Date) -> "YYYY-MM-DD"` (built from `getFullYear/getMonth/getDate`); `addDays(key, n) -> key`; `dayDiff(a, b) -> number` (b − a in whole days, computed via `Date.UTC`).
  - `review.js`: `REVIEW_INTERVALS = [1, 3, 7, 16, 35]`; `scheduleAnswer(review, id, correct, today) -> review` (new object; a miss gives `{box:0, due: today+1}`; a hit on a tracked item gives `box = min(box+1, 4)` and `due = today + REVIEW_INTERVALS[box]`; a hit on an untracked item changes nothing); `dueIds(review, today) -> string[]` (due ≤ today, sorted by due then id).
  - `streak.js`: `updateStreak(streak, today) -> streak` (same day: unchanged; the day after `lastDate`: +1; otherwise `{count:1, lastDate:today}`); `displayStreak(streak, today) -> number` (shows the count if `lastDate` is today or yesterday, otherwise 0).
  - `progress.js`: `recordAnswer(p, puzzle, correct, today) -> Progress` (bumps `tagSeen[tag]`; bumps `tagMisses[tag]` on a miss; `review = scheduleAnswer(...)`); `completeSession(p, today) -> Progress` (only this function calls `updateStreak`).

- [ ] **Step 1: Write the failing tests**

```js
// tests/review.test.js
import test from "node:test"; import assert from "node:assert/strict";
import { scheduleAnswer, dueIds } from "../js/logic/review.js"; import { addDays } from "../js/logic/dates.js";
test("addDays crosses month", () => assert.equal(addDays("2026-10-31", 1), "2026-11-01"));
test("miss -> box 0 due tomorrow", () => assert.deepEqual(scheduleAnswer({}, "a", false, "2026-10-20").a, { box: 0, due: "2026-10-21" }));
test("hit climbs boxes", () => { const r = scheduleAnswer({ a: { box: 0, due: "2026-10-21" } }, "a", true, "2026-10-21");
  assert.deepEqual(r.a, { box: 1, due: "2026-10-24" }); });
test("top box stays at 35 days", () => assert.deepEqual(scheduleAnswer({ a: { box: 4, due: "2026-10-20" } }, "a", true, "2026-10-20").a, { box: 4, due: "2026-11-24" }));
test("hit on untracked ignored", () => assert.deepEqual(scheduleAnswer({}, "a", true, "2026-10-20"), {}));
test("dueIds sorted", () => assert.deepEqual(dueIds({ b: { box: 0, due: "2026-10-19" }, a: { box: 0, due: "2026-10-19" }, c: { box: 1, due: "2026-10-25" } }, "2026-10-20"), ["a", "b"]));
```

```js
// tests/streak.test.js
import test from "node:test"; import assert from "node:assert/strict";
import { updateStreak, displayStreak } from "../js/logic/streak.js"; import { localDateKey } from "../js/logic/dates.js";
import { completeSession, recordAnswer, defaultProgress } from "../js/logic/progress.js";
test("first session", () => assert.deepEqual(updateStreak({ count: 0, lastDate: null }, "2026-10-20"), { count: 1, lastDate: "2026-10-20" }));
test("twice same day counts once", () => assert.deepEqual(updateStreak({ count: 3, lastDate: "2026-10-20" }, "2026-10-20"), { count: 3, lastDate: "2026-10-20" }));
test("next day +1 across month", () => assert.equal(updateStreak({ count: 3, lastDate: "2026-10-31" }, "2026-11-01").count, 4));
test("gap resets to 1", () => assert.equal(updateStreak({ count: 9, lastDate: "2026-10-17" }, "2026-10-20").count, 1));
test("display drops to 0 after a missed day", () => { assert.equal(displayStreak({ count: 5, lastDate: "2026-10-19" }, "2026-10-20"), 5);
  assert.equal(displayStreak({ count: 5, lastDate: "2026-10-18" }, "2026-10-20"), 0); });
test("local midnight boundary", () => { assert.equal(localDateKey(new Date(2026, 9, 20, 23, 50)), "2026-10-20");
  assert.equal(localDateKey(new Date(2026, 9, 21, 0, 10)), "2026-10-21"); });
test("answers alone never move the streak", () => {
  const p = recordAnswer(defaultProgress(), { id: "w1-l1-01", tag: "spot" }, false, "2026-10-20");
  assert.equal(p.streak.count, 0); assert.equal(p.tagMisses.spot, 1); assert.equal(p.tagSeen.spot, 1);
  assert.equal(completeSession(p, "2026-10-20").streak.count, 1); });
```

- [ ] **Step 2: Run them:** `npm test` → FAIL.
- [ ] **Step 3: Implement** `dates.js`, `review.js`, `streak.js`, plus `recordAnswer` and `completeSession` in `progress.js`.
- [ ] **Step 4: Run them:** `npm test` → PASS (the date tests assume the box is in Brisbane local time, which it is).
- [ ] **Step 5: Commit:** `git add js/logic tests/review.test.js tests/streak.test.js && git commit -m "feat(v6): spaced review, streak, local dates"`

---

### Task 6: Seeded RNG + boss build/grade

**Files:**
- Create: `js/logic/rng.js`, `js/logic/boss.js`
- Test: `tests/boss.test.js`

**Interfaces:**
- Consumes: `WORLDS`, `PUZZLES`, `puzzlesById` (Task 3).
- Produces:
  - `rng.js`: `makeRng(seed: number) -> () => number` (mulberry32); `shuffle(arr, rng) -> arr` (copy, Fisher–Yates); `seedFrom(str) -> number` (FNV-1a 32-bit).
  - `boss.js`: `BOSS_SIZE = 5`, `BOSS_PASS = 4`; `buildBoss(world, puzzles, lastIds: string[], rng) -> string[]`; `gradeBoss(results: {id, correct}[], byId: Map, world) -> BossGrade` where `BossGrade = { score, passed, weakLevelId: string|null, weakTags: string[] }`.
- `buildBoss` algorithm: pool = puzzles with `boss === world.boss.id`. Throw `Error("Boss pool too small")` if `pool.length < BOSS_SIZE`. Take one puzzle per level tag (in level order), then one more chosen at random. In every pick, prefer ids not in `lastIds` and use them first. Shuffle the final order.
- `gradeBoss`: `passed = score >= BOSS_PASS`. When failed, `weakTags` = tags with the most misses, and `weakLevelId` = the level with the first such tag in level order (so ties go to the earlier level).

- [ ] **Step 1: Write the failing test** `tests/boss.test.js`

```js
import test from "node:test"; import assert from "node:assert/strict";
import { WORLDS } from "../js/data/worlds.js"; import { PUZZLES } from "../js/data/puzzles-w1.js";
import { buildBoss, gradeBoss } from "../js/logic/boss.js"; import { makeRng } from "../js/logic/rng.js";
const w1 = WORLDS[0], byId = new Map(PUZZLES.map(p => [p.id, p]));
const bossIds = (t) => PUZZLES.filter(p => p.boss === "w1-boss" && p.tag === t).map(p => p.id);
test("5 unique boss-only ids covering all 4 tags", () => { const ids = buildBoss(w1, PUZZLES, [], makeRng(1));
  assert.equal(new Set(ids).size, 5); assert.ok(ids.every(id => byId.get(id).boss === "w1-boss"));
  assert.deepEqual(new Set(ids.map(id => byId.get(id).tag)), new Set(["spot","free","count","save"])); });
test("retry shows fresh positions", () => { const a = buildBoss(w1, PUZZLES, [], makeRng(1)), b = buildBoss(w1, PUZZLES, a, makeRng(2));
  assert.equal(b.filter(id => a.includes(id)).length, 0); });
test("deterministic per seed", () => assert.deepEqual(buildBoss(w1, PUZZLES, [], makeRng(7)), buildBoss(w1, PUZZLES, [], makeRng(7))));
test("tiny pool throws", () => assert.throws(() => buildBoss(w1, PUZZLES.filter(p => p.boss).slice(0, 4), [], makeRng(1)), /too small/));
test("4/5 passes", () => { const r = ["spot","free","count","save","spot"].map((t, i) => ({ id: bossIds(t)[i % 3], correct: i !== 2 }));
  assert.deepEqual(gradeBoss(r, byId, w1), { score: 4, passed: true, weakLevelId: null, weakTags: [] }); });
test("3/5 routes to most-missed level", () => { const c = bossIds("count");
  const r = [{ id: c[0], correct: false }, { id: c[1], correct: false }, { id: bossIds("spot")[0], correct: true }, { id: bossIds("free")[0], correct: true }, { id: bossIds("save")[0], correct: true }];
  const g = gradeBoss(r, byId, w1); assert.equal(g.passed, false); assert.equal(g.weakLevelId, "w1-l3"); assert.deepEqual(g.weakTags, ["count"]); });
test("tie goes to earlier level", () => { const r = [{ id: bossIds("save")[0], correct: false }, { id: bossIds("spot")[0], correct: false },
  { id: bossIds("free")[0], correct: true }, { id: bossIds("count")[0], correct: true }, { id: bossIds("free")[1], correct: true }];
  assert.equal(gradeBoss(r, byId, w1).weakLevelId, "w1-l1"); });
```

- [ ] **Step 2: Run it:** `npm test` → FAIL.
- [ ] **Step 3: Implement** `rng.js` and `boss.js`.
- [ ] **Step 4: Run it:** `npm test` → PASS.
- [ ] **Step 5: Commit:** `git add js/logic/rng.js js/logic/boss.js tests/boss.test.js && git commit -m "feat(v6): boss mastery check (4/5) with weak-level routing"`

---

### Task 7: Daily session builder

**Files:**
- Create: `js/logic/session.js`
- Test: `tests/session.test.js`

**Interfaces:**
- Consumes: `levelStatus`, `currentLevelId` (Task 4); `dueIds` (Task 5); `makeRng`, `shuffle` (Task 6).
- Produces: `SESSION_SIZE = 10`; `SESSION_MIX = { weak: 4, current: 4, review: 2 }`; `buildDailySession({ progress, worlds, puzzles, today, rng }) -> string[]`.
- Algorithm. **Playable** = level puzzles (never boss puzzles) whose level is not locked. Picks never repeat.
  1. **Review:** up to 2 from `dueIds(progress.review, today)` that are playable, earliest first.
  2. **Weak:** up to 4 from playable puzzles whose tag has `tagMisses > 0`. Rank tags by `misses / seen` (descending) and pick at random within each tag.
  3. **Current:** up to 4 at random from the `currentLevelId` level, or from all playable puzzles if it's `null`.
  4. **Fill:** top up to 10 at random from the rest of the playable puzzles.
  5. Shuffle with `rng`.

- [ ] **Step 1: Write the failing test** `tests/session.test.js`

```js
import test from "node:test"; import assert from "node:assert/strict";
import { WORLDS } from "../js/data/worlds.js"; import { PUZZLES } from "../js/data/puzzles-w1.js";
import { buildDailySession } from "../js/logic/session.js"; import { makeRng } from "../js/logic/rng.js";
import * as P from "../js/logic/progress.js";
const byId = new Map(PUZZLES.map(p => [p.id, p])), today = "2026-10-20";
const run = (progress, seed = 1) => buildDailySession({ progress, worlds: WORLDS, puzzles: PUZZLES, today, rng: makeRng(seed) });
test("fresh player gets level 1's five", () => { const ids = run(P.defaultProgress());
  assert.equal(ids.length, 5); assert.ok(ids.every(id => byId.get(id).level === "w1-l1")); });
test("40/40/20 mix", () => {
  let p = ["w1-l1","w1-l2","w1-l3"].reduce((q, id) => P.recordLevelResult(q, id, 3), P.defaultProgress());
  p = { ...p, tagSeen: { spot: 5, free: 5 }, tagMisses: { spot: 3 },
        review: { "w1-l2-01": { box: 0, due: "2026-10-19" }, "w1-l2-02": { box: 0, due: "2026-10-20" } } };
  const ids = run(p), ps = ids.map(id => byId.get(id));
  assert.equal(ids.length, 10); assert.equal(new Set(ids).size, 10);
  assert.ok(ids.includes("w1-l2-01") && ids.includes("w1-l2-02"));
  assert.ok(ps.filter(x => x.tag === "spot").length >= 4); assert.ok(ps.filter(x => x.level === "w1-l4").length >= 4);
  assert.ok(ps.every(x => x.boss === null)); });
test("same seed same session", () => assert.deepEqual(run(P.defaultProgress(), 3), run(P.defaultProgress(), 3)));
```

- [ ] **Step 2: Run it:** `npm test` → FAIL.
- [ ] **Step 3: Implement `buildDailySession`** in `js/logic/session.js`.
- [ ] **Step 4: Run it:** `npm test` → PASS.
- [ ] **Step 5: Commit:** `git add js/logic/session.js tests/session.test.js && git commit -m "feat(v6): daily session builder (4 weak / 4 current / 2 review)"`

---

### Task 8: Answer checking + tap-to-move selection

**Files:**
- Create: `js/logic/answer.js`
- Test: `tests/answer.test.js`

**Interfaces:**
- Consumes: `parseFen` (Task 1).
- Produces: `checkAnswer(puzzle, answer: { squares?: string[], uci?: string }) -> boolean` (tap-hanging: the tapped squares must exactly match `accept`, in any order; move kinds: `accept.includes(uci.toLowerCase())`); `nextSelection(sel: string|null, square: string, board, turn) -> { sel: string|null, move: string|null }`.

- [ ] **Step 1: Write the failing test** `tests/answer.test.js`

```js
import test from "node:test"; import assert from "node:assert/strict";
import { checkAnswer, nextSelection } from "../js/logic/answer.js"; import { parseFen } from "../js/chess/board.js";
const { board } = parseFen("4k3/8/8/4q3/8/5N2/8/6K1 w - - 0 1");
test("tap-hanging exact set any order", () => { const pz = { kind: "tap-hanging", accept: ["d5", "e5"] };
  assert.equal(checkAnswer(pz, { squares: ["e5", "d5"] }), true); assert.equal(checkAnswer(pz, { squares: ["e5"] }), false);
  assert.equal(checkAnswer(pz, { squares: ["e5", "d5", "a1"] }), false); });
test("move kinds", () => { const pz = { kind: "take-free", accept: ["f3e5"] };
  assert.equal(checkAnswer(pz, { uci: "f3e5" }), true); assert.equal(checkAnswer(pz, { uci: "f3d4" }), false); });
test("stray taps never form a move", () => {
  assert.deepEqual(nextSelection(null, "a4", board, "w"), { sel: null, move: null });   // empty
  assert.deepEqual(nextSelection(null, "e5", board, "w"), { sel: null, move: null });   // opponent piece
  assert.deepEqual(nextSelection("f3", "f3", board, "w"), { sel: null, move: null });   // same piece again
});
test("select, reselect, move", () => {
  assert.deepEqual(nextSelection(null, "f3", board, "w"), { sel: "f3", move: null });
  assert.deepEqual(nextSelection("f3", "g1", board, "w"), { sel: "g1", move: null });
  assert.deepEqual(nextSelection("f3", "e5", board, "w"), { sel: null, move: "f3e5" }); });
```

- [ ] **Step 2: Run it:** `npm test` → FAIL.
- [ ] **Step 3: Implement** `js/logic/answer.js`.
- [ ] **Step 4: Run it:** `npm test` → PASS.
- [ ] **Step 5: Commit:** `git add js/logic/answer.js tests/answer.test.js && git commit -m "feat(v6): answer checking and safe tap-to-move"`

---

### Task 9: UI: styles, board view, screens, app wiring, SW v6

**Files:**
- Create: `css/app.css` (move `index.html:15-609` verbatim, then add map/world/boss styles), `js/ui/board-view.js`, `js/ui/screens.js`, `js/ui/update.js`, `js/app.js`
- Modify: `index.html` (replace with the shell: keep lines 1-13 meta/manifest/icons, `<link rel="stylesheet" href="css/app.css">`, `#app`, `#toast`, `<script type="module" src="js/app.js"></script>`), `sw.js` (CACHE + SHELL), `manifest.json` (description: "5–10 minute daily chess training toward 1500 Rapid")
- Test: `tests/screens.test.js`, `tests/sw.test.js`

**Interfaces:**
- Consumes: everything above.
- Produces:
  - `board-view.js`: `renderBoard(board, { selected?: string, picked?: string[], highlight?: string[], interactive?: boolean }) -> string`. Port from `index.html:1095-1134`; selection uses the `picked` style, and interactive squares carry `data-sq`.
  - `screens.js` (pure, no `document`): `renderMap(progress, worlds, { today, updateReady, updateChecking, appVersion }) -> string`; `renderPuzzle(view: { title, puzzle, board, lives|null, index, total, selected, picked }) -> string`; `renderFeedback({ correct, explain, lives|null }) -> string`; `renderLevelResult({ levelName, stars, livesLeft, nextLevelName|null, bossUnlocked }) -> string`; `renderBossResult(grade, worlds) -> string`; `renderSessionEnd({ correct, total, streak }) -> string`.
  - `update.js`: `initUpdates(onChange: () => void) -> { check(): Promise<void>, apply(): Promise<void>, state: { updateReady, updateChecking } }`. Port from `index.html:1161-1204` and `1715-1750` unchanged in behaviour; the toast text stays the same.
  - `app.js`: owns `{ screen: "map"|"puzzle"|"feedback"|"level-result"|"boss-result"|"session-end", mode: "level"|"boss"|"session", ids, index, lives, results, sel, picked }`. Every user action dispatches through `data-action` (`play-level` with `data-level`, `play-boss`, `play-session`, `submit-taps`, `clear-taps`, `next`, `home`, `check-update`, `apply-update`). Square taps are handled only when `screen === "puzzle"`. Every answer calls `recordAnswer`; levels call `recordLevelResult` and the boss calls `recordBossResult`. A finished session calls `completeSession`, and then `saveProgress` runs. The session rng seed is `seedFrom(today)` and the boss seed is `seedFrom(today + attempts)`. Levels use lives (wrong answer = −1, at 0 lives the level ends with "Out of lives — have another go."); the boss and the session have no lives. After a wrong move the correct move is shown and the answer counts as a miss.
- Screen text is trusted constant data and is inserted without HTML escaping (`&` stays as-is).
- **Exact copy** (AU English):

| Where | Text |
|---|---|
| Map header | `Chess - Teacher` / `Climb toward 1500 Rapid` |
| Daily button | `Play today's session` |
| Streak | `🔥 {n} day streak` (n = `displayStreak`) |
| Locked world 2–6 | `Coming soon` |
| Boss node | `Boss: Don't Hang Pieces` · `Pass 4 of 5 to clear the world` |
| Gated boss | `Practise {levelName} first, then have another go.` |
| Level clear | `Level clear` · `{stars} star(s)` |
| Out of lives | `Out of lives — have another go.` |
| Boss pass | `World 1 complete!` · `You passed {score} of 5.` |
| Boss fail | `Not yet — {score} of 5.` · `Your weak spot: {levelName}.` · button `Practise {levelName}` |
| Session end | `Session done` · `{correct} of {total} correct` |

- [ ] **Step 1: Write the failing tests**

```js
// tests/screens.test.js
import test from "node:test"; import assert from "node:assert/strict";
import { renderMap, renderBossResult } from "../js/ui/screens.js";
import { WORLDS } from "../js/data/worlds.js"; import { defaultProgress } from "../js/logic/progress.js";
const opts = { today: "2026-10-20", updateReady: false, updateChecking: false, appVersion: "chess-coach-v6" };
test("map shows all worlds, one playable level, daily button", () => { const h = renderMap(defaultProgress(), WORLDS, opts);
  for (const w of WORLDS) assert.ok(h.includes(w.name), w.name);
  assert.equal(h.match(/data-action="play-level"/g).length, 1); assert.equal(h.match(/Coming soon/g).length, 5);
  assert.ok(h.includes("Play today's session")); assert.ok(h.includes("Check for update")); assert.ok(h.includes("chess-coach-v6"));
  assert.ok(!/chess\.com/i.test(h)); });
test("update banner when ready", () => assert.ok(renderMap(defaultProgress(), WORLDS, { ...opts, updateReady: true }).includes("Update now")));
test("boss fail routes to weak level", () => { const h = renderBossResult({ score: 3, passed: false, weakLevelId: "w1-l3", weakTags: ["count"] }, WORLDS);
  assert.ok(h.includes("Not yet — 3 of 5.")); assert.ok(h.includes("Practise Count Attackers & Defenders"));
  assert.ok(h.includes('data-level="w1-l3"')); });
test("boss pass", () => assert.ok(renderBossResult({ score: 5, passed: true, weakLevelId: null, weakTags: [] }, WORLDS).includes("World 1 complete!")));
```

```js
// tests/sw.test.js
import test from "node:test"; import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs"; import { APP_VERSION } from "../js/version.js";
const sw = readFileSync(new URL("../sw.js", import.meta.url), "utf8");
const walk = (d) => readdirSync(new URL(`../${d}/`, import.meta.url), { withFileTypes: true })
  .flatMap(e => e.isDirectory() ? walk(`${d}/${e.name}`) : [`./${d}/${e.name}`]);
test("cache name matches app version", () => { assert.equal(APP_VERSION, "chess-coach-v6"); assert.ok(sw.includes(`"${APP_VERSION}"`)); });
test("every module and stylesheet is in the shell", () => {
  for (const f of [...walk("js"), ...walk("css"), "./index.html", "./manifest.json", "./favicon.svg"]) assert.ok(sw.includes(`"${f}"`), f); });
```

- [ ] **Step 2: Run them:** `npm test` → FAIL.
- [ ] **Step 3: Implement** `css/app.css`, `board-view.js`, `screens.js`, `update.js`, `app.js`, the `index.html` shell, the `sw.js` SHELL list (every file explicitly, `CACHE = "chess-coach-v6"`, fetch handler unchanged), and the manifest change. Map layout: the v5 vertical path (`renderPath`, `index.html:1206-1259`) becomes one section per world: a world header, then its level nodes with stars and locks, then a boss node with a crown icon. Worlds 2–6 show as dimmed headers with 🔒 and `Coming soon`. The daily button and streak sit at the top.
- [ ] **Step 4: Run them:** `npm test` → PASS (all suites).
- [ ] **Step 5: Commit:** `git add -A css js index.html sw.js manifest.json tests && git commit -m "feat(v6): modular UI, World 1 map, boss and daily session screens"`

---

### Task 10: Phone-size smoke test, README, ship

**Files:**
- Modify: `README.md` (v6: worlds, boss rule, daily mix, module layout, `npm test`, `npm run validate`, version/storage keys)

- [ ] **Step 1: Full checks:** `npm test && npm run validate` → all pass, `OK 32 puzzles`.
- [ ] **Step 2: Local smoke test:** `python3 -m http.server 8765` in the repo, then open `http://localhost:8765/` in the box browser at a 390×844 viewport. Check: the map shows 6 worlds, only Level 1 has a Play button, and there's no console error. Play Level 1 with one deliberate miss and get 2★ with Level 2 unlocked. Clear Levels 2–4 to unlock the boss. Fail the boss on purpose: you should see `Not yet`, a `Practise …` button, and the boss gated. Clear that level and the boss reopens. Pass it and see `World 1 complete!`. Play today's session: the streak shows `🔥 1 day streak`, and a second session the same day leaves it at 1. Reload the page and progress is kept. The board squares stay square and the board fits with no sideways scroll.
- [ ] **Step 3: Update README.md** and commit: `git add README.md && git commit -m "docs: README for v6 preview"`
- [ ] **Step 4: Ship:** `git checkout main && git merge --ff-only v6-phase1 && git push origin main`
- [ ] **Step 5: Verify live:** wait about 1–2 minutes, then `curl -s https://stewartcampbell88-commits.github.io/chess-coach-preview/sw.js | grep chess-coach-v6` and `curl -sI https://stewartcampbell88-commits.github.io/chess-coach-preview/js/app.js` → both found (HTTP 200). On the phone: **Check for update** → **Update now** → the map shows `chess-coach-v6`.

---

## Self-review notes

- **Spec coverage:** look/colours (Global, Task 9) · map/worlds/levels/boss (Tasks 3, 4, 9) · 5 puzzles, 3 lives, stars (Tasks 3, 4) · sequential unlock (Task 4) · GM world order (Task 3) · boss = mastery check 4/5 with fail routing (Tasks 4, 6, 9) · daily one tap 40/40/20 + spaced repetition + streak (Tasks 5, 7, 9) · PWA update UX (Task 9) · preview first (Phase 1 scope). Deferred by phase: Worlds 2–6 content and endgames mixed into review from World 3 (Phase 2), Chess.com data (Phase 3), tuning (Phase 4).
- **Known v5 content bugs this fixes:** `l1-drill-hang-tap` (a knight on e2 doesn't attack e5) and `l4-drill-timed` (an illegal position: Black's king is in check with White to move, and the rook doesn't attack d5). Both are pinned as validator self-tests in Task 2.
