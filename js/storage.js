// Defensive localStorage wrapper: never throws, never returns a broken shape.
import { STORAGE_KEY } from "./version.js";
import { defaultProgress } from "./logic/progress.js";

const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

export function loadProgress(storage = globalThis.localStorage) {
  const base = defaultProgress();
  try {
    if (!storage) return base;
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const data = JSON.parse(raw);
    if (!isObj(data) || data.version !== 6) return base;
    const out = { ...base };
    for (const key of Object.keys(base)) {
      if (key === "version") continue;
      if (isObj(data[key])) out[key] = { ...base[key], ...data[key] };
    }
    return out;
  } catch {
    return base;
  }
}

export function saveProgress(p, storage = globalThis.localStorage) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(p));
    return true;
  } catch {
    return false;
  }
}
