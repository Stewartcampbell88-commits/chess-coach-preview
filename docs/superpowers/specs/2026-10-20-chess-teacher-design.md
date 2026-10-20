# Chess - Teacher — Design Spec (2026-10-20)

## Purpose
A fun, game-like phone app that raises Stewart's Chess.com **Rapid** rating (stewartcamp, ~651, peak ~1061; target 1500+) through a **5–10 minute daily habit**, taught the way a grandmaster would relearn chess: many short real-position puzzles at the edge of ability, own-mistake review, tactics before openings.

## Success criteria
- Stewart plays most days (streak) in 5–10 minute sessions.
- Each world ends with a passed mastery boss before the next unlocks.
- Rapid rating trends upward; fewer hung pieces / one-move blunders in his Chess.com games.

## Look
Chess.com-style dark theme (as v5): bg `#262421`/`#302e2c`, green CTA `#81b64c`, board `#eeeed2`/`#769656`. No Chess.com logos or wordmarks. Name: **Chess - Teacher**.

## Structure: Level map
- Vertical map of **Worlds**, each with several short **Levels**, then a **Boss**.
- Level = ~5 puzzles, 3 lives. Stars: 3 lives left = 3★, 2 = 2★, 1 = 1★. 0 lives = retry (soft).
- Sequential unlock: levels in order; boss unlocks after all levels in the world are cleared.
- Home: "Play today's session" button (one tap) + streak count + map.

## World order (GM-priority)
1. **Don't Hang Pieces** — blunder-check habit, counting attackers vs defenders.
2. **Mate in 1 & 2** — checks, back-rank mates.
3. **Forks & Double Attacks**
4. **Pins & Skewers**
5. **Survive the Opening** — one White system (Italian-ish e4/Nf3/Bc4), replies to e4 and d4, Fried Liver defence.
6. **Simple Endgames** — king + pawn, basic mates, converting a win.

Endgame positions are mixed into reviews from World 3 onward.

## Boss = mastery check
- Purpose: confirm Stewart has actually learned that world's skill.
- Mixed test of fresh positions for that world's theme, including positions from his own Chess.com games where he made that mistake (when available).
- Pass mark: **4 of 5** correct. Pass → next world unlocks.
- Fail → app routes him back to the specific levels/tags he struggled on, then the boss can be retried.

## Daily session (5–10 min)
- One tap. Mix: ~40% weak-spot (struggle-weighted) items, ~40% current level, ~20% spaced review of earlier worlds.
- Missed puzzles return later (spaced repetition). Streak increments on completing a session.

## Data
- Chess.com public API (username `stewartcamp`) for recent games → blunder positions tagged by theme (feeds bosses and weak-spot review). Puzzles stored locally; progress in localStorage.

## Platform
- PWA on GitHub Pages (`Stewartcampbell88-commits/chess-coach-preview`), service-worker update banner (Check for update / Update now). No APK until Stewart OKs.
- Preview-before-build: thin preview first, Stewart tests, then deeper build.

## Out of scope (for now)
Playing full games vs a bot, timed rush mode, online/multiplayer, deep opening theory.
