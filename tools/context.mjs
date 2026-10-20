// Wires engine and tablebase support into the validator.
import * as engine from "./engine.mjs";
import * as tb from "./tablebase.mjs";
import { engineTree, engineExtras } from "./engine-tree.mjs";
import { tbTree } from "./tb-tree.mjs";

export async function makeContext() {
  return { engine, engineTree, engineExtras, tablebase: tb.probe, tbTree };
}
export async function closeContext(ctx) {
  ctx.engine?.stop();
  tb.saveCache();
}
