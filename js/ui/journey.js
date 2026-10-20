// v8.1 Home: winding world map + rank ladder + promotion. Pure renderers: state -> HTML string.
import { levelStatus, bossStatus } from "../logic/progress.js";
import { displayStreak } from "../logic/streak.js";
import { mapLayout, pathD, currentNode, MAP } from "../logic/map-layout.js";
import { LEAGUES, leagueLadder, currentLeague, worldStars } from "../logic/league.js";
import { BOSS_SIZE } from "../logic/boss.js";
import { PIECE_DIR } from "./board-markup.js";
import { ICONS } from "./icons.js";

const BOSS_PIECE = { 1: "bN", 2: "bQ", 3: "bN", 4: "bB", 5: "bR", 6: "bK" };
const starsHtml = (n, max = 3) =>
  `<span class="stars-row" aria-label="${n} star${n === 1 ? "" : "s"}">${Array.from({ length: max }, (_, i) => `<span class="st ${i < n ? "on" : ""}">${ICONS.star}</span>`).join("")}</span>`;
const totalStars = (progress, worlds) => worlds.reduce((s, w) => s + worldStars(progress, w).stars, 0);

// ——— League shields ———
const SHIELD = {
  wood: ["#c08a52", "#7a4f28", "#e3b07a"], stone: ["#a9b6c1", "#5e6b76", "#e2e9ef"], bronze: ["#d58a4a", "#8a4e1e", "#f2b27a"],
  silver: ["#dfe6ee", "#8996a3", "#ffffff"], gold: ["#ffd65a", "#c08a12", "#fff1a8"], master: ["#b06bff", "#5a2aa8", "#e8c8ff"],
};
export function shieldSvg(league, cls = "") {
  const [a, b, c] = SHIELD[league.id];
  const crown = league.id === "master";
  return `<svg class="shield ${cls}" viewBox="0 0 120 134" aria-hidden="true"><defs><linearGradient id="sg-${league.id}-${cls}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
<path d="M60 4 110 22v42c0 34-22 54-50 66C32 118 10 98 10 64V22z" fill="${b}"/>
<path d="M60 12 102 27v37c0 29-19 46-42 57-23-11-42-28-42-57V27z" fill="url(#sg-${league.id}-${cls})" stroke="${c}" stroke-width="3"/>
<path d="M60 12 102 27v23c-22-10-62-10-84 0V27z" fill="#ffffff22"/>
${crown ? '<path d="m38 36 8 12 14-16 14 16 8-12-4 22H42z" fill="#fff1a8" stroke="#8a5a00" stroke-width="2"/>' : ""}
<text x="60" y="${crown ? 96 : 84}" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="${crown ? 24 : 40}" fill="#fff" stroke="${b}" stroke-width="3" paint-order="stroke">${league.mark}</text></svg>`;
}

// ——— Map pieces ———
function rng(seed) { let s = seed; return () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648; }
function decor(theme, h, seed) {
  const r = rng(seed * 97 + 13); let out = "";
  const n = Math.round(h / 30);
  for (let i = 0; i < n; i++) {
    const x = Math.round(r() * 390), y = Math.round(r() * (h - 30)) + 15, s = 8 + Math.round(r() * 14);
    if (x > 95 && x < 295 && r() < 0.75) continue; // keep the middle (the road) clear-ish
    if (theme === "meadow") out += `<circle cx="${x}" cy="${y}" r="${2 + (i % 3)}" fill="${["#f6c143", "#ffffff", "#e98bb5"][i % 3]}" opacity=".75"/>`;
    else if (theme === "castle") out += `<path d="M${x} ${y}v-${s * 2}h6v-5h5v5h6v-5h5v5h6v${s * 2}z" fill="#25223a" opacity=".85"/>`;
    else if (theme === "forest") out += `<path d="M${x} ${y - s * 2}l${-s} ${s * 2}h${s * 2}z" fill="${i % 3 ? "#2d5a3a" : "#3a6e47"}"/><rect x="${x - 2}" y="${y}" width="4" height="6" fill="#3b2a1d"/>`;
    else if (theme === "peaks") out += `<path d="M${x} ${y - s * 2.2}l${-s * 1.4} ${s * 2.2}h${s * 2.8}z" fill="#56677a"/><path d="M${x} ${y - s * 2.2}l${-s * 0.5} ${s * 0.8}h${s}z" fill="#e8eef3"/>`;
    else if (theme === "coast") out += `<path d="M${x - s} ${y}q${s / 2} -6 ${s} 0t${s} 0" stroke="#7fc3d8" stroke-width="2.5" fill="none" opacity=".6"/>`;
    else out += `<circle cx="${x}" cy="${y}" r="${1 + (i % 2)}" fill="#fff" opacity="${0.4 + r() * 0.5}"/>`;
  }
  return out;
}

function castleSvg(n, beaten) {
  const piece = BOSS_PIECE[n.worldId] || "bK";
  return `<svg viewBox="0 0 150 120" aria-hidden="true">
<path class="c-body" d="M6 120V54h14V44h10v10h10V32h12V22h10v10h8V20h10v12h8V22h10v10h12v22h10V44h10v10h14v66z"/>
<path class="c-roof" d="M30 44 20 24h20zM120 44l-10-20h20zM75 20 63 2h24z"/>
<path d="M62 120V94a13 13 0 0 1 26 0v26z" fill="#211d38"/>
<circle cx="75" cy="64" r="17" fill="#ebecd0" stroke="${beaten ? "#81b64c" : "#f6c143"}" stroke-width="3"/>
<image href="${PIECE_DIR}/${piece}.svg" x="61" y="50" width="28" height="28"${beaten ? ' opacity=".45"' : ""}/>
${beaten ? '<path d="M75 2V-14" stroke="#ddd" stroke-width="2.5"/><path d="M75-14h20l-5 6 5 6H75z" fill="#81b64c"/><circle cx="104" cy="48" r="13" fill="#81b64c" stroke="#fff" stroke-width="3"/><path d="m98 48 4.5 4.5 8-8" stroke="#fff" stroke-width="3.2" fill="none" stroke-linecap="round"/>' : ""}
</svg>`;
}

function nodeHtml(n) {
  const pos = `style="left:${(n.x * 100).toFixed(2)}%;top:${n.y}px"`;
  if (n.kind === "boss") {
    const beaten = n.status === "passed";
    return `<button data-action="open-node" data-node="${n.id}" class="castle w${n.worldId} ${n.status}${beaten ? " beaten" : ""}${n.current ? " current" : ""}" ${pos} aria-label="${n.name}">${castleSvg(n, beaten)}<span class="castle-tag">${beaten ? `${ICONS.check} Boss beaten` : n.status === "locked" ? `${ICONS.lock} Boss` : `${ICONS.crown} Boss`}</span></button>`;
  }
  const inner = n.status === "locked" ? ICONS.lock : `<b>${n.index + 1}</b>`;
  return `<button data-action="open-node" data-node="${n.id}" class="map-bubble ${n.status}${n.current ? " current" : ""}" ${pos} aria-label="Level ${n.index + 1} · ${n.name}"><span class="bub">${inner}</span>${n.status === "cleared" ? starsHtml(n.stars) : ""}${n.current ? `<span class="bub-label">${n.name}</span>` : ""}</button>`;
}

function zoneHtml(z, progress, worlds) {
  const w = worlds.find((x) => x.id === z.worldId);
  const ws = worldStars(progress, w);
  const sign = `<div class="zone-sign"><span class="zn">${z.worldId}</span><span><b>World ${z.worldId} · ${w.name}</b><small>${z.zoneName}${ws.max ? ` · ${ws.stars}/${ws.max} ★` : ""}</small></span></div>`;
  const fog = z.fog
    ? `<div class="fog" data-action="open-node" data-node="world-${z.worldId}"><div class="fog-lock">${ICONS.lock}</div><p class="fog-title">World ${z.worldId} · ${w.name}</p><p class="fog-sub">${z.status === "coming-soon" ? "Coming soon" : `Beat the World ${z.worldId - 1} boss to clear the fog`}</p></div>`
    : "";
  return `<section class="zone theme-${z.theme}${z.fog ? " fog-on" : ""}" style="top:${z.top}px;height:${z.height}px" data-world="${z.worldId}">
<svg class="decor" viewBox="0 0 390 ${z.height}" preserveAspectRatio="none" aria-hidden="true">${decor(z.theme, z.height, z.worldId)}</svg>${sign}${fog}</section>`
    .replace(`class="zone theme-${z.theme}${z.fog ? " fog-on" : ""}"`, `class="zone theme-${z.theme}${z.fog ? " fog" : ""}"`);
}

export function rankChip(progress, worlds) {
  const cur = currentLeague(progress, worlds);
  const pct = cur.max ? Math.round((cur.stars / cur.max) * 100) : 0;
  return `<button class="rank-chip" data-action="open-rank" aria-label="Rank: ${cur.league.name}">${shieldSvg(cur.league, "mini")}<span class="rc-text"><b>${cur.league.name}</b><span class="mini-bar"><i style="width:${pct}%"></i></span></span></button>`;
}

export function renderMap(progress, worlds, { today, updateReady, updateChecking, appVersion, muted = false }) {
  const L = mapLayout(progress, worlds);
  const streak = displayStreak(progress.streak, today);
  const stars = totalStars(progress, worlds);
  const cur = L.nodes.find((n) => n.current);
  const doneToday = progress.streak.lastDate === today;
  return `
<div class="map-hud">
  ${rankChip(progress, worlds)}
  <span class="hud-chip flame" aria-label="${streak} day streak">${ICONS.daily}<b>${streak}</b></span>
  <span class="hud-chip star" aria-label="${stars} stars">${ICONS.star}<b>${stars}</b></span>
  <span class="hud-goal" aria-label="Goal: 1500 Rapid">GOAL<b>1500</b></span>
  <button class="icon-btn sm" data-action="toggle-sound" aria-label="${muted ? "Sound off" : "Sound on"}">${muted ? ICONS.soundOff : ICONS.soundOn}</button>
</div>
${updateReady ? `<div class="update-banner map-banner"><span><strong>Update available</strong></span><button class="btn green sm" data-action="apply-update">Update now</button></div>` : ""}
<div class="map" style="height:${L.height}px" data-current="${L.currentId || ""}">
  ${L.zones.map((z) => zoneHtml(z, progress, worlds)).join("")}
  <svg class="road" viewBox="0 0 ${MAP.width} ${L.height}" preserveAspectRatio="none" aria-hidden="true">
    <path class="road-shadow" d="${pathD(L.path, MAP.width)}"/><path class="road-main" d="${pathD(L.path, MAP.width)}"/><path class="road-dash" d="${pathD(L.path, MAP.width)}"/>
  </svg>
  ${L.nodes.map(nodeHtml).join("")}
  ${cur ? `<div class="token" data-at="${cur.id}" style="left:${(cur.x * 100).toFixed(2)}%;top:${cur.y}px"><img src="${PIECE_DIR}/wP.svg" alt="You"></div>` : ""}
  <div class="map-start" style="top:${L.height - 120}px">
    <p class="start-flag">${ICONS.play} Start · 1500 Rapid, here we come</p>
    <div class="map-version"><span>${appVersion}</span><button class="btn grey sm" data-action="check-update"${updateChecking ? " disabled" : ""}>${updateChecking ? "Checking…" : "Check for update"}</button></div>
  </div>
</div>
<div class="fab-wrap"><button class="btn green fab" data-action="play-session">${ICONS.play} Play today's session${doneToday ? ` <span class="fab-done" role="img" aria-label="Done today">${ICONS.check}</span>` : ""}</button></div>`;
}

// ——— Level / boss sheet ———
export function renderNodeSheet(progress, worlds, nodeId) {
  const world = worlds.find((w) => w.boss?.id === nodeId || w.levels.some((l) => l.id === nodeId));
  if (!world) return "";
  const head = (title, sub, extra = "") => `<div class="sheet-backdrop" data-action="close-sheet"></div>
<div class="sheet" role="dialog" aria-label="${title}"><div class="sheet-grip"></div><p class="tiny">World ${world.id} · ${world.name}</p><h2>${title}</h2><p class="muted small">${sub}</p>${extra}`;
  if (world.boss?.id === nodeId) {
    const st = bossStatus(progress, worlds, world.id);
    let action;
    if (st === "gated") {
      const gl = world.levels.find((l) => l.id === progress.bossGate[world.boss.id]);
      action = `<p class="gate-note">Practise ${gl ? gl.name : "your weak level"} first, then have another go.</p>`;
    } else if (st === "passed") action = `<p class="sheet-done">${ICONS.check} Beaten — you're through to the next league.</p><button class="btn grey big" data-action="play-boss" data-world="${world.id}">Replay boss</button>`;
    else if (st === "open") action = `<button class="btn gold big" data-action="play-boss" data-world="${world.id}">${ICONS.crown} Fight the boss</button>`;
    else action = `<p class="muted small">${ICONS.lock} Clear every level to unlock.</p>`;
    return head(world.boss.name, `${BOSS_SIZE} fresh positions · pass ${BOSS_SIZE - 1} of ${BOSS_SIZE} · no hints`, action) + "</div>";
  }
  const i = world.levels.findIndex((l) => l.id === nodeId);
  const level = world.levels[i];
  const st = levelStatus(progress, worlds, level.id);
  const best = progress.levels[level.id]?.stars || 0;
  const btn = st === "cleared"
    ? `<button class="btn grey big" data-action="play-level" data-level="${level.id}">${ICONS.retry} Replay</button>`
    : `<button class="btn green big" data-action="play-level" data-level="${level.id}">${ICONS.play} Play</button>`;
  return head(`Level ${i + 1} · ${level.name}`, "5 puzzles · 3 lives · stars = lives left",
    `<div class="sheet-stars">${starsHtml(best)}<span class="muted small">${st === "cleared" ? `Best: ${best} of 3` : "Not cleared yet"}</span></div>${btn}`) + "</div>";
}

// ——— Rank ladder ———
export function renderRank(progress, worlds, { updateReady } = {}) {
  const rows = leagueLadder(progress, worlds);
  const cur = currentLeague(progress, worlds);
  const at = rows.findIndex((r) => r.league.id === cur.league.id);
  const prev = rows[at - 1];
  const next = rows[at + 1];
  const pct = cur.max ? Math.round((cur.stars / cur.max) * 100) : 0;
  const node = currentNode(progress, worlds);
  const inLeague = node && node.worldId === cur.league.worldId ? node : null;
  const w = cur.world;
  let nextCard;
  if (cur.comingSoon) nextCard = `<p class="n">${cur.league.name} league is coming soon.</p><p class="muted small">Keep your streak going with daily sessions.</p>`;
  else if (inLeague && inLeague.kind === "level") {
    const l = w.levels[inLeague.index];
    nextCard = `<p class="n">Level ${inLeague.index + 1} · ${l.name}</p><div class="pips">${w.levels.map((x) => `<b class="${progress.levels[x.id]?.cleared ? "on" : ""}"></b>`).join("")}</div><button class="btn green" data-action="play-level" data-level="${l.id}">${ICONS.play} Play</button>`;
  } else nextCard = `<p class="n">All levels cleared</p><p class="muted small">Time for the promotion match →</p>`;
  let promo = "";
  if (w && w.boss) {
    const bs = bossStatus(progress, worlds, w.id);
    const act = bs === "open" ? `<button class="btn gold" data-action="play-boss" data-world="${w.id}">${ICONS.crown} Fight</button>`
      : bs === "gated" ? `<p class="small muted">Practise your weak level first</p>`
      : bs === "passed" ? `<p class="small">${ICONS.check} Won</p>`
      : `<p class="small muted lk">${ICONS.lock} Clear ${w.levels.length} levels</p>`;
    promo = `<div class="card promo-card"><p class="t">Promotion match</p><p class="n">${w.boss.name}</p><p class="muted small">Win ${BOSS_SIZE - 1} of ${BOSS_SIZE}${next ? ` → ${next.league.name}` : ""}</p>${act}</div>`;
  }
  const list = [...rows].reverse().map((r) => {
    const right = r.status === "passed" ? `<span class="lr-st ok">${ICONS.check} ${r.stars}/${r.max} ★</span>`
      : r.status === "current" ? `<span class="lr-st">${r.comingSoon ? "Soon" : `${r.stars}/${r.max} ★`}</span>`
      : `<span class="lr-st">${ICONS.lock}</span>`;
    const name = r.world ? r.world.name : "";
    return `<div class="league-row ${r.status}${r.comingSoon ? " soon" : ""}">${shieldSvg(r.league, "row")}<div class="lr-name"><b>${r.league.name}${r.league.id === "master" ? ' <span class="r1500">· Rapid 1500</span>' : ""}${r.status === "current" ? ' <span class="you">YOU</span>' : ""}</b><small>World ${r.league.worldId} · ${name}${r.comingSoon ? " · coming soon" : ""}</small></div>${right}</div>`;
  }).join("");
  return `
<header class="page-head rank-head"><button class="icon-btn" data-action="close-rank" aria-label="Back to map">${ICONS.back}</button><h1>Rank</h1><span></span></header>
${updateReady ? `<div class="update-banner"><span><strong>Update available</strong></span><button class="btn green sm" data-action="apply-update">Update now</button></div>` : ""}
<div class="rank-hero league-${cur.league.id}">
  <p class="kicker">Current league</p>
  ${shieldSvg(cur.league, "big")}
  <p class="tier">${cur.league.name}</p>
  <p class="sub">League ${LEAGUES.indexOf(cur.league) + 1} · ${w ? w.name : ""}</p>
  <div class="xp"><i style="width:${pct}%"></i><span>${cur.stars} / ${cur.max} ★</span></div>
  <div class="xpl"><span>${prev ? `Promoted from ${prev.league.name} · ${prev.stars}★` : "Your first league"}</span><span>${next ? `${next.league.name} →` : "Top league"}</span></div>
</div>
<div class="rank-row"><div class="card next-card"><p class="t">Next match</p>${nextCard}</div>${promo}</div>
<p class="tiny ladder-title">Leagues</p>
<div class="ladder">${list}</div>`;
}

// ——— Promotion ———
export function renderPromotion({ worldId, score, from, to }) {
  const title = to ? `Promoted to ${to.name}` : "Master — top of the ladder";
  return `
<div class="result promo">
  <div class="promo-rays" aria-hidden="true"></div>
  <div class="confetti" aria-hidden="true">${Array.from({ length: 18 }, (_, i) => `<i style="--i:${i};left:${(i * 37) % 97}%"></i>`).join("")}</div>
  <p class="tiny promo-kicker">Boss beaten · ${score} / ${BOSS_SIZE}</p>
  <h1 class="promo-world">World ${worldId} complete!</h1>
  <div class="promo-shields">${from && to ? `${shieldSvg(from, "old")}<span class="promo-arrow">${ICONS.next}</span>` : ""}${shieldSvg(to || from, "new")}</div>
  <h2 class="promo-title">${title}</h2>
  <p class="muted">${to ? `Welcome to the ${to.name} league. A new world is open on your map.` : "You've cleared every world. Rapid 1500, here we come."}</p>
  <div class="spacer"></div>
  <button class="btn gold big" data-action="open-rank">See your rank</button>
  <button class="btn ghost" data-action="home">Back to map</button>
</div>`;
}
