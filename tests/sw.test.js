import test from "node:test"; import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs"; import { APP_VERSION } from "../js/version.js";
const sw = readFileSync(new URL("../sw.js", import.meta.url), "utf8");
const walk = (d) => readdirSync(new URL(`../${d}/`, import.meta.url), { withFileTypes: true })
  .flatMap(e => e.isDirectory() ? walk(`${d}/${e.name}`) : [`./${d}/${e.name}`]);
test("cache name matches app version", () => { assert.equal(APP_VERSION, "chess-coach-v7"); assert.ok(sw.includes(`"${APP_VERSION}"`)); });
test("every module and stylesheet is in the shell", () => {
  for (const f of [...walk("js"), ...walk("css"), ...walk("assets/pieces").filter(f => f.endsWith(".svg")), "./index.html", "./manifest.json", "./favicon.svg"]) assert.ok(sw.includes(`"${f}"`), f); });
test("index.html loads app as a module", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.ok(html.includes('<script type="module" src="js/app.js"></script>')); assert.ok(html.includes('href="css/app.css"')); });
