// Usage: node tools/validate-puzzles.mjs                                       -> validate every puzzle
//        node tools/validate-puzzles.mjs --suggest "<fen>" <kind>              (World 1 kinds)
//        node tools/validate-puzzles.mjs --suggest-line "<fen>" mate <n>
//        node tools/validate-puzzles.mjs --suggest-line "<fen>" engine <length>
//        node tools/validate-puzzles.mjs --suggest-line "<fen>" tb <length> <win|draw>
import { validatePuzzle, expectedAccept } from "./see.mjs";
import { validateLine, suggestLine } from "./line-check.mjs";
import { makeContext, closeContext } from "./context.mjs";

const args = process.argv.slice(2);
const ctx = await makeContext();
try {
  if (args[0] === "--suggest") {
    console.log(JSON.stringify(expectedAccept({ fen: args[1], kind: args[2] })));
  } else if (args[0] === "--suggest-line") {
    const errs = [];
    const tree = await suggestLine({ fen: args[1], goal: args[2], n: Number(args[3]), result: args[4] || "win" }, ctx, errs);
    console.log(JSON.stringify(tree));
    for (const e of errs) console.error(`WARN ${e}`);
  } else {
    const { PUZZLES } = await import("../js/data/puzzles.js");
    let bad = 0;
    for (const p of PUZZLES) {
      const errs = p.kind === "line" ? await validateLine(p, ctx) : validatePuzzle(p);
      for (const e of errs) { console.log(`FAIL ${p.id}: ${e}`); bad++; }
    }
    if (bad) process.exitCode = 1;
    else console.log(`OK ${PUZZLES.length} puzzles`);
  }
} finally {
  await closeContext(ctx);
}
