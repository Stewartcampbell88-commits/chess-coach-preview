// App shell: screen state machine + DOM events. All rules live in js/logic.
import { APP_VERSION } from "./version.js";
import { WORLDS } from "./data/worlds.js";
import { PUZZLES, puzzlesById } from "./data/puzzles-w1.js";
import { parseFen, applyUci } from "./chess/board.js";
import { LIVES_PER_LEVEL, starsForLives } from "./logic/stars.js";
import {
  levelStatus, bossStatus, recordLevelResult, recordBossResult, recordAnswer, completeSession,
} from "./logic/progress.js";
import { buildBoss, gradeBoss } from "./logic/boss.js";
import { buildDailySession } from "./logic/session.js";
import { checkAnswer, nextSelection } from "./logic/answer.js";
import { makeRng, seedFrom } from "./logic/rng.js";
import { localDateKey } from "./logic/dates.js";
import { displayStreak } from "./logic/streak.js";
import { loadProgress, saveProgress } from "./storage.js";
import { initUpdates } from "./ui/update.js";
import {
  renderMap, renderPuzzle, renderFeedback, renderLevelResult, renderBossResult, renderSessionEnd,
} from "./ui/screens.js";

const BY_ID = puzzlesById();
const root = document.getElementById("app");
let progress = loadProgress();

const play = {
  screen: "map",      // map | puzzle | feedback | level-result | boss-result | session-end
  mode: null,         // level | boss | session
  levelId: null,
  worldId: 1,
  ids: [],
  index: 0,
  lives: null,
  results: [],
  sel: null,
  picked: [],
  feedback: null,
  result: null,
};

const today = () => localDateKey(new Date());
const persist = () => saveProgress(progress);
const currentPuzzle = () => BY_ID.get(play.ids[play.index]);

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
  if (play.mode === "boss") return `Boss · ${play.index + 1} of ${play.ids.length}`;
  return "Today's session";
}

function begin(mode, ids, extra = {}) {
  Object.assign(play, {
    mode, ids, index: 0, results: [], sel: null, picked: [], feedback: null, result: null,
    lives: mode === "level" ? LIVES_PER_LEVEL : null, screen: "puzzle", ...extra,
  });
  render();
  window.scrollTo(0, 0);
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

function answer(correct, uci) {
  const pz = currentPuzzle();
  progress = recordAnswer(progress, pz, correct, today());
  persist();
  play.results.push({ id: pz.id, correct });
  if (play.mode === "level" && !correct) play.lives = Math.max(0, play.lives - 1);
  const { board } = parseFen(pz.fen);
  let fbBoard = board, highlight = [], answerSqs = [];
  if (pz.kind === "tap-hanging") {
    answerSqs = pz.accept;
  } else {
    const shown = correct ? uci : pz.accept[0];
    fbBoard = applyUci(board, shown);
    highlight = [shown.slice(0, 2), shown.slice(2, 4)];
  }
  const outOfLives = play.mode === "level" && play.lives === 0;
  play.feedback = {
    correct,
    explain: correct ? pz.explain : `${pz.kind === "tap-hanging" ? "The hanging pieces are ringed." : "Here's the move."} ${pz.explain}`,
    board: fbBoard, highlight, answer: answerSqs,
    last: outOfLives || play.index >= play.ids.length - 1,
  };
  play.sel = null;
  play.picked = [];
  play.screen = "feedback";
  render();
}

function next() {
  if (play.mode === "level" && play.lives === 0) return finishLevel();
  play.index += 1;
  if (play.index >= play.ids.length) return finish();
  play.screen = "puzzle";
  render();
}

function finish() {
  if (play.mode === "level") return finishLevel();
  if (play.mode === "boss") return finishBoss();
  return finishSession();
}

function finishLevel() {
  const lives = play.lives;
  const f = findLevel(play.levelId);
  progress = recordLevelResult(progress, play.levelId, lives);
  persist();
  const nextLevel = f.world.levels[f.index + 1] || null;
  play.result = {
    levelName: f.level.name,
    stars: starsForLives(lives),
    livesLeft: lives,
    nextLevelName: nextLevel ? nextLevel.name : null,
    nextLevelId: nextLevel ? nextLevel.id : null,
    bossUnlocked: !nextLevel && bossStatus(progress, WORLDS, f.world.id) === "open",
  };
  play.screen = "level-result";
  render();
}

function finishBoss() {
  const world = WORLDS.find((w) => w.id === play.worldId);
  const grade = gradeBoss(play.results, BY_ID, world);
  progress = recordBossResult(progress, world.boss.id, play.ids, grade);
  persist();
  play.result = grade;
  play.screen = "boss-result";
  render();
}

function finishSession() {
  progress = completeSession(progress, today());
  persist();
  play.result = {
    correct: play.results.filter((r) => r.correct).length,
    total: play.results.length,
    streak: displayStreak(progress.streak, today()),
  };
  play.screen = "session-end";
  render();
}

function goHome() {
  Object.assign(play, { screen: "map", mode: null, feedback: null, sel: null, picked: [] });
  render();
  window.scrollTo(0, 0);
}

function render() {
  let html = "";
  if (play.screen === "map") {
    html = renderMap(progress, WORLDS, {
      today: today(), updateReady: updates.state.updateReady,
      updateChecking: updates.state.updateChecking, appVersion: APP_VERSION,
    });
  } else if (play.screen === "puzzle") {
    const pz = currentPuzzle();
    html = renderPuzzle({
      title: titleFor(), puzzle: pz, board: parseFen(pz.fen).board, lives: play.lives,
      index: play.index, total: play.ids.length, selected: play.sel, picked: play.picked,
    });
  } else if (play.screen === "feedback") {
    html = renderFeedback({ title: titleFor(), lives: play.lives, index: play.index, total: play.ids.length, ...play.feedback });
  } else if (play.screen === "level-result") {
    html = renderLevelResult(play.result);
  } else if (play.screen === "boss-result") {
    html = renderBossResult(play.result, WORLDS, play.worldId);
  } else if (play.screen === "session-end") {
    html = renderSessionEnd(play.result);
  }
  root.innerHTML = html;
}

function onSquare(sq) {
  if (play.screen !== "puzzle") return;
  const pz = currentPuzzle();
  const { board, turn } = parseFen(pz.fen);
  if (pz.kind === "tap-hanging") {
    if (!board[sq]) return;
    play.picked = play.picked.includes(sq) ? play.picked.filter((s) => s !== sq) : [...play.picked, sq];
    render();
    return;
  }
  const r = nextSelection(play.sel, sq, board, turn);
  play.sel = r.sel;
  if (r.move) answer(checkAnswer(pz, { uci: r.move }), r.move);
  else render();
}

function onAction(action, el) {
  switch (action) {
    case "play-level": return startLevel(el.getAttribute("data-level"));
    case "play-next": return play.result?.nextLevelId ? startLevel(play.result.nextLevelId) : goHome();
    case "retry-level": return startLevel(play.levelId);
    case "play-boss": return startBoss(play.worldId || 1);
    case "play-session": return startSession();
    case "clear-taps": play.picked = []; return render();
    case "submit-taps":
      if (play.screen !== "puzzle" || !play.picked.length) return;
      return answer(checkAnswer(currentPuzzle(), { squares: play.picked }));
    case "next": return play.screen === "feedback" ? next() : undefined;
    case "home": return goHome();
    case "check-update": return updates.check();
    case "apply-update": return updates.apply();
    default: return undefined;
  }
}

root.addEventListener("click", (e) => {
  const actionEl = e.target.closest("[data-action]");
  if (actionEl && root.contains(actionEl)) {
    if (actionEl.disabled) return;
    onAction(actionEl.getAttribute("data-action"), actionEl);
    return;
  }
  const sqEl = e.target.closest("[data-sq]");
  if (sqEl && root.contains(sqEl)) onSquare(sqEl.getAttribute("data-sq"));
});

const updates = initUpdates(() => { if (play.screen === "map") render(); });
render();
