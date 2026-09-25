# Clean Coach — phone preview

Thin Foundation loop for Stewart Campbell’s chess learning app.

**Live:** https://stewartcampbell88-commits.github.io/chess-coach-preview/

This is a **direction test** — not the full app. No accounts, no APK, no arcade chrome. Feel Home → Teach → Drill → hearts feedback → session end on your phone.

## Updates (service worker)

Cache / app version: `chess-coach-v2` (keep `CACHE` in `sw.js` and `APP_VERSION` in `index.html` in lockstep).

When shipping a change, bump both to `chess-coach-vN`. The phone PWA checks GitHub Pages on open/focus (and hourly) via `reg.update()`. If a new service worker is waiting, Home shows **Update available** → **Update now**. You can also tap **Check for update** on Home.

If the page still looks stale after a bump:

1. Open the Pages URL (or the home-screen app)
2. Tap **Check for update**, then **Update now** if offered
3. Or hard-refresh / clear site data and reopen

## Stack

Vanilla HTML/CSS/JS PWA. Unicode chess board. GitHub Pages from `main` `/`.

## Local

Open `index.html` in a mobile browser, or serve the folder over HTTPS/localhost so the service worker can register.
