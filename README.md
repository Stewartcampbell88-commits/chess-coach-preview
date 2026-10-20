# Chess - Teacher — phone preview (v6)

A 5–10 minute daily chess game for Stewart Campbell (`stewartcamp`) aimed at climbing Chess.com Rapid toward **1500**. It teaches the way a grandmaster would relearn: lots of short, real-position puzzles, tactics before openings, and a boss at the end of each world that checks you've actually learned it.

**Live:** https://stewartcampbell88-commits.github.io/chess-coach-preview/

- Spec: `docs/superpowers/specs/2026-10-20-chess-teacher-design.md`
- Plan: `docs/superpowers/plans/2026-10-20-chess-teacher-v6.md`

## What's in v6 (Phase 1 preview)

- **Map:** 6 worlds in GM order. World 1 **Don't Hang Pieces** is playable. Worlds 2–6 show as *Coming soon*.
- **World 1 levels** (5 puzzles each, 3 lives; stars = lives left): Spot the Hanging Piece → Free Lunch → Count Attackers & Defenders → Save Your Piece. 0 lives = soft retry, no progress lost.
- **Boss:** 5 fresh positions (never used in levels), pass with **4 of 5**. Fail → the app names your weakest level; the boss stays locked until you clear that level again. A retry uses different positions.
- **Daily session:** one tap, 10 puzzles: 4 weak spots / 4 current level / 2 spaced review (missed puzzles return after 1, 3, 7, 16, 35 days). The streak goes up once per day when a session is finished.
- Phase 1 puzzles are all White to move, board from White's side.

## Look

Dark Chess.com-inspired chrome (`#262421` / `#302e2c`), green CTA (`#81b64c`), classic green board (`#eeeed2` / `#769656`). No Chess.com logos or wordmarks.

## Code layout (no build step, no runtime deps)

```
index.html            shell; loads css/app.css and js/app.js (ES module)
js/app.js             screen state machine + DOM events
js/ui/                board-view, screens (pure HTML renderers), update (service worker UX)
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

`APP_VERSION` in `js/version.js` and `CACHE` in `sw.js` are both `chess-coach-v6` and must move together. Every file under `js/` and `css/` must be listed in `SHELL` in `sw.js` (a test enforces this). The app checks for a new build on open/focus and hourly. **Check for update** on the map, then **Update now** when offered. If it still looks stale, force-close the home-screen app and reopen it.

## Local

Serve the folder (ES modules don't load from `file://`), e.g. `python3 -m http.server 8765`, then open http://localhost:8765/.
