# Software Factory

This repo is a software factory. Apps are built from GitHub issues into `apps/<slug>/` by the workflows in `.github/workflows/`.

When working on an app in this repo, follow `.github/factory/build-rules.md` exactly, keep changes inside that app's folder, and run `node scripts/validate-apps.mjs apps/<slug>` before finishing.

When changing the factory itself (workflows, scripts, rules), keep the README's stage table and setup steps in sync.
