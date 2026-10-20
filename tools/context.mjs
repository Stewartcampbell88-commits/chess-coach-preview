// Wires engine (and tablebase) support into the validator.
import * as engine from "./engine.mjs";
import { engineTree, engineExtras } from "./engine-tree.mjs";

export async function makeContext() {
  return { engine, engineTree, engineExtras };
}
export async function closeContext(ctx) {
  ctx.engine?.stop();
}
