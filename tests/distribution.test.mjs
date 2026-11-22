import assert from "node:assert/strict";
import { readFile, readdir, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const dist = path.join(root, "dist");
const html = await readFile(path.join(dist, "index.html"), "utf8");
const css = await readFile(path.join(dist, "game.css"), "utf8");
const js = await readFile(path.join(dist, "game.js"), "utf8");
const refs = [
  ...html.matchAll(/(?:src|href)="([^"#]+)"/g),
  ...css.matchAll(/url\(["']?([^"')]+)["']?\)/g),
];
for (const [, ref] of refs) {
  if (ref.startsWith("data:")) continue;
  assert.ok(!/^(?:https?:|\/)/.test(ref), `Nonportable runtime asset: ${ref}`);
  await access(path.resolve(dist, ref));
}
assert.doesNotMatch(html, /<!-- component:|<style>|<script>/);
assert.doesNotMatch(js, /globalThis\.__test|fetch\(|XMLHttpRequest/);
const ids = [...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
assert.equal(new Set(ids).size, ids.length, "Duplicate static component IDs");
for (const id of ["world", "quest-panel", "inventory-slots", "title-screen", "speech", "modal"])
  assert.ok(ids.includes(id), id);
for (const name of ["yon", "jodal"]) {
  const voice = await readFile(path.join(root, `assets/audio/${name}-voice-bank.wav`));
  assert.ok(js.includes(voice.toString("base64")), `${name} voice must be embedded for file:// execution`);
}
for (const name of ["office-loop", "title-call"]) {
  const recording = await readFile(path.join(root, `assets/audio/${name}.mp3`));
  assert.ok(js.includes(recording.toString("base64")), `${name} must work offline`);
}
assert.doesNotMatch(js + html, /owner-raw|\.m4a|jodal-voice\//);
for (const name of await readdir(dist, { recursive: true }))
  assert.doesNotMatch(name, /owner-raw|\.m4a$/i, "Raw recording must not be distributed");
const builtFont = (await readdir(path.join(dist, "assets"))).find((n) =>
  n.startsWith("Gaegu-Regular-"),
);
assert.deepEqual(
  await readFile(path.join(dist, "assets", builtFont)),
  await readFile(path.join(root, "assets/fonts/Gaegu-Regular.ttf")),
);
assert.match(await readFile(path.join(dist, "FONT-LICENSE.txt"), "utf8"), /SIL OPEN FONT LICENSE/);
assert.ok(
  (await readFile(path.join(root, "index.html"))).byteLength < 4096,
  "Template should not contain the old bundled game",
);
assert.ok(!html.includes("data-source-only"), "Built page must not redirect to itself");
assert.match(
  await readFile(path.join(root, "index.html"), "utf8"),
  /data-source-only/,
  "Source template should forward to the built game",
);
console.log(
  `Distribution checks passed: ${refs.length} local asset references, all HTML components, font and both processed voice banks.`,
);
