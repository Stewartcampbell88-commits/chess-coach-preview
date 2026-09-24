# Clean Coach — phone preview

Thin Foundation loop for Stewart Campbell’s chess learning app.

**Live:** https://stewartcampbell88-commits.github.io/chess-coach-preview/

This is a **direction test** — not the full app. No accounts, no APK, no arcade chrome. Feel Home → Teach → Drill → hearts feedback → session end on your phone.

## Force-refresh (service worker)

Cache name: `chess-coach-v1`. If the page looks stale after an update:

1. Open the Pages URL
2. Hard refresh (iOS Safari: close tab, clear site data, reopen; Android Chrome: DevTools → Application → Clear storage, or swipe away PWA and reopen)
3. Or visit once with DevTools open and “Update on reload” checked

## Stack

Vanilla HTML/CSS/JS PWA. Unicode chess board. GitHub Pages from `main` `/`.

## Local

Open `index.html` in a mobile browser, or serve the folder over HTTPS/localhost so the service worker can register.
