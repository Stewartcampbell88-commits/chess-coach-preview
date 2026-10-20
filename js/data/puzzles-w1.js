// World 1 puzzles. Every entry is checked by `npm run validate` (chess.js):
// the validator computes the correct answer set and must match `accept`.
// All positions: White to move, board shown from White's side.

const TAP = "White to move. Tap every black piece that's hanging, then tap Check.";
const TAKE = "White to move. Win material — make the free capture.";
const SAVE = "White to move. One of your pieces is hanging. Find a move that leaves nothing hanging.";
const COUNT_TAP = "Count attackers and defenders. Tap every black piece that's truly hanging, then tap Check.";
const COUNT_TAKE = "Count attackers and defenders, then make the capture that wins material.";

const L = (id, level, tag, kind, prompt, fen, accept, explain) =>
  ({ id, world: 1, level, boss: null, tag, kind, fen, prompt, accept, explain });
const B = (id, tag, kind, prompt, fen, accept, explain) =>
  ({ id, world: 1, level: null, boss: "w1-boss", tag, kind, fen, prompt, accept, explain });

export const PUZZLES = [
  // ——— Level 1: Spot the Hanging Piece ———
  L("w1-l1-01", "w1-l1", "spot", "tap-hanging", TAP, "6k1/5ppp/8/4q3/8/5N2/5PPP/3R2K1 w - - 0 1", ["e5"],
    "The queen on e5 is attacked by your knight on f3, and nothing defends her."),
  L("w1-l1-02", "w1-l1", "spot", "tap-hanging", TAP, "r5k1/5ppp/8/8/1b6/P1N5/5PPP/3R2K1 w - - 0 1", ["b4"],
    "The bishop on b4 is attacked by your a3 pawn and has no defender."),
  L("w1-l1-03", "w1-l1", "spot", "tap-hanging", TAP, "6k1/5ppp/8/r7/3n4/2B5/5PPP/3Q2K1 w - - 0 1", ["a5", "d4"],
    "Two this time: your bishop on c3 hits both the rook on a5 and the knight on d4, and neither is defended."),
  L("w1-l1-04", "w1-l1", "spot", "tap-hanging", TAP, "6k1/5ppp/8/3r4/2B5/8/5PPP/6K1 w - - 0 1", ["d5"],
    "The rook on d5 sits on your bishop's diagonal, and nothing guards it."),
  L("w1-l1-05", "w1-l1", "spot", "tap-hanging", TAP, "6k1/5ppp/8/2b5/7q/5N2/5PPP/6K1 w - - 0 1", ["h4"],
    "Your knight on f3 attacks the queen on h4, and nothing defends her. The bishop on c5 isn't attacked at all."),

  // ——— Level 2: Free Lunch ———
  L("w1-l2-01", "w1-l2", "free", "take-free", TAKE, "6k1/pp3ppp/8/2n5/8/8/PP1B1PPP/2R3K1 w - - 0 1", ["c1c5"],
    "Rxc5. The knight on c5 is on your rook's open file, and nothing defends it."),
  L("w1-l2-02", "w1-l2", "free", "take-free", TAKE, "3r2k1/5ppp/8/8/3q4/2N2N2/5PPP/3R2K1 w - - 0 1", ["d1d4", "f3d4"],
    "The rook on d8 defends the queen, but a queen is worth far more than your knight or rook. Nxd4 or Rxd4 wins her."),
  L("w1-l2-03", "w1-l2", "free", "take-free", TAKE, "r4rk1/5ppp/8/3n4/4P3/8/5PPP/5RK1 w - - 0 1", ["e4d5"],
    "exd5. Your e4 pawn attacks the knight on d5, and it has no defender."),
  L("w1-l2-04", "w1-l2", "free", "take-free", TAKE, "2r3k1/5ppp/8/1b6/8/7P/1Q3PP1/6K1 w - - 0 1", ["b2b5"],
    "Qxb5. The bishop on b5 is undefended. Your h3 pawn gave your king an escape square, so …Rc1+ isn't mate."),
  L("w1-l2-05", "w1-l2", "free", "take-free", TAKE, "6k1/5ppp/8/1n1r4/8/2N5/5PPP/6K1 w - - 0 1", ["c3d5"],
    "Your knight attacks both the knight on b5 and the rook on d5. Both are hanging, so take the bigger one: Nxd5."),

  // ——— Level 3: Count Attackers & Defenders ———
  L("w1-l3-01", "w1-l3", "count", "tap-hanging", COUNT_TAP, "r5k1/5ppp/2n5/4n3/8/3N1N2/5PPP/6K1 w - - 0 1", ["e5"],
    "Count: the knight on e5 is attacked twice (d3 and f3) and defended once (c6). Two beats one, so it's hanging."),
  L("w1-l3-02", "w1-l3", "count", "tap-hanging", COUNT_TAP, "6k1/6pp/2n2p2/4n3/5b2/3N1N2/5PPP/6K1 w - - 0 1", ["f4"],
    "The knight on e5 is attacked twice but defended twice (c6 and f6), so it's safe. The bishop on f4 has no defender — that's the hanging one."),
  L("w1-l3-03", "w1-l3", "count", "take-free", COUNT_TAKE, "3r2k1/5ppp/8/3r4/8/2N5/5PPP/3R2K1 w - - 0 1", ["c3d5", "d1d5"],
    "The rook on d5 is defended once (d8) but attacked twice (c3 and d1). Take it: after the trades you're a rook up."),
  L("w1-l3-04", "w1-l3", "count", "tap-hanging", COUNT_TAP, "4r1k1/1p4pp/2n1r3/1B6/8/8/4RPPP/4R1K1 w - - 0 1", ["e6"],
    "Your doubled rooks hit e6 twice, and only the e8 rook defends it, so it's hanging. The c6 knight is defended by the b7 pawn — taking it is just a trade."),
  L("w1-l3-05", "w1-l3", "count", "take-free", COUNT_TAKE, "6k1/5ppp/4p3/r2n4/2B5/8/3B1PPP/6K1 w - - 0 1", ["d2a5"],
    "The knight on d5 is guarded by the e6 pawn, so Bxd5 is only a trade. The rook on a5 has no defender: Bxa5."),

  // ——— Level 4: Save Your Piece ———
  L("w1-l4-01", "w1-l4", "save", "save-piece", SAVE, "6k1/6pp/3p1p2/4N3/8/8/5PPP/6K1 w - - 0 1",
    ["e5c4", "e5c6", "e5d3", "e5d7", "e5f3", "e5g4"],
    "Both black pawns attack your knight. Any safe square works — just not g6 or f7, where it gets taken."),
  L("w1-l4-02", "w1-l4", "save", "save-piece", SAVE, "r5k1/5ppp/2p5/1p6/2B5/8/5PPP/6K1 w - - 0 1",
    ["c4b3", "c4d3", "c4e2", "c4f1"],
    "The b5 pawn attacks your bishop. Retreat to b3, d3, e2 or f1 — on b5 or d5 a pawn takes it, and on a2 or a6 the rook does."),
  L("w1-l4-03", "w1-l4", "save", "save-piece", SAVE, "6k1/5ppp/8/3p4/4N3/8/5PPP/6K1 w - - 0 1",
    ["e4c3", "e4c5", "e4d2", "e4d6", "e4g3", "e4g5"],
    "The d5 pawn attacks your knight. Move it to any safe square — f6 is covered by the g7 pawn."),
  L("w1-l4-04", "w1-l4", "save", "save-piece", SAVE, "6k1/p4ppp/8/1p6/N7/8/5PPP/6K1 w - - 0 1",
    ["a4b2", "a4c3", "a4c5"],
    "Knights on the edge get chased. Go to b2, c3 or c5 — b6 is covered by the a7 pawn."),
  L("w1-l4-05", "w1-l4", "save", "save-piece", SAVE, "6k1/5p2/7p/6p1/7B/8/5PPP/6K1 w - - 0 1",
    ["h4g3"],
    "The g5 pawn attacks your bishop. Bg3 is the only safe square — Bxg5 loses it to …hxg5."),

  // ——— Boss pool (never used in levels) ———
  B("w1-b-01", "spot", "tap-hanging", TAP, "r1b3k1/5ppp/8/8/4n3/8/2Q2PPP/6K1 w - - 0 1", ["e4"],
    "Your queen on c2 attacks the knight on e4, and nothing defends it."),
  B("w1-b-02", "spot", "tap-hanging", TAP, "6k1/r4ppp/8/1q6/8/3B4/5PPP/R5K1 w - - 0 1", ["a7", "b5"],
    "Two loose pieces: the rook on a7 (hit by your a1 rook) and the queen on b5 (hit by your d3 bishop)."),
  B("w1-b-03", "spot", "tap-hanging", TAP, "6k1/5ppp/8/2n1b3/3P4/8/5PPP/6K1 w - - 0 1", ["c5", "e5"],
    "Your d4 pawn attacks both the knight on c5 and the bishop on e5, and neither is defended."),
  B("w1-b-04", "free", "take-free", TAKE, "5rk1/5ppp/8/8/2b5/8/1B3PPP/2R3K1 w - - 0 1", ["c1c4"],
    "Rxc4. The bishop on c4 is on your rook's open file with no defender."),
  B("w1-b-05", "free", "take-free", TAKE, "6k1/3n1ppp/8/8/r7/8/5PPP/3Q2K1 w - - 0 1", ["d1a4"],
    "Both the rook on a4 and the knight on d7 are loose. Take the rook: Qxa4."),
  B("w1-b-06", "free", "take-free", TAKE, "r4rk1/5ppp/8/5b2/4P3/8/5PPP/3R1RK1 w - - 0 1", ["e4f5"],
    "exf5. Your pawn attacks the bishop on f5, and nothing defends it."),
  B("w1-b-07", "count", "tap-hanging", COUNT_TAP, "6k1/5ppp/4r3/8/2B5/8/5PPP/6K1 w - - 0 1", ["e6"],
    "The f7 pawn defends the rook, but your attacker is only a bishop. Bxe6 fxe6 still wins a rook for a bishop — a defended piece can still hang to a cheaper attacker."),
  B("w1-b-08", "count", "take-free", COUNT_TAKE, "6k1/5ppp/1n6/3n4/8/2N1N3/5PPP/6K1 w - - 0 1", ["c3d5", "e3d5"],
    "The knight on d5 is attacked twice (c3 and e3) and defended once (b6). Take it and you come out a knight up."),
  B("w1-b-09", "count", "tap-hanging", COUNT_TAP, "2r3k1/5ppp/2n5/1B2b3/7b/2P2N2/5PPP/6K1 w - - 0 1", ["h4"],
    "The bishop on e5 and the knight on c6 are both defended, so taking them is only a trade. The bishop on h4 has no defender."),
  B("w1-b-10", "save", "save-piece", SAVE, "6k1/5p1p/4p3/6p1/7N/8/5PPP/6K1 w - - 0 1", ["h4f3"],
    "Nf3 is the only safe square — f5 and g6 are covered by black pawns."),
  B("w1-b-11", "save", "save-piece", SAVE, "6k1/p4ppp/1p6/N7/8/8/5PPP/6K1 w - - 0 1",
    ["a5b3", "a5b7", "a5c4", "a5c6"],
    "The b6 pawn attacks your knight. Any of b3, b7, c4 or c6 keeps it safe."),
  B("w1-b-12", "save", "save-piece", SAVE, "6k1/5ppp/8/1p6/B7/8/5PPP/6K1 w - - 0 1",
    ["a4b3", "a4b5", "a4c2", "a4d1"],
    "Retreat to b3, c2 or d1 — or just take: Bxb5 is safe because nothing defends the b5 pawn."),
];

export function puzzlesById() {
  return new Map(PUZZLES.map((p) => [p.id, p]));
}
