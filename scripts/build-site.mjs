#!/usr/bin/env node
// Assembles the GitHub Pages site: copies apps/* into _site/ and writes a catalog index.
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const appsDir = path.join(root, "apps");
const out = path.join(root, "_site");
const repo = process.env.GITHUB_REPOSITORY || "";

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const apps = fs.existsSync(appsDir)
  ? fs.readdirSync(appsDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
  : [];

const entries = [];
for (const slug of apps) {
  fs.cpSync(path.join(appsDir, slug), path.join(out, slug), { recursive: true });
  let m = {};
  try {
    m = JSON.parse(fs.readFileSync(path.join(appsDir, slug, "manifest.json"), "utf8"));
  } catch {}
  entries.push({ slug, name: m.name || slug, summary: m.summary || "", issue: m.issue, lifespan: m.lifespan || "", createdAt: m.createdAt || "" });
}
entries.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const cards = entries.length
  ? entries.map((e) => `
      <li>
        <a class="name" href="./${esc(e.slug)}/">${esc(e.name)}</a>
        <p>${esc(e.summary)}</p>
        <span class="meta">${esc(e.lifespan)}${e.createdAt ? " · " + esc(e.createdAt.slice(0, 10)) : ""}${e.issue && repo ? ` · <a href="https://github.com/${esc(repo)}/issues/${esc(e.issue)}">#${esc(e.issue)}</a>` : ""}</span>
      </li>`).join("")
  : `<li class="empty">Nothing has rolled off the line yet. Submit an idea to get started.</li>`;

fs.writeFileSync(path.join(out, "index.html"), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Software Factory</title>
<style>
  :root { color-scheme: light dark; --fg:#1b1f24; --muted:#5b6470; --bg:#f6f7f9; --card:#fff; --line:#e3e6ea; --accent:#0b6bcb; }
  @media (prefers-color-scheme: dark) { :root { --fg:#e8eaed; --muted:#9aa3ad; --bg:#111418; --card:#1a1f25; --line:#2a3038; --accent:#5aa9ff; } }
  body { margin:0; font:16px/1.5 system-ui, sans-serif; background:var(--bg); color:var(--fg); }
  main { max-width:760px; margin:0 auto; padding:48px 20px; }
  h1 { margin:0 0 4px; font-size:28px; } .sub { color:var(--muted); margin:0 0 32px; }
  ul { list-style:none; padding:0; display:grid; gap:12px; }
  li { background:var(--card); border:1px solid var(--line); border-radius:10px; padding:16px 18px; }
  li p { margin:6px 0; } .name { font-weight:600; font-size:18px; color:var(--accent); text-decoration:none; }
  .meta { color:var(--muted); font-size:13px; } .meta a { color:inherit; } .empty { color:var(--muted); }
  .cta { display:inline-block; margin-bottom:24px; color:var(--accent); }
</style></head>
<body><main>
  <h1>Software Factory</h1>
  <p class="sub">Idea in, app out. ${entries.length} app${entries.length === 1 ? "" : "s"} built.</p>
  ${repo ? `<a class="cta" href="https://github.com/${esc(repo)}/issues/new?template=idea.yml">+ Submit an idea</a>` : ""}
  <ul>${cards}</ul>
</main></body></html>
`);

console.log(`Built _site with ${entries.length} app(s).`);
