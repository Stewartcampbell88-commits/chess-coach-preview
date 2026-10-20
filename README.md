# Chess - Teacher — phone preview (v7)

A 5–10 minute daily chess game for Stewart Campbell (`stewartcamp`) aimed at climbing Chess.com Rapid toward **1500**. It teaches the way a grandmaster would relearn: lots of short, real-position puzzles, tactics before openings, and a boss at the end of each world that checks you've actually learned it.

**Live:** https://stewartcampbell88-commits.github.io/chess-coach-preview/

- Spec: `docs/superpowers/specs/2026-10-20-chess-teacher-design.md`
- Plan: `docs/superpowers/plans/2026-10-20-chess-teacher-v6.md`

## What's in it (Phase 1 content, v7 look)

- **Map:** 6 worlds in GM order. World 1 **Don't Hang Pieces** is playable. Worlds 2–6 show as *Coming soon*.
- **World 1 levels** (5 puzzles each, 3 lives; stars = lives left): Spot the Hanging Piece → Free Lunch → Count Attackers & Defenders → Save Your Piece. 0 lives = soft retry, no progress lost.
- **Boss:** 5 fresh positions (never used in levels), pass with **4 of 5**. Fail → the app names your weakest level; the boss stays locked until you clear that level again. A retry uses different positions.
- **Daily session:** one tap, 10 puzzles: 4 weak spots / 4 current level / 2 spaced review (missed puzzles return after 1, 3, 7, 16, 35 days). The streak goes up once per day when a session is finished.
- Phase 1 puzzles are all White to move, board from White's side.

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
js/ui/                board (drag/tap controller), board-markup (pure), screens (pure HTML), icons, sound, update (service worker UX)
js/chess/rules.js     legal moves + hints (uses js/vendor/chess.js, BSD-2)
assets/pieces/        cburnett SVG pieces (GPLv2+) + licence text
js/logic/             pure rules: stars, progress/unlocks, boss, session, review, streak, dates, rng, answer
js/data/              worlds + World 1 puzzles
js/chess/board.js     FEN parsing
js/storage.js         localStorage (key chess-teacher-v6), never throws
tools/                dev-only puzzle validator (chess.js) — not used by the app
tests/                node --test unit tests
```

## Checks

```bash
npm test            # unit tests (Node 20+, no install needed)
npm run validate    # installs chess.js into tools/ and checks every puzzle
```

The validator works out the correct answer for every puzzle itself (legal position, static-exchange "is it really hanging?", no mate-in-1 allowed, and so on) and fails if a puzzle's answer key differs.

## Updates (service worker)

`APP_VERSION` in `js/version.js` and `CACHE` in `sw.js` are both `chess-coach-v7.1` and must move together. Progress stays under storage key `chess-teacher-v6`, so v6 progress carries over. Every file under `js/` and `css/`, plus each piece SVG and each PNG in `icons/`, must be listed in `SHELL` in `sw.js` (a test enforces this). The app checks for a new build on open/focus and hourly. **Check for update** on the map, then **Update now** when offered. If it still looks stale, force-close the home-screen app and reopen it.

## Local

Serve the folder (ES modules don't load from `file://`), e.g. `python3 -m http.server 8765`, then open http://localhost:8765/.

## Installing on Android / iPhone

The manifest uses PNG icons (192 and 512, normal plus maskable) and a 180 px apple-touch-icon, which Android needs to build a real installed app. It has its own `id` of `/chess-coach-preview/`.

Other apps on `stewartcampbell88-commits.github.io` share the same origin, and ANVIL uses `id: "/"`. An `id` of `"./"` resolves to that same origin root, so Chrome treated this app as ANVIL ("already installed"). Keep the `id` unique.
