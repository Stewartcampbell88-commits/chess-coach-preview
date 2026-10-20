// Endgame warm-ups mixed into daily sessions from World 3 onward (spec). Checked by
// the Lichess tablebase (goal "tb", cached in tools/cache/tablebase.json) or exact mate search.
const D = (id, goal, extra, fen, prompt, tree, explain) =>
  ({ id, world: 6, level: null, boss: null, drip: true, tag: "eg-drip", kind: "line", goal, ...extra, fen, prompt, tree, explain });
const WIN = "White to move. Win this — find the only winning move.";
const DRAW_B = "Black to move. Save the draw.";
const MATE2 = "White to move. Checkmate in two.";

export const PUZZLES = [
  // ——— Opposition: win it ———
  D("eg-d-01", "tb", { length: 1, result: "win" }, "8/4k3/8/3K4/4P3/8/8/8 w - - 0 1", WIN, { d5e5: null },
    "Ke5! takes the opposition: the kings face each other with one square between and Black must give way. Pushing the pawn first only draws."),
  D("eg-d-02", "tb", { length: 1, result: "win" }, "8/2k5/8/8/2KP4/8/8/8 w - - 0 1", WIN, { c4c5: null },
    "Kc5! takes the opposition, ahead of the pawn. Black's king has to step aside and White's king leads the pawn home."),
  D("eg-d-03", "tb", { length: 1, result: "win" }, "8/8/3k4/8/8/2KP4/8/8 w - - 0 1", WIN, { c3d4: null },
    "Kd4! — king in front of the pawn, facing Black's king with one square between. Now Black must give ground."),
  // ——— Opposition: hold it ———
  D("eg-d-04", "tb", { length: 1, result: "draw" }, "2k5/8/8/1K6/2P5/8/8/8 b - - 0 1", DRAW_B, { c8b7: null },
    "Kb7! takes the opposition back: the kings face each other on the b-file. Any other move lets White's king march forward."),
  D("eg-d-05", "tb", { length: 1, result: "draw" }, "8/5k2/8/8/5K2/4P3/8/8 b - - 0 1", DRAW_B, { f7f6: null },
    "Kf6! — face the White king with one square between. Holding the opposition keeps White's king out."),
  // ——— The square of the pawn ———
  D("eg-d-06", "tb", { length: 1, result: "win" }, "8/8/8/8/2P5/4k3/7K/8 w - - 0 1", WIN, { c4c5: null },
    "c5! — run. Draw the square from c5 to f8: Black's king can't step into it, so it can't catch the pawn."),
  D("eg-d-07", "tb", { length: 1, result: "win" }, "8/8/8/8/P7/5k2/7K/8 w - - 0 1", WIN, { a4a5: null },
    "a5! — the pawn runs. Black's king is outside the square (a5 to d8) and is one move too slow."),
  D("eg-d-08", "tb", { length: 1, result: "draw" }, "8/8/8/8/1P4k1/8/8/7K b - - 0 1", DRAW_B, { g4f4: null, g4f5: null },
    "Kf5 or Kf4 — step into the square of the pawn (b4 to f8). From there the king catches it in time."),
  // ——— Basic mates ———
  D("eg-d-09", "mate", { mateIn: 2 }, "6k1/3Q4/8/4K3/8/8/8/8 w - - 0 1", MATE2,
    { e5f6: { reply: "g8h8", next: { d7g7: null } } },
    "Kf6! — a quiet king move. Now the king guards g7 and f7, so after Kh8 the queen mates on g7."),
  D("eg-d-10", "mate", { mateIn: 2 }, "1k6/8/8/K7/Q7/8/8/8 w - - 0 1", MATE2,
    { a5b6: { reply: "b8c8", next: { a4e8: null } } },
    "Kb6! takes a7, b7 and c7 away. Black's only move is Kc8, and Qe8# finishes on the back rank."),
  D("eg-d-11", "mate", { mateIn: 2 }, "3k4/8/2K5/8/8/8/7R/8 w - - 0 1", MATE2,
    { h2e2: { reply: "d8c8", next: { e2e8: null } } },
    "Re2! cuts the king off from the e-file. Kc8 is forced, then Re8# — the White king covers the seventh rank."),
  D("eg-d-12", "mate", { mateIn: 2 }, "2k5/8/1K6/8/8/8/8/5R2 w - - 0 1", MATE2,
    { f1d1: { reply: "c8b8", next: { d1d8: null } } },
    "Rd1! shuts the d-file. Black's only move is Kb8, then Rd8# with the king guarding the seventh rank."),
];
