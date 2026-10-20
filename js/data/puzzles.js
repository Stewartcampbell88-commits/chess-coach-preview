// Every puzzle in the app. Add each new world file here (and nowhere else).
import { PUZZLES as W1 } from "./puzzles-w1.js";
import { PUZZLES as W2 } from "./puzzles-w2.js";
import { PUZZLES as W3 } from "./puzzles-w3.js";

export const PUZZLES = [...W1, ...W2, ...W3];

export function puzzlesById() {
  return new Map(PUZZLES.map((p) => [p.id, p]));
}
