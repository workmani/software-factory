#!/usr/bin/env node
// Validates every app folder (or just the ones passed as args) against the factory contract.
// Usage: node scripts/validate-apps.mjs [apps/<slug> ...]
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const appsDir = path.join(root, "apps");

const targets = process.argv.slice(2).length
  ? process.argv.slice(2).map((p) => path.resolve(root, p))
  : fs.existsSync(appsDir)
    ? fs.readdirSync(appsDir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => path.join(appsDir, d.name))
    : [];

const required = ["index.html", "manifest.json", "README.md"];
const manifestKeys = ["name", "summary", "issue", "lifespan", "createdAt"];
let failures = 0;

const fail = (app, msg) => {
  failures++;
  console.error(`✗ ${path.relative(root, app)}: ${msg}`);
};

for (const app of targets) {
  const before = failures;
  if (!fs.existsSync(app)) {
    fail(app, "folder does not exist");
    continue;
  }
  for (const f of required) {
    if (!fs.existsSync(path.join(app, f))) fail(app, `missing ${f}`);
  }

  const manifestPath = path.join(app, "manifest.json");
  if (fs.existsSync(manifestPath)) {
    try {
      const m = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
      for (const k of manifestKeys) if (!(k in m)) fail(app, `manifest.json missing "${k}"`);
    } catch (e) {
      fail(app, `manifest.json is not valid JSON (${e.message})`);
    }
  }

  // Absolute-path check: apps are served from a subpath on Pages, so "/foo.js" breaks.
  const walk = (dir) =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
      d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]
    );
  for (const file of walk(app).filter((f) => /\.(html|css|js|mjs)$/.test(f))) {
    const text = fs.readFileSync(file, "utf8");
    const bad = text.match(/(?:src|href)\s*=\s*["']\/(?!\/)[^"']*["']/g);
    if (bad) fail(app, `${path.relative(app, file)} uses root-absolute paths: ${bad.slice(0, 3).join(", ")}`);
  }

  if (failures === before) console.log(`✓ ${path.relative(root, app)}`);
}

if (!targets.length) console.log("No apps to validate yet.");
process.exit(failures ? 1 : 0);
