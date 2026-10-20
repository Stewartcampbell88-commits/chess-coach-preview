// App shell: tabs + puzzle flow + DOM events. All rules live in js/logic.
import { APP_VERSION } from "./version.js";
import { WORLDS } from "./data/worlds.js";
import { PUZZLES, puzzlesById } from "./data/puzzles-w1.js";
import { parseFen } from "./chess/board.js";
import { isLegalMove, hintSquares, hintText } from "./chess/rules.js";
import { LIVES_PER_LEVEL, starsForResult } from "./logic/stars.js";
import {
  levelStatus, bossStatus, recordLevelResult, recordBossResult, recordAnswer, completeSession, setMuted,
} from "./logic/progress.js";
import { buildBoss, gradeBoss } from "./logic/boss.js";
import { buildDailySession } from "./logic/session.js";
import { checkAnswer } from "./logic/answer.js";
import { makeRng, seedFrom } from "./logic/rng.js";
import { localDateKey } from "./logic/dates.js";
import { displayStreak } from "./logic/streak.js";
import { loadProgress, saveProgress } from "./storage.js";
import { initUpdates } from "./ui/update.js";
import { createBoard } from "./ui/board.js";
import { unlockAudio, playSound, setSoundMuted } from "./ui/sound.js";
import {
  renderMap, renderDaily, renderReview, renderProfile, renderTabBar,
  renderPuzzleShell, renderTopBar, renderCoach, renderActionBar,
  renderLevelResult, renderBossResult, renderSessionEnd,
} from "./ui/screens.js";

const BY_ID = puzzlesById();
const root = document.getElementById("app");
let progress = loadProgress();
setSoundMuted(progress.settings.muted);

const ui = { screen: "tabs", tab: "home" }; // screen: tabs | puzzle | result
const play = {
  mode: null, levelId: null, worldId: 1, ids: [], index: 0, lives: null, results: [],
  phase: "solving", picked: [], hinted: false, hintsUsed: 0, result: null,
};
let board = null;
let busy = false; // true while a move animation / feedback sequence runs

const today = () => localDateKey(new Date());
const persist = () => saveProgress(progress);
const currentPuzzle = () => BY_ID.get(play.ids[play.index]);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function findLevel(levelId) {
  for (const w of WORLDS) {
    const i = w.levels.findIndex((l) => l.id === levelId);
    if (i >= 0) return { world: w, level: w.levels[i], index: i };
  }
  return null;
}

function titleFor() {
  if (play.mode === "level") {
    const f = findLevel(play.levelId);
    return `Level ${f.index + 1} · ${f.level.name}`;
  }
  if (play.mode === "boss") return "Boss: Don't Hang Pieces";
  return "Today's session";
}

// ——— Tabs ———
function renderTabs() {
  const opts = {
    today: today(), updateReady: updates.state.updateReady, updateChecking: updates.state.updateChecking,
    appVersion: APP_VERSION, muted: progress.settings.muted,
  };
  let content;
  if (ui.tab === "daily") content = renderDaily(progress, opts);
  else if (ui.tab === "review") content = renderReview(progress, WORLDS, PUZZLES, opts);
  else if (ui.tab === "profile") content = renderProfile(progress, WORLDS, opts);
  else content = renderMap(progress, WORLDS, opts);
  root.innerHTML = `<main class="tab-page" data-tab="${ui.tab}">${content}</main>${renderTabBar(ui.tab)}`;
  board = null;
}

function goTab(tab = ui.tab) {
  ui.screen = "tabs";
  ui.tab = tab;
  play.mode = null;
  renderTabs();
  window.scrollTo(0, 0);
}

// ——— Puzzle flow ———
function begin(mode, ids, extra = {}) {
  Object.assign(play, {
    mode, ids, index: 0, results: [], result: null, hintsUsed: 0,
    lives: mode === "level" ? LIVES_PER_LEVEL : null, ...extra,
  });
  ui.screen = "puzzle";
  showPuzzle();
  window.scrollTo(0, 0);
}

function showPuzzle() {
  const pz = currentPuzzle();
  Object.assign(play, { phase: "solving", picked: [], hinted: false });
  busy = false;
  root.innerHTML = renderPuzzleShell({
    title: titleFor(), lives: play.lives, index: play.index, total: play.ids.length,
    coach: { text: pz.prompt, mood: "neutral" }, actions: actionState(),
  });
  const host = document.getElementById("board-host");
  host.dataset.puzzle = pz.id;
  board = createBoard(host, { onMove, onMark, onSelect: () => playSound("select") });
  resetBoard();
}

function resetBoard(extra = {}) {
  const pz = currentPuzzle();
  board.set({
    fen: pz.fen, board: parseFen(pz.fen).board, mode: pz.kind === "tap-hanging" ? "mark" : "move",
    sel: null, lastMove: [], hint: [], marks: [], rings: [], badges: {}, ...extra,
  });
}

function actionState() {
  const pz = currentPuzzle();
  const outOfLives = play.mode === "level" && play.lives === 0;
  return {
    phase: play.phase, kind: pz.kind, canHint: play.mode !== "boss", hintUsed: play.hinted,
    picked: play.picked.length, last: outOfLives || play.index >= play.ids.length - 1,
  };
}

function refreshChrome(coach) {
  document.getElementById("panel").innerHTML = renderActionBar(actionState());
  document.getElementById("topbar").innerHTML = renderTopBar({
    title: titleFor(), lives: play.lives, index: play.index + (play.phase === "correct" || play.phase === "wrong" ? 1 : 0),
    total: play.ids.length,
  });
  if (coach) document.getElementById("coach").innerHTML = renderCoach(coach);
}

const canAnswer = () => !busy && (play.phase === "solving" || play.phase === "retrying");

function onMark(sq) {
  if (!canAnswer() || !board.state.board[sq]) return;
  play.picked = play.picked.includes(sq) ? play.picked.filter((s) => s !== sq) : [...play.picked, sq];
  board.set({ marks: play.picked });
  playSound("select");
  refreshChrome();
}

async function onMove(uci, { dragged }) {
  const pz = currentPuzzle();
  if (!canAnswer()) return;
  if (!isLegalMove(pz.fen, uci)) { board.set({ sel: null }); return; } // illegal: snap back, no penalty
  busy = true;
  const captured = Boolean(board.state.board[uci.slice(2, 4)]);
  const anim = board.move(uci, { animate: !dragged });
  playSound(captured ? "capture" : "move");
  await anim;
  await resolve(checkAnswer(pz, { uci }), uci);
}

function submitTaps() {
  if (!canAnswer() || !play.picked.length) return;
  busy = true;
  resolve(checkAnswer(currentPuzzle(), { squares: play.picked }));
}

async function resolve(correct, uci) {
  const pz = currentPuzzle();
  const practice = play.phase === "retrying";
  if (!practice) {
    progress = recordAnswer(progress, pz, correct, today(), { hinted: play.hinted });
    persist();
    play.results.push({ id: pz.id, correct });
    if (play.mode === "level" && !correct) play.lives = Math.max(0, play.lives - 1);
  }
  if (correct) {
    const badges = {};
    if (uci) badges[uci.slice(2, 4)] = "good";
    else for (const s of pz.accept) badges[s] = "good";
    board.set({ badges, hint: [], marks: [], mode: "view" });
    playSound("correct");
    play.phase = "correct";
    refreshChrome({ text: practice ? `That's it. ${pz.explain}` : pz.explain, mood: "good" });
    busy = false;
    return;
  }
  const badges = {};
  if (uci) badges[uci.slice(2, 4)] = "bad";
  else for (const s of play.picked) if (!pz.accept.includes(s)) badges[s] = "bad";
  board.set({ badges, hint: [], mode: "view" });
  board.shake();
  playSound("wrong");
  if (uci) await wait(550);
  const sol = pz.accept[0];
  resetBoard({
    mode: "view",
    rings: pz.kind === "tap-hanging" ? pz.accept : [sol.slice(0, 2), sol.slice(2, 4)],
    badges: uci ? {} : badges, // tap puzzles keep the red cross on wrong picks
  });
  play.phase = "wrong";
  play.picked = [];
  refreshChrome({ text: `${pz.kind === "tap-hanging" ? "The hanging pieces are ringed." : "The right move is ringed."} ${pz.explain}`, mood: "bad" });
  busy = false;
}

function retry() {
  if (play.phase !== "wrong") return;
  play.phase = "retrying";
  play.picked = [];
  resetBoard();
  refreshChrome({ text: "Have another go — this one's just practice.", mood: "neutral" });
}

function hint() {
  if (!canAnswer() || play.mode === "boss" || play.hinted) return;
  const pz = currentPuzzle();
  play.hinted = true;
  if (play.phase === "solving") play.hintsUsed += 1;
  board.set({ hint: hintSquares(pz) });
  refreshChrome({ text: hintText(pz), mood: "hint" });
}

function next() {
  if (busy) return;
  if (play.mode === "level" && play.lives === 0) return finishLevel();
  play.index += 1;
  if (play.index >= play.ids.length) return finish();
  showPuzzle();
}

function finish() {
  if (play.mode === "level") return finishLevel();
  if (play.mode === "boss") return finishBoss();
  return finishSession();
}

function showResult(html, sound) {
  ui.screen = "result";
  board = null;
  root.innerHTML = html;
  if (sound) playSound(sound);
  window.scrollTo(0, 0);
}

function finishLevel() {
  const lives = play.lives;
  const f = findLevel(play.levelId);
  progress = recordLevelResult(progress, play.levelId, lives, { hintsUsed: play.hintsUsed });
  persist();
  const nextLevel = f.world.levels[f.index + 1] || null;
  play.result = { nextLevelId: nextLevel ? nextLevel.id : null };
  const stars = starsForResult(lives, play.hintsUsed);
  showResult(renderLevelResult({
    levelName: f.level.name, stars, livesLeft: lives, hintsUsed: stars ? play.hintsUsed : 0,
    nextLevelName: nextLevel ? nextLevel.name : null,
    bossUnlocked: !nextLevel && bossStatus(progress, WORLDS, f.world.id) === "open",
  }), stars ? "clear" : "wrong");
}

function finishBoss() {
  const world = WORLDS.find((w) => w.id === play.worldId);
  const grade = gradeBoss(play.results, BY_ID, world);
  progress = recordBossResult(progress, world.boss.id, play.ids, grade);
  persist();
  showResult(renderBossResult(grade, WORLDS, play.worldId), grade.passed ? "clear" : "wrong");
}

function finishSession() {
  progress = completeSession(progress, today());
  persist();
  showResult(renderSessionEnd({
    correct: play.results.filter((r) => r.correct).length,
    total: play.results.length,
    streak: displayStreak(progress.streak, today()),
  }), "clear");
}

function startLevel(levelId) {
  if (!findLevel(levelId) || levelStatus(progress, WORLDS, levelId) === "locked") return;
  begin("level", PUZZLES.filter((p) => p.level === levelId).map((p) => p.id), { levelId });
}

function startBoss(worldId = 1) {
  const world = WORLDS.find((w) => w.id === worldId);
  const status = bossStatus(progress, WORLDS, worldId);
  if (!world || !world.boss || (status !== "open" && status !== "passed")) return;
  const prev = progress.bosses[world.boss.id] || { attempts: 0, lastIds: [] };
  const rng = makeRng(seedFrom(`${today()}#${prev.attempts}`));
  begin("boss", buildBoss(world, PUZZLES, prev.lastIds, rng), { worldId });
}

function startSession() {
  const ids = buildDailySession({
    progress, worlds: WORLDS, puzzles: PUZZLES, today: today(), rng: makeRng(seedFrom(today())),
  });
  if (ids.length) begin("session", ids);
}

function toggleSound() {
  progress = setMuted(progress, !progress.settings.muted);
  persist();
  setSoundMuted(progress.settings.muted);
  if (!progress.settings.muted) playSound("select");
  if (ui.screen === "tabs") renderTabs();
}

function onAction(action, el) {
  switch (action) {
    case "tab": return goTab(el.getAttribute("data-tab"));
    case "play-level": return startLevel(el.getAttribute("data-level"));
    case "play-next": return play.result?.nextLevelId ? startLevel(play.result.nextLevelId) : goTab("home");
    case "retry-level": return startLevel(play.levelId);
    case "play-boss": return startBoss(play.worldId || 1);
    case "play-session": return startSession();
    case "clear-taps":
      if (!canAnswer()) return undefined;
      play.picked = []; board.set({ marks: [] }); return refreshChrome();
    case "submit-taps": return submitTaps();
    case "hint": return hint();
    case "retry": return retry();
    case "next": return ui.screen === "puzzle" && (play.phase === "correct" || play.phase === "wrong" || play.phase === "retrying") ? next() : undefined;
    case "home": return goTab("home");
    case "toggle-sound": return toggleSound();
    case "check-update": return updates.check();
    case "apply-update": return updates.apply();
    default: return undefined;
  }
}

// iOS/Android only allow audio after a user gesture.
document.addEventListener("pointerdown", unlockAudio, { capture: true });
root.addEventListener("click", (e) => {
  const actionEl = e.target.closest("[data-action]");
  if (actionEl && root.contains(actionEl) && !actionEl.disabled) onAction(actionEl.getAttribute("data-action"), actionEl);
});

const updates = initUpdates(() => { if (ui.screen === "tabs") renderTabs(); });
renderTabs();
