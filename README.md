# Chess - Teacher — phone preview

Game-level ladder for Stewart Campbell (`stewartcamp`) aimed at climbing Chess.com Rapid toward **1500 Elo**, built around real leaks: hanging pieces, Italian / Fried Liver as Black, no stable White system, and clock / abandon habits.

**Live:** https://stewartcampbell88-commits.github.io/chess-coach-preview/

This is a **direction test** — not the full app. No accounts, no APK. Calm sage/coral UI; game-level feel via levels, clears, and hearts — not loud arcade chrome.

## Levels (unlock in order)

1. **Don't Hang Stuff** — hanging = attacked & not safely defended; multi-tap attacks; tap the hang; MCQ
2. **Survive the Italian** — after e5 Nf3 Nc6 Bc4 Nf6 watch Ng5; don't allow Nxf7 disasters
3. **One White System** — **Italian-ish**: `1.e4 2.Nf3 3.Bc4`, castle short, stay consistent (same shapes you face as Black)
4. **Clock Habits** — leave time; resign vs abandon; soft timed hang-glance (~18s)

Clearing a level session unlocks the next. Empty hearts = soft retry on the same level (preview).

## White system choice

Documented choice for Level 3: **Italian-ish** (`e4 + Nf3 + Bc4`), not London. Rationale: Stewart's Black leaks are Italian / Fried Liver (C57); owning the same structure as White reinforces patterns both colours.

## Board

Square board via `aspect-ratio` + CSS grid `minmax(0,1fr)`. Piece size uses `cqmin` on a size container so Unicode pieces no longer stretch row height into rectangles. Stronger cream/sage contrast and piece stroke/shadow.

## Updates (service worker)

Cache / app version: `chess-coach-v4` (keep `CACHE` in `sw.js` and `APP_VERSION` in `index.html` in lockstep).

When shipping a change, bump both to `chess-coach-vN`. The phone PWA checks GitHub Pages on open/focus (and hourly) via `reg.update()`. If a new service worker is waiting, Home shows **Update available** → **Update now**. You can also tap **Check for update** on Home.

If the page still looks stale after a bump:

1. Open the Pages URL (or the home-screen app)
2. Tap **Check for update**, then **Update now** if offered
3. Or force-close the home-screen app and reopen / clear site data

## Stack

Vanilla HTML/CSS/JS PWA. Unicode chess board. GitHub Pages from `main` `/`.

## Local

Open `index.html` in a mobile browser, or serve the folder over HTTPS/localhost so the service worker can register.
