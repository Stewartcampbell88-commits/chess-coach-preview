# Chess - Teacher — phone preview (v8.1)

A 5–10 minute daily chess game for Stewart Campbell (`stewartcamp`) aimed at climbing Chess.com Rapid toward **1500**. It teaches the way a grandmaster would relearn: lots of short, real-position puzzles, tactics before openings, and a boss at the end of each world that checks you've actually learned it.

**Live:** https://stewartcampbell88-commits.github.io/chess-coach-preview/

- Spec: `docs/superpowers/specs/2026-10-20-chess-teacher-design.md`
- Plans: `docs/superpowers/plans/2026-10-20-chess-teacher-v6.md`, `docs/superpowers/plans/2026-10-20-chess-teacher-phase2.md` (v8 = Part A; v8.1 = map + rank UI; v8.2 = World 4; v8.3 = Worlds 5–6)

## What's in it (v8.1: game-style map + rank ladder, Worlds 1–3)

- **Home = winding world map (v8.1):** a scrollable road snakes upward through a themed zone per world (Meadow, Mate Castle, Fork Forest, then Pin Peaks / Opening Coast / Endgame Summit). Level bubbles show your stars; a pawn token sits on your current level and hops forward after a clear (no animation with reduced motion). Each world ends in a boss castle that gets a flag and tick when beaten. Locked worlds sit under fog with a lock; Worlds 4–6 say *Coming soon*. The map opens scrolled to your current level. Tap a bubble or castle for a sheet with its name, stars and Play/Replay; tapping something locked explains what to do first. The top bar keeps streak, total stars and the 1500 goal; **Play today's session** floats above the tabs.
- **Rank ladder (v8.1):** the rank badge at the top of Home opens the ladder. One league per world: Wood (W1) → Stone (W2) → Bronze (W3) → Silver (W4) → Gold (W5) → Master (W6, Rapid 1500). It shows your league's shield and star bar, your next match, the promotion match (that world's boss), and every league with ticks, locks and stars. Beating a boss the first time plays a promotion screen with a fanfare. All of this is derived from existing progress (`js/logic/league.js`, `js/logic/map-layout.js`), so nothing new is stored.
- **Worlds:** 6 worlds in GM order. Worlds 1–3 are playable; Worlds 4–6 show as *Coming soon*. Each world opens only once the previous world's boss is passed (no skip-ahead).
- **World 2 Mate in 1 & 2:** Mate in 1 with Queen & Rook → Back-Rank Mate → Mate in 1 with Knight, Bishop & Pawn → Mate in 2. In a mate-in-2 you play your move, the coach plays the opponent's reply on the board, then you finish.
- **World 3 Forks & Double Attacks:** Knight Forks → Queen Forks → Pawn Forks → Double Attacks (incl. discovered attacks). Fork, they reply, you collect.
- **Black to move:** about a third of World 2–3 puzzles are Black to move, and the board flips so Black is at the bottom.
- **Endgame warm-ups:** once World 3 is open, each daily session swaps one slot for a short endgame (opposition, square of the pawn, basic K+Q / K+R mates). Missed ones come back through spaced review; the Review tab shows an *Endgame warm-ups* row.
- **World 1 levels** (5 puzzles each, 3 lives; stars = lives left): Spot the Hanging Piece → Free Lunch → Count Attackers & Defenders → Save Your Piece. 0 lives = soft retry, no progress lost.
- **Boss:** 5 fresh positions (never used in levels), pass with **4 of 5**. Fail → the app names your weakest level; the boss stays locked until you clear that level again. A retry uses different positions.
- **Daily session:** one tap, 10 puzzles: 4 weak spots / 4 current level / 2 spaced review (missed puzzles return after 1, 3, 7, 16, 35 days). The streak goes up once per day when a session is finished.
- World 1 puzzles are all White to move.

## Look and feel (v7)

The dark mobile chess-app style (`#312e2b` family), green buttons with a raised bottom edge, and a green board (`#ebecd0` / `#739552`) are all *inspired by* the style of the Chess.com app. No Chess.com logos, wordmarks, piece art or sounds are used. See **CREDITS.md**.

- **Pieces:** bundled SVG "cburnett" set (GPLv2+, from Lichess), cached by the service worker.
- **Board:** coordinates inside the edge squares, yellow last-move and selected-square highlight, legal-move dots and capture rings. You can drag-and-drop or tap-tap (pointer events, so it works on iOS and Android). Pieces slide; a wrong move shakes the board with a red ✕; a right move gets a green ✓ badge. Illegal moves snap back and cost nothing.
- **Puzzle screen:** top bar (back, title, lives), a coach avatar with a speech bubble, and a bottom bar with **Hint**, **Check**/**Clear**, and **Retry**/**Next** after an answer.
  - **Hint:** highlights the piece to move, or the piece doing the attacking. It costs 1 star on a cleared level (never below 1), and the puzzle goes into your review deck. There are no hints in the boss.
  - **Retry:** a practice go that isn't scored.
- **Tabs:** Home (map), Daily (streak and today's session), Review (puzzles due + accuracy per skill), Profile (stats, sound switch, app version / Check for update).
- **Sounds:** move, capture, correct, wrong and level clear are made live with Web Audio. Audio starts on your first tap (iOS rule). The mute switch is saved with your progress.
- **Motion:** 150–250 ms transitions. All animation is turned off when the phone asks for reduced motion.

## Code layout (no build step, no runtime deps)

```
index.html            shell; loads css/app.css and js/app.js (ES module)
js/app.js             tabs + puzzle flow + DOM events
js/ui/                board (drag/tap controller), board-markup (pure), screens + journey (pure HTML: map, sheet, rank, promotion), icons, sound, update (service worker UX)
js/chess/rules.js     legal moves + hints (uses js/vendor/chess.js, BSD-2)
assets/pieces/        cburnett SVG pieces (GPLv2+) + licence text
js/logic/             pure rules: stars, progress/unlocks, boss, session, review, streak, dates, rng, answer, league (rank ladder), map-layout (map path/nodes)
js/data/              worlds + puzzles-w1/w2/w3/drip, joined in puzzles.js
js/logic/line.js      multi-move (line) puzzle tree follower
js/chess/board.js     FEN parsing
js/storage.js         localStorage (key chess-teacher-v6), never throws
tools/                dev-only puzzle validator (chess.js, Stockfish, Lichess tablebase) — not used by the app
tests/                node --test unit tests
```

## Checks

```bash
npm test            # unit tests (Node 20+, no install needed)
npm run validate    # installs chess.js into tools/ and checks every puzzle
```

The validator works out the correct answer for every puzzle itself and fails if a puzzle's answer key differs:

- World 1: legal position, static-exchange "is it really hanging?", no mate-in-1 allowed, and so on.
- Mates (World 2, warm-ups): exact search. Every accepted move must force mate in N, no shorter mate may exist, and the opponent's reply is the longest defence.
- Forks / double attacks (World 3): Stockfish 19 (npm, depth 16, MultiPV 8) — the key must be clearly best (next move ≥ 2 pawns worse), win ≥ 2 points of material, and actually fork / double-attack (theme detector). Results are cached in `tools/cache/engine.json`.
- Endgame warm-ups: Lichess tablebase API, cached in `tools/cache/tablebase.json` (validation works offline once cached).

Helpers: `node tools/validate-puzzles.mjs --suggest-line "<fen>" mate|engine|tb <n> [win|draw]` prints the tree to paste. `tools/pick-lichess.mjs` filters the Lichess open puzzle database (CC0) for candidate positions (download notes in the file; `tools/data/` is git-ignored).

## Updates (service worker)

`APP_VERSION` in `js/version.js` and `CACHE` in `sw.js` are both `chess-coach-v8.1` and must move together. Progress stays under storage key `chess-teacher-v6`, so v6 progress carries over. Every file under `js/` and `css/`, plus each piece SVG and each PNG in `icons/`, must be listed in `SHELL` in `sw.js` (a test enforces this). The app checks for a new build on open/focus and hourly. **Check for update** on the map, then **Update now** when offered. If it still looks stale, force-close the home-screen app and reopen it.

## Local

Serve the folder (ES modules don't load from `file://`), e.g. `python3 -m http.server 8765`, then open http://localhost:8765/.

## Installing on Android / iPhone

The manifest uses PNG icons (192 and 512, normal plus maskable) and a 180 px apple-touch-icon, which Android needs to build a real installed app. It has its own `id` of `/chess-coach-preview/`.

Other apps on `stewartcampbell88-commits.github.io` share the same origin, and ANVIL uses `id: "/"`. An `id` of `"./"` resolves to that same origin root, so Chrome treated this app as ANVIL ("already installed"). Keep the `id` unique.
