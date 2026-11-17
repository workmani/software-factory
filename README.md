# Software Factory (POC)

Idea in, app out. A proof of concept for a GitHub-native "software factory" for small, disposable apps, using GitHub Issues as the intake, Claude Code (via [`claude-code-action`](https://github.com/anthropics/claude-code-action)) as the builder, PRs as the quality gate, and GitHub Pages as the shelf.

## The line

```
 ┌─────────────┐   ┌──────────────┐   ┌──────────────┐   ┌─────────────┐   ┌──────────────┐
 │ 1. Intake   │──▶│ 2. Spec      │──▶│ 3. Approve   │──▶│ 4. Build    │──▶│ 5. Ship      │
 │ Issue form  │   │ Claude posts │   │ Human adds   │   │ Claude      │   │ Merge PR →   │
 │ label: idea │   │ spec comment │   │ `build` label│   │ builds, PR  │   │ GitHub Pages │
 └─────────────┘   └──────────────┘   └──────────────┘   └─────────────┘   └──────────────┘
```

| Stage | Trigger | Workflow | Output |
|---|---|---|---|
| Intake | New issue via **💡 Submit an idea** form | n/a | Issue labeled `idea` |
| Spec | Issue opened (or `respec` label) | `factory-spec.yml` | Spec comment, label `spec-ready` |
| Approve | Human adds `build` label | n/a | The human-in-the-loop gate |
| Build | `build` label | `factory-build.yml` | `apps/<slug>/` on `factory/<slug>` branch, PR that closes the issue |
| Ship | Merge to `main` | `deploy-pages.yml` | Catalog + app live at `https://<owner>.github.io/software-factory/<slug>/` |

**Iterating:** comment feedback on the issue and re-add `build`. The factory picks up the existing branch and improves the app instead of starting over.

**Retiring:** delete `apps/<slug>/` and merge. That's the whole decommission process, which is the point of disposable software.

## One-time setup

1. **Auth secret** (Settings → Secrets and variables → Actions → New repository secret), one of:
   - `CLAUDE_CODE_OAUTH_TOKEN`: run `claude setup-token` locally; uses your Claude subscription
   - `ANTHROPIC_API_KEY`: from console.anthropic.com; pay per token
2. **Actions permissions** (Settings → Actions → General → Workflow permissions):
   - Select **Read and write permissions**
   - Check **Allow GitHub Actions to create and approve pull requests**
3. **Pages** (Settings → Pages → Build and deployment → Source): **GitHub Actions**
4. **Labels**: created automatically by `setup-labels.yml` on first push. Re-run it from the Actions tab if needed.

The Claude GitHub App is optional here, since the workflows pass `GITHUB_TOKEN` directly. Install it if you also want to `@claude` in PR comments.

## Guardrails in this POC

- Spec stage only runs for issues from `OWNER` / `MEMBER` / `COLLABORATOR` (prompt-injection guard).
- Build only starts when someone with triage+ access adds `build`.
- Claude's tools are allow-listed per stage (no arbitrary shell, no git, no network installs).
- Claude only writes inside `apps/<slug>/`; the workflow does the git work and validates the contract (`scripts/validate-apps.mjs`).
- Every app ships through a PR, so a human reviews before anything deploys.
- Build rules live in `.github/factory/build-rules.md`. Change that file to change what the factory produces.

## Known limits (things a real version at work would need)

- PRs opened with `GITHUB_TOKEN` don't trigger other workflows, so validation runs inside the build job. A GitHub App token would fix that.
- Static apps only. A real factory would have templates per archetype (Next.js + API, C# function, etc.) and an IaC deploy target.
- No cost controls beyond `--max-turns` and job timeouts.
- No automated UI testing yet (a Playwright smoke test per app would be a natural stage 4b).

## Layout

```
.github/
  ISSUE_TEMPLATE/idea.yml     intake form
  factory/build-rules.md      the contract every app must meet
  workflows/
    factory-spec.yml          stage 2
    factory-build.yml         stage 4
    deploy-pages.yml          stage 5
    ci.yml                    validation for human PRs
    setup-labels.yml          one-time label bootstrap
apps/<slug>/                  one folder per built app
scripts/
  validate-apps.mjs           contract checks
  build-site.mjs              assembles the Pages catalog
```
