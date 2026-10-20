const CACHE = "chess-coach-v6";
const SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./favicon.svg",
  "./css/app.css",
  "./js/app.js",
  "./js/chess/board.js",
  "./js/data/puzzles-w1.js",
  "./js/data/worlds.js",
  "./js/logic/answer.js",
  "./js/logic/boss.js",
  "./js/logic/dates.js",
  "./js/logic/progress.js",
  "./js/logic/review.js",
  "./js/logic/rng.js",
  "./js/logic/session.js",
  "./js/logic/stars.js",
  "./js/logic/streak.js",
  "./js/storage.js",
  "./js/ui/board-view.js",
  "./js/ui/screens.js",
  "./js/ui/update.js",
  "./js/version.js",
];
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL))
  );
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(event.request, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(event.request).then((hit) => hit || caches.match("./index.html"))
      )
  );
});
