// Inline SVG icons (drawn for this app; no third-party art). currentColor-based.
const svg = (body, vb = "0 0 24 24") =>
  `<svg class="ic" viewBox="${vb}" aria-hidden="true" focusable="false">${body}</svg>`;

export const ICONS = {
  home: svg('<path d="M3 11.2 12 4l9 7.2V20a1 1 0 0 1-1 1h-5.5v-6h-5v6H4a1 1 0 0 1-1-1z" fill="currentColor"/>'),
  daily: svg('<path d="M12 2c1.2 3.1 4.9 5 4.9 9.6A4.9 4.9 0 0 1 12 16.5a4.9 4.9 0 0 1-4.9-4.9c0-2 1-3.3 2-4.4.2 1.6 1 2.6 2.1 2.9C10.6 7.6 11 4.6 12 2z" fill="currentColor"/><path d="M5 18.5h14v2.5H5z" fill="currentColor" opacity=".6"/>'),
  review: svg('<path d="M12 4a8 8 0 1 1-7.4 5H2l3.6-4.2L9.2 9H6.8A6 6 0 1 0 12 6z" fill="currentColor"/><path d="M11 8h2v4.4l3 1.8-1 1.7-4-2.4z" fill="currentColor"/>'),
  profile: svg('<circle cx="12" cy="8" r="4.2" fill="currentColor"/><path d="M3.5 20.5c.8-4.3 4.2-6.5 8.5-6.5s7.7 2.2 8.5 6.5z" fill="currentColor"/>'),
  back: svg('<path d="M15.5 4.5 8 12l7.5 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>'),
  hint: svg('<path d="M12 2.5a6.5 6.5 0 0 0-3.8 11.8c.6.5.8 1.1.8 1.8V17h6v-.9c0-.7.3-1.3.8-1.8A6.5 6.5 0 0 0 12 2.5z" fill="currentColor"/><path d="M9.5 18.5h5v1.3a1.7 1.7 0 0 1-1.7 1.7h-1.6a1.7 1.7 0 0 1-1.7-1.7z" fill="currentColor"/>'),
  retry: svg('<path d="M12 5V2L7.5 6 12 10V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z" fill="currentColor"/>'),
  next: svg('<path d="M5 12h12M12 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>'),
  soundOn: svg('<path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'),
  soundOff: svg('<path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="m16.5 9.5 5 5m0-5-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'),
  lock: svg('<rect x="5" y="10.5" width="14" height="10" rx="2" fill="currentColor"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="currentColor" stroke-width="2.2"/>'),
  star: svg('<path d="m12 2.8 2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z" fill="currentColor"/>'),
  crown: svg('<path d="M3 8l4.5 3.5L12 5l4.5 6.5L21 8l-2 11H5z" fill="currentColor"/>'),
  check: svg('<path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'),
  close: svg('<path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/>'),
  heart: svg('<path d="M12 20.5 4.2 13A4.9 4.9 0 0 1 12 6.6 4.9 4.9 0 0 1 19.8 13z" fill="currentColor"/>'),
  play: svg('<path d="M8 5v14l11-7z" fill="currentColor"/>'),
  target: svg('<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="12" cy="12" r="4" fill="currentColor"/>'),
};

/** Friendly coach avatar: a round-headed pawn with glasses (original drawing). */
export const COACH_AVATAR = `<svg class="coach-avatar" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
  <circle cx="32" cy="32" r="31" fill="#81b64c"/>
  <path d="M18 54c1.5-8 6-12.5 14-12.5S44.5 46 46 54z" fill="#f4f1e8"/>
  <rect x="23" y="38" width="18" height="5" rx="2.5" fill="#e3dfd2"/>
  <circle cx="32" cy="25" r="13" fill="#f4f1e8"/>
  <circle cx="26.5" cy="24" r="4.2" fill="none" stroke="#2b2925" stroke-width="2"/>
  <circle cx="37.5" cy="24" r="4.2" fill="none" stroke="#2b2925" stroke-width="2"/>
  <path d="M30.7 24h2.6" stroke="#2b2925" stroke-width="2"/>
  <circle cx="26.5" cy="24.4" r="1.5" fill="#2b2925"/><circle cx="37.5" cy="24.4" r="1.5" fill="#2b2925"/>
  <path d="M27.5 30.5c2.6 2.4 6.4 2.4 9 0" fill="none" stroke="#2b2925" stroke-width="2" stroke-linecap="round"/>
  <path d="M19.5 18.5c3-6 9-8.5 15-7.5 4 .7 7.5 3 9.5 7-6-2.5-16.5-3-24.5.5z" fill="#4b6f2c"/>
</svg>`;
