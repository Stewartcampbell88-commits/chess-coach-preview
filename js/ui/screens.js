// Pure screen renderers: state -> HTML string. No DOM access here.
// Copy is trusted constant data (AU English) and is not HTML-escaped.
import { displayStreak } from "../logic/streak.js";
import { dueIds } from "../logic/review.js";
import { BOSS_SIZE } from "../logic/boss.js";
import { ICONS, COACH_AVATAR } from "./icons.js";
export { renderMap, renderNodeSheet, renderRank, renderPromotion, rankChip, shieldSvg } from "./journey.js";

const findLevel = (worlds, levelId) => {
  for (const w of worlds) {
    const l = w.levels.find((x) => x.id === levelId);
    if (l) return { world: w, level: l, index: w.levels.indexOf(l) };
  }
  return null;
};

export function starsHtml(n, max = 3) {
  let out = "";
  for (let i = 1; i <= max; i++) out += `<span class="st ${i <= n ? "on" : ""}">${ICONS.star}</span>`;
  return `<span class="stars-row" aria-label="${starWord(n)}">${out}</span>`;
}
const starWord = (n) => `${n} star${n === 1 ? "" : "s"}`;

// ——— Tabs ———
export const TABS = [
  { id: "home", label: "Home", icon: "home" },
  { id: "daily", label: "Daily", icon: "daily" },
  { id: "review", label: "Review", icon: "review" },
  { id: "profile", label: "Profile", icon: "profile" },
];

export function renderTabBar(active) {
  return `<nav class="tabbar" aria-label="Main">${TABS.map((t) => `
    <button class="tab ${t.id === active ? "on" : ""}" data-action="tab" data-tab="${t.id}"${t.id === active ? ' aria-current="page"' : ""}>
      ${ICONS[t.icon]}<span>${t.label}</span>
    </button>`).join("")}</nav>`;
}

function updateBanner(updateReady) {
  return updateReady
    ? `<div class="update-banner"><span><strong>Update available</strong></span><button class="btn green sm" data-action="apply-update">Update now</button></div>`
    : "";
}

function pageHeader(title, { muted, sub } = {}) {
  return `
    <header class="page-head">
      <div><h1>${title}</h1>${sub ? `<p class="goal-line">${sub}</p>` : ""}</div>
      <button class="icon-btn" data-action="toggle-sound" aria-label="${muted ? "Sound off" : "Sound on"}">${muted ? ICONS.soundOff : ICONS.soundOn}</button>
    </header>`;
}


function updateCard(appVersion, updateChecking, updateReady) {
  return `
    <div class="card update-card">
      <p class="tiny">App version</p>
      <p class="small strong">${appVersion}</p>
      <p class="muted small">Checks for a new build when you open or focus the app.</p>
      <button class="btn grey" data-action="check-update"${updateChecking ? " disabled" : ""}>${updateChecking ? "Checking…" : "Check for update"}</button>
      ${updateReady ? '<button class="btn green" data-action="apply-update">Update now</button>' : ""}
    </div>`;
}

// ——— Daily tab ———
export function renderDaily(progress, { today, updateReady, muted = false }) {
  const n = displayStreak(progress.streak, today);
  const doneToday = progress.streak.lastDate === today;
  return `
    ${pageHeader("Daily", { muted })}
    ${updateBanner(updateReady)}
    <div class="card hero-card">
      <div class="big-flame">${ICONS.daily}</div>
      <p class="hero-num">${n}</p>
      <p class="muted">${n === 1 ? "day" : "days"} in a row</p>
      <p class="small" style="margin-top:0.6rem">${doneToday ? "Today's session is done. See you tomorrow!" : "Play one session today to keep it going."}</p>
    </div>
    <div class="card">
      <p class="tiny">Today's session</p>
      <p class="card-title">10 puzzles · about 5–10 minutes</p>
      <ul class="mix-list">
        <li><span class="pip weak"></span>4 from your weak spots</li>
        <li><span class="pip cur"></span>4 from your current level</li>
        <li><span class="pip rev"></span>2 you missed before</li>
      </ul>
      <button class="btn green big" data-action="play-session">Play today's session</button>
    </div>`;
}

// ——— Review tab ———
export function renderReview(progress, worlds, puzzles, { today, updateReady, muted = false }) {
  const known = new Set(puzzles.filter((p) => p.level || p.drip).map((p) => p.id));
  const due = dueIds(progress.review, today).filter((id) => known.has(id)).length;
  const tracked = Object.keys(progress.review).filter((id) => known.has(id)).length;
  const rows = worlds.flatMap((w) => w.levels).map((l) => {
    const seen = progress.tagSeen[l.tag] || 0;
    const miss = progress.tagMisses[l.tag] || 0;
    const pct = seen ? Math.round(((seen - miss) / seen) * 100) : null;
    return `<li><span>${l.name}</span><span class="bar"><i style="width:${pct ?? 0}%"></i></span><b>${pct === null ? "—" : pct + "%"}</b></li>`;
  }).join("");
  const egSeen = progress.tagSeen["eg-drip"] || 0, egMiss = progress.tagMisses["eg-drip"] || 0;
  const egPct = egSeen ? Math.round(((egSeen - egMiss) / egSeen) * 100) : 0;
  const egRow = egSeen
    ? `<li><span>Endgame warm-ups</span><span class="bar"><i style="width:${egPct}%"></i></span><b>${egPct}%</b></li>`
    : "";
  return `
    ${pageHeader("Review", { muted })}
    ${updateBanner(updateReady)}
    <div class="card hero-card">
      <div class="big-flame rev">${ICONS.review}</div>
      <p class="hero-num">${due}</p>
      <p class="muted">${due === 1 ? "puzzle" : "puzzles"} due for review</p>
      <p class="small muted" style="margin-top:0.4rem">${tracked} in your review deck. Missed puzzles come back after 1, 3, 7, 16 and 35 days.</p>
      <button class="btn green big" data-action="play-session">Review now</button>
    </div>
    <div class="card">
      <p class="tiny">Accuracy by skill</p>
      <ul class="skill-list">${rows}${egRow}</ul>
    </div>`;
}

// ——— Profile tab ———
export function renderProfile(progress, worlds, { today, updateReady, updateChecking, appVersion, muted = false }) {
  const levels = worlds.flatMap((w) => w.levels);
  const stars = levels.reduce((s, l) => s + (progress.levels[l.id]?.stars || 0), 0);
  const cleared = levels.filter((l) => progress.levels[l.id]?.cleared).length;
  const solved = Object.values(progress.tagSeen).reduce((a, b) => a + b, 0)
    - Object.values(progress.tagMisses).reduce((a, b) => a + b, 0);
  const bosses = worlds.filter((w) => w.boss && progress.bosses[w.boss.id]?.passed).length;
  return `
    ${pageHeader("Profile", { muted })}
    ${updateBanner(updateReady)}
    <div class="card profile-card">
      <div class="avatar-lg">${COACH_AVATAR}</div>
      <div><p class="card-title">stewartcamp</p><p class="muted small">Goal: 1500 Rapid</p></div>
    </div>
    <div class="stat-grid">
      <div class="stat"><b>${displayStreak(progress.streak, today)}</b><span>Day streak</span></div>
      <div class="stat"><b>${stars}/${levels.length * 3}</b><span>Stars</span></div>
      <div class="stat"><b>${cleared}/${levels.length}</b><span>Levels</span></div>
      <div class="stat"><b>${bosses}</b><span>Bosses beaten</span></div>
      <div class="stat wide"><b>${Math.max(0, solved)}</b><span>Puzzles solved</span></div>
    </div>
    <div class="card row-card">
      <span>${muted ? ICONS.soundOff : ICONS.soundOn} Sound</span>
      <button class="switch ${muted ? "" : "on"}" data-action="toggle-sound" role="switch" aria-checked="${!muted}" aria-label="Sound"><i></i></button>
    </div>
    ${updateCard(appVersion, updateChecking, updateReady)}`;
}

// ——— Puzzle screen ———
export function renderTopBar({ title, lives, index, total }) {
  const pct = total ? Math.round((index / total) * 100) : 0;
  const right = lives === null || lives === undefined
    ? `<span class="count">${Math.min(index + 1, total)}/${total}</span>`
    : `<span class="lives" aria-label="${lives} lives left">${[0, 1, 2].map((i) => `<span class="${i < lives ? "on" : ""}">${ICONS.heart}</span>`).join("")}</span>`;
  return `
    <div class="topbar">
      <button class="icon-btn" data-action="home" aria-label="Back to map">${ICONS.back}</button>
      <p class="topbar-title">${title}</p>
      ${right}
    </div>
    <div class="progress" aria-hidden="true"><i style="width:${pct}%"></i></div>`;
}

export function renderCoach({ text, mood = "neutral" }) {
  return `
    <div class="coach mood-${mood}">
      ${COACH_AVATAR}
      <div class="bubble"><p>${text}</p></div>
    </div>`;
}

/**
 * phase: solving | correct | wrong | retrying
 * kind: tap-hanging | take-free | save-piece
 */
export function renderActionBar({ phase, kind, canHint = true, hintUsed = false, picked = 0, last = false }) {
  const isTap = kind === "tap-hanging";
  if (phase === "correct") {
    return `
      <div class="fb good">
        <div class="fb-head">${ICONS.check}<b>Correct!</b></div>
        <button class="btn green" data-action="next">${last ? "Finish" : "Next"} ${ICONS.next}</button>
      </div>`;
  }
  if (phase === "wrong") {
    return `
      <div class="fb bad">
        <div class="fb-head">${ICONS.close}<b>Incorrect</b></div>
        <div class="btn-row">
          <button class="btn grey" data-action="retry">${ICONS.retry} Retry</button>
          <button class="btn green" data-action="next">${last ? "Finish" : "Next"} ${ICONS.next}</button>
        </div>
      </div>`;
  }
  const hint = canHint
    ? `<button class="act" data-action="hint"${hintUsed ? " disabled" : ""}>${ICONS.hint}<span>${hintUsed ? "Hint used" : "Hint"}</span></button>`
    : '<span class="act ghost"></span>';
  const middle = isTap
    ? `<button class="btn green" data-action="submit-taps"${picked ? "" : " disabled"}>Check</button>`
    : `<p class="move-hint">${phase === "retrying" ? "Practice go — not scored." : "Drag or tap a piece to move."}</p>`;
  const right = isTap
    ? `<button class="act" data-action="clear-taps"${picked ? "" : " disabled"}>${ICONS.retry}<span>Clear</span></button>`
    : phase === "retrying"
      ? `<button class="act" data-action="next">${ICONS.next}<span>Skip</span></button>`
      : '<span class="act ghost"></span>';
  return `<div class="actionbar">${hint}${middle}${right}</div>`;
}

export function renderPuzzleShell({ title, lives, index, total, coach, actions }) {
  return `
    <div class="puzzle-screen">
      <div id="topbar">${renderTopBar({ title, lives, index, total })}</div>
      <div id="coach">${renderCoach(coach)}</div>
      <div id="board-host" class="board-host"></div>
      <div id="panel">${renderActionBar(actions)}</div>
    </div>`;
}

// ——— Results ———
export function renderLevelResult({ levelName, stars, livesLeft, nextLevelName, bossUnlocked, hintsUsed = 0, worldId = 1 }) {
  if (!stars) {
    return `
      <div class="result">
        ${renderCoach({ text: "Out of lives — have another go. No progress lost. Take it slow: what's attacked, what's defended?", mood: "bad" })}
        <div class="card result-card fail">
          <p class="tiny">${levelName}</p>
          <h1>Out of lives — have another go.</h1>
        </div>
        <div class="spacer"></div>
        <button class="btn green big" data-action="retry-level">${ICONS.retry} Try again</button>
        <button class="btn ghost" data-action="home">Back to map</button>
      </div>`;
  }
  const next = bossUnlocked
    ? '<p class="muted unlock">Boss unlocked!</p>'
    : nextLevelName ? `<p class="muted unlock">Unlocked: <strong>${nextLevelName}</strong></p>` : "";
  const cta = bossUnlocked
    ? `<button class="btn gold big" data-action="play-boss" data-world="${worldId}">${ICONS.crown} Fight the boss</button>`
    : nextLevelName ? `<button class="btn green big" data-action="play-next">Next level ${ICONS.next}</button>` : "";
  return `
    <div class="result">
      <div class="card result-card clear">
        <p class="tiny">Level clear</p>
        <div class="big-stars">${starsHtml(stars)}</div>
        <h1>${levelName}</h1>
        <p class="muted small">${starWord(stars)} · ${livesLeft} ${livesLeft === 1 ? "life" : "lives"} left${hintsUsed ? " · hint used (−1 star)" : ""}</p>
        ${next}
      </div>
      <div class="spacer"></div>
      ${cta}
      <button class="btn ${cta ? "ghost" : "green big"}" data-action="home">Back to map</button>
    </div>`;
}

export function renderBossResult(grade, worlds, worldId = 1) {
  if (grade.passed) {
    return `
      <div class="result">
        <div class="card result-card clear">
          <div class="crown-badge">${ICONS.crown}</div>
          <p class="tiny">Boss beaten</p>
          <h1>World ${worldId} complete!</h1>
          <p class="result-score">${grade.score} / ${BOSS_SIZE}</p>
          <p class="muted">You passed ${grade.score} of ${BOSS_SIZE}.</p>
        </div>
        <div class="spacer"></div>
        <button class="btn green big" data-action="home">Back to map</button>
      </div>`;
  }
  const weak = findLevel(worlds, grade.weakLevelId);
  const name = weak ? weak.level.name : "your weakest level";
  return `
    <div class="result">
      ${renderCoach({ text: `Your weak spot: ${name}. Clear that level again, then the boss reopens.`, mood: "bad" })}
      <div class="card result-card fail">
        <p class="tiny">Boss</p>
        <h1>Not yet — ${grade.score} of ${BOSS_SIZE}.</h1>
        <p class="coach-line">Your weak spot: ${name}.</p>
      </div>
      <div class="spacer"></div>
      ${weak ? `<button class="btn green big" data-action="play-level" data-level="${weak.level.id}">Practise ${name}</button>` : ""}
      <button class="btn ghost" data-action="home">Back to map</button>
    </div>`;
}

export function renderSessionEnd({ correct, total, streak }) {
  return `
    <div class="result">
      <div class="card result-card clear">
        <div class="crown-badge flame">${ICONS.daily}</div>
        <p class="tiny">Today</p>
        <h1>Session done</h1>
        <p class="result-score">${correct} / ${total}</p>
        <p class="muted">${correct} of ${total} correct</p>
        <p class="streak-line">🔥 ${streak} day streak</p>
      </div>
      <div class="spacer"></div>
      <button class="btn green big" data-action="home">Back to map</button>
    </div>`;
}
