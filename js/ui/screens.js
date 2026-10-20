// Pure screen renderers: state -> HTML string. No DOM access here.
// Copy is trusted constant data (AU English) and is not HTML-escaped.
import { renderBoard } from "./board-view.js";
import { levelStatus, bossStatus, worldStatus } from "../logic/progress.js";
import { displayStreak } from "../logic/streak.js";
import { BOSS_SIZE } from "../logic/boss.js";

const findLevel = (worlds, levelId) => {
  for (const w of worlds) {
    const l = w.levels.find((x) => x.id === levelId);
    if (l) return { world: w, level: l, index: w.levels.indexOf(l) };
  }
  return null;
};

export function starsHtml(n, max = 3) {
  let out = "";
  for (let i = 1; i <= max; i++) out += i <= n ? "★" : '<span class="empty-star">★</span>';
  return out;
}

const starWord = (n) => `${n} star${n === 1 ? "" : "s"}`;

function levelNode(progress, worlds, world, level, index) {
  const status = levelStatus(progress, worlds, level.id);
  const best = progress.levels[level.id]?.stars || 0;
  const cls = status === "locked" ? "locked" : status === "cleared" ? "done" : "current";
  const circle = status === "locked" ? "🔒" : status === "cleared" ? "✓" : String(index + 1);
  const stars = status === "cleared"
    ? `<div class="node-stars" aria-label="${starWord(best)}">${starsHtml(best)}</div>`
    : '<div class="node-stars" aria-hidden="true"></div>';
  const action = status === "locked"
    ? '<div class="lock-badge"><span>🔒</span> Locked</div>'
    : status === "cleared"
      ? `<button class="cta play-node secondary" data-action="play-level" data-level="${level.id}">Replay</button>`
      : `<button class="cta play-node" data-action="play-level" data-level="${level.id}">Play</button>`;
  return `
    <div class="path-node ${cls}">
      <div class="node-circle-wrap"><div class="node-circle" aria-hidden="true">${circle}</div>${stars}</div>
      <div class="node-body">
        <p class="node-title">Level ${index + 1} · ${level.name}</p>
        <p class="node-blurb">5 puzzles · 3 lives</p>
        <div class="node-actions">${action}</div>
      </div>
    </div>`;
}

function bossNode(progress, worlds, world) {
  const status = bossStatus(progress, worlds, world.id);
  const cls = status === "locked" ? "locked" : status === "passed" ? "done" : "current";
  const circle = status === "locked" ? "🔒" : status === "passed" ? "👑" : "♛";
  let action;
  if (status === "locked") action = '<div class="lock-badge"><span>🔒</span> Clear every level to unlock</div>';
  else if (status === "gated") {
    const gate = findLevel(worlds, progress.bossGate[world.boss.id]);
    action = `<p class="gate-note">Practise ${gate ? gate.level.name : "your weak level"} first, then have another go.</p>`;
  } else if (status === "passed") action = '<button class="cta play-node secondary" data-action="play-boss">Replay boss</button>';
  else action = '<button class="cta play-node" data-action="play-boss">Fight the boss</button>';
  return `
    <div class="path-node boss ${cls}">
      <div class="node-circle-wrap"><div class="node-circle" aria-hidden="true">${circle}</div><div class="node-stars"></div></div>
      <div class="node-body">
        <p class="node-title">${world.boss.name}</p>
        <p class="node-blurb">Pass 4 of 5 to clear the world</p>
        <div class="node-actions">${action}</div>
      </div>
    </div>`;
}

function worldSection(progress, worlds, world) {
  const status = worldStatus(progress, worlds, world.id);
  if (status === "coming-soon" || status === "locked") {
    return `
      <section class="world soon">
        <div class="world-head">
          <div class="world-badge">🔒</div>
          <div><p class="world-name">World ${world.id} · ${world.name}</p><p class="world-blurb">${world.blurb}</p></div>
          <span class="soon-tag">${status === "coming-soon" ? "Coming soon" : "Locked"}</span>
        </div>
      </section>`;
  }
  const nodes = world.levels.map((l, i) => levelNode(progress, worlds, world, l, i)).join("");
  const cleared = world.levels.filter((l) => progress.levels[l.id]?.cleared).length;
  const total = world.levels.length + (world.boss ? 1 : 0);
  const done = cleared + (status === "passed" ? 1 : 0);
  return `
    <section class="world ${status}">
      <div class="world-head">
        <div class="world-badge">${world.id}</div>
        <div><p class="world-name">World ${world.id} · ${world.name}</p><p class="world-blurb">${world.blurb}</p></div>
      </div>
      <div class="path">
        <div class="path-spine" aria-hidden="true"><i style="height:${Math.round((done / total) * 100)}%"></i></div>
        ${nodes}
        ${world.boss ? bossNode(progress, worlds, world) : ""}
      </div>
    </section>`;
}

export function renderMap(progress, worlds, { today, updateReady, updateChecking, appVersion }) {
  const streak = displayStreak(progress.streak, today);
  const doneToday = progress.streak.lastDate === today;
  const updateBanner = updateReady
    ? '<div class="update-banner"><span><strong>Update available</strong></span><button class="cta" data-action="apply-update">Update now</button></div>'
    : "";
  return `
    <div class="home-hero">
      <h1>Chess - Teacher</h1>
      <p class="goal-line">Climb toward 1500 Rapid</p>
    </div>
    ${updateBanner}
    <div class="daily-card">
      <div class="daily-top">
        <span class="streak ${streak ? "" : "cold"}">🔥 ${streak} day streak</span>
        ${doneToday ? '<span class="done-today">Done today ✓</span>' : '<span class="muted small">5–10 min</span>'}
      </div>
      <button class="cta big" data-action="play-session">Play today's session</button>
    </div>
    ${worlds.map((w) => worldSection(progress, worlds, w)).join("")}
    <div class="card update-card" style="margin-top:1.5rem">
      <p class="tiny">App version</p>
      <p class="small" style="margin-top:0.35rem;font-weight:700">${appVersion}</p>
      <p class="muted small" style="margin-top:0.35rem">Checks for a new build when you open or focus the app.</p>
      <button class="cta secondary" data-action="check-update"${updateChecking ? " disabled" : ""}>${updateChecking ? "Checking…" : "Check for update"}</button>
      ${updateReady ? '<button class="cta" data-action="apply-update">Update now</button>' : ""}
    </div>
    <p class="foot-note">Chess - Teacher · preview</p>`;
}

function chrome(title, lives, index, total) {
  const pct = total ? Math.round((index / total) * 100) : 0;
  const hearts = lives === null || lives === undefined
    ? `<div class="chrome-label">${index + 1} / ${total}</div>`
    : `<div class="hearts" aria-label="${lives} lives left">${[0, 1, 2]
      .map((i) => `<span class="${i < lives ? "" : "empty"}">${i < lives ? "♥" : "♡"}</span>`).join("")}</div>`;
  return `
    <div class="chrome">
      <div class="chrome-left">
        <button class="quit" data-action="home" aria-label="Back to map">✕</button>
        <div class="chrome-meta">
          <div class="chrome-label">${title}</div>
          <div class="mastery" aria-hidden="true"><i style="width:${pct}%"></i></div>
        </div>
      </div>
      ${hearts}
    </div>`;
}

export function renderPuzzle({ title, puzzle, board, lives, index, total, selected, picked }) {
  const isTap = puzzle.kind === "tap-hanging";
  const controls = isTap
    ? `<div class="btn-row">
         <button class="cta secondary" data-action="clear-taps"${picked.length ? "" : " disabled"}>Clear</button>
         <button class="cta" data-action="submit-taps"${picked.length ? "" : " disabled"}>Check</button>
       </div>`
    : '<p class="move-hint">Tap your piece, then the square it goes to.</p>';
  return `
    ${chrome(title, lives, index, total)}
    <div class="puzzle" data-puzzle="${puzzle.id}">
      <p class="prompt">${puzzle.prompt}</p>
      ${renderBoard(board, { selected, picked, interactive: true })}
      ${controls}
    </div>`;
}

export function renderFeedback({ title, correct, explain, lives, index, total, board, highlight, answer, last }) {
  return `
    ${chrome(title, lives, index + 1, total)}
    ${renderBoard(board, { highlight: highlight || [], answer: answer || [] })}
    <div class="card ${correct ? "ok" : "warn"}" style="margin-top:0.75rem">
      <p class="tiny">${correct ? "That's it" : "Not quite"}</p>
      <p class="coach">${explain}</p>
    </div>
    <div class="spacer"></div>
    <button class="cta" data-action="next">${last ? "Finish" : "Next"}</button>`;
}

export function renderLevelResult({ levelName, stars, livesLeft, nextLevelName, bossUnlocked }) {
  if (!stars) {
    return `
      <div class="card fail" style="margin-top:1.5rem;text-align:center">
        <p class="tiny">${levelName}</p>
        <h1 style="margin-top:0.5rem">Out of lives — have another go.</h1>
        <p class="muted small" style="margin-top:0.5rem">No progress lost. Take it slow: what's attacked, what's defended?</p>
      </div>
      <div class="spacer"></div>
      <button class="cta" data-action="retry-level">Try again</button>
      <button class="cta ghost" data-action="home">Back to map</button>`;
  }
  const next = bossUnlocked
    ? '<p class="muted" style="margin-top:0.65rem">Boss unlocked!</p>'
    : nextLevelName ? `<p class="muted" style="margin-top:0.65rem">Unlocked: <strong>${nextLevelName}</strong></p>` : "";
  const cta = bossUnlocked
    ? '<button class="cta" data-action="play-boss">Fight the boss</button>'
    : nextLevelName ? '<button class="cta" data-action="play-next">Next level</button>' : "";
  return `
    <div class="card clear" style="margin-top:1.5rem">
      <div class="clear-check" aria-hidden="true">✓</div>
      <p class="tiny">Level clear</p>
      <div class="stars" aria-label="${starWord(stars)}">${starsHtml(stars)}</div>
      <h1>${levelName}</h1>
      <p class="muted small" style="margin-top:0.35rem">${starWord(stars)} · ${livesLeft} ${livesLeft === 1 ? "life" : "lives"} left</p>
      ${next}
    </div>
    <div class="spacer"></div>
    ${cta}
    <button class="cta ${cta ? "ghost" : ""}" data-action="home">Back to map</button>`;
}

export function renderBossResult(grade, worlds, worldId = 1) {
  if (grade.passed) {
    return `
      <div class="card clear" style="margin-top:1.5rem">
        <div class="boss-crown" aria-hidden="true">👑</div>
        <p class="tiny">Boss beaten</p>
        <h1>World ${worldId} complete!</h1>
        <p class="result-score">${grade.score} / ${BOSS_SIZE}</p>
        <p class="muted">You passed ${grade.score} of ${BOSS_SIZE}.</p>
      </div>
      <div class="spacer"></div>
      <button class="cta" data-action="home">Back to map</button>`;
  }
  const weak = findLevel(worlds, grade.weakLevelId);
  const name = weak ? weak.level.name : "your weakest level";
  return `
    <div class="card fail" style="margin-top:1.5rem;text-align:center">
      <p class="tiny">Boss</p>
      <h1 style="margin-top:0.4rem">Not yet — ${grade.score} of ${BOSS_SIZE}.</h1>
      <p class="coach" style="margin-top:0.5rem">Your weak spot: ${name}.</p>
      <p class="muted small" style="margin-top:0.5rem">Clear that level again, then the boss reopens.</p>
    </div>
    <div class="spacer"></div>
    ${weak ? `<button class="cta" data-action="play-level" data-level="${weak.level.id}">Practise ${name}</button>` : ""}
    <button class="cta ghost" data-action="home">Back to map</button>`;
}

export function renderSessionEnd({ correct, total, streak }) {
  return `
    <div class="card clear" style="margin-top:1.5rem">
      <div class="clear-check" aria-hidden="true">✓</div>
      <p class="tiny">Today</p>
      <h1>Session done</h1>
      <p class="result-score">${correct} / ${total}</p>
      <p class="muted">${correct} of ${total} correct</p>
      <p class="streak" style="margin-top:0.75rem">🔥 ${streak} day streak</p>
    </div>
    <div class="spacer"></div>
    <button class="cta" data-action="home">Back to map</button>`;
}
