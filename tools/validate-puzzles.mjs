// Usage: node tools/validate-puzzles.mjs            -> validate all puzzles
//        node tools/validate-puzzles.mjs --suggest "<fen>" <kind>
import { validatePuzzle, expectedAccept } from "./see.mjs";

const args = process.argv.slice(2);
if (args[0] === "--suggest") {
  console.log(JSON.stringify(expectedAccept({ fen: args[1], kind: args[2] })));
  process.exit(0);
}
const { PUZZLES } = await import("../js/data/puzzles.js");
let bad = 0;
for (const p of PUZZLES) {
  for (const e of validatePuzzle(p)) { console.log(`FAIL ${p.id}: ${e}`); bad++; }
}
if (bad) process.exit(1);
console.log(`OK ${PUZZLES.length} puzzles`);
