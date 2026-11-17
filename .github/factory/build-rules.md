# Factory build rules

These rules apply to every app the factory builds. They are read by Claude during the spec and build stages.

## Output contract

- Each app lives in its own folder: `apps/<slug>/`. Never touch files outside that folder.
- Required files:
  - `apps/<slug>/index.html` (entry point)
  - `apps/<slug>/manifest.json` with keys: `name`, `summary`, `issue` (number), `lifespan`, `createdAt` (ISO date)
  - `apps/<slug>/README.md` (what it does, how to use it, known limits)
- Static only: HTML, CSS, vanilla JS (ES modules are fine). No build step, no npm install, no server.
- CDN libraries are allowed if pinned to an exact version (e.g. `https://cdn.jsdelivr.net/npm/chart.js@4.4.1`).
- All paths must be relative (`./app.js`, not `/app.js`) because apps are served from a subpath on GitHub Pages.
- Persist data with `localStorage` only. No secrets, no API keys, no real customer data.

## Quality bar

- Works on a phone and a laptop.
- Accessible basics: labels on inputs, keyboard usable, sufficient contrast.
- Clean, plain UI. One clear primary action per screen.
- Keep it small. If the idea is too big, build the smallest useful slice and list the rest under "Not built yet" in the README.
