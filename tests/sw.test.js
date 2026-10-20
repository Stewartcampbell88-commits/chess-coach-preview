import test from "node:test"; import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs"; import { APP_VERSION } from "../js/version.js";
const sw = readFileSync(new URL("../sw.js", import.meta.url), "utf8");
const walk = (d) => readdirSync(new URL(`../${d}/`, import.meta.url), { withFileTypes: true })
  .flatMap(e => e.isDirectory() ? walk(`${d}/${e.name}`) : [`./${d}/${e.name}`]);
test("cache name matches app version", () => { assert.equal(APP_VERSION, "chess-coach-v8.1"); assert.ok(sw.includes(`"${APP_VERSION}"`)); });
test("every module and stylesheet is in the shell", () => {
  for (const f of [...walk("js"), ...walk("css"), ...walk("assets/pieces").filter(f => f.endsWith(".svg")), ...walk("icons").filter(f => f.endsWith(".png")), "./index.html", "./manifest.json", "./favicon.svg"]) assert.ok(sw.includes(`"${f}"`), f); });
test("index.html loads app as a module", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.ok(html.includes('<script type="module" src="js/app.js"></script>')); assert.ok(html.includes('href="css/app.css"')); });

test("manifest is installable on Android (PNG icons, unique id)", () => {
  const m = JSON.parse(readFileSync("manifest.json", "utf8"));
  assert.equal(m.id, "/chess-coach-preview/"); // must not collide with other apps on the same github.io origin (ANVIL uses "/")
  assert.equal(m.start_url, "./"); assert.equal(m.scope, "./"); assert.equal(m.display, "standalone");
  const has = (size, purpose) => m.icons.some(i => i.sizes === size && i.type === "image/png" && i.purpose === purpose && existsSync(i.src));
  for (const s of ["192x192", "512x512"]) { assert.ok(has(s, "any"), s + " any"); assert.ok(has(s, "maskable"), s + " maskable"); }
  for (const i of m.icons) { const b = readFileSync(i.src); assert.equal(b.readUInt32BE(16) + "x" + b.readUInt32BE(20), i.sizes, i.src); }
  assert.ok(readFileSync("index.html", "utf8").includes('rel="apple-touch-icon" sizes="180x180" href="icons/apple-touch-icon-180.png"'));
});
