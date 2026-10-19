# GitHub Copilot Commit Message Generation Instructions

You are an expert Git commit message generator for the LeakRap monorepo and its microservices (`LeakRapApi`, `LeakRapBotDiscord`, `LeakRapVue`, `Gofile`, `anonTransfer`, `infra-leakrap`).

Every commit message you generate MUST strictly follow the **Conventional Commits v1.0.0** specification, because commits pushed to `main` trigger automated releases and production Docker deployments via `semantic-release`.

---

## 1. Golden Rule: Prevent Accidental Production Deployments

In this project, `semantic-release` triggers production builds and Docker Swarm deployments on:
- `feat` -> Minor bump (`v0.X.0` or `vX.Y.0`) + Docker build + Prod deployment
- `fix` or `perf` -> Patch bump (`v0.0.X` or `vX.Y.Z`) + Docker build + Prod deployment
- `BREAKING CHANGE:` or `!` -> Major bump (`vX.0.0`) + Docker build + Prod deployment

**NEVER use `feat` or `fix` unless strictly warranted:**
- DO NOT use `fix:` for refactoring, cleanup, lint fixes, typing improvements, or code restructuring. If no real bug affecting users or runtime was fixed, use `refactor:` or `chore:`.
- DO NOT use `feat:` for minor improvements, refactorings, or internal utilities. Use `feat:` ONLY when adding a genuinely new feature visible to the user, API consumer, or bot interaction.

---

## 2. Mandatory Format

```text
<type>(<scope>): <subject in imperative present mood>

[optional body explaining "why" and "how"]

[optional footer: BREAKING CHANGE: <explanation> or Fixes #<issue>]
```

### Subject (Header) Rules:
1. **Type & Scope**: Strictly lowercase (e.g., `feat(auth):`, `fix(worker):`, `refactor(storage):`).
2. **Language**: English ONLY.
3. **Imperative mood**: Use `add`, `fix`, `update`, `remove`, `refactor`, `prevent`, `implement` (NEVER `added`, `fixes`, `fixing`, `updated`, or French words).
4. **Initial letter**: Lowercase (e.g., `fix(worker): handle null user...` NOT `fix(worker): Handle null user...`), unless it begins with an uppercase acronym (`JWT`, `ARL`, `API`, `URL`, `ID`).
5. **Length**: 50 to 72 characters max. Be concise, precise, and meaningful.
6. **No trailing period**: NEVER end the subject line with a dot (`.`).
7. **No emojis**: Never include emojis (such as 🐛, ✨, 🚀) in the subject.
8. **No vague messages**: Forbid `fix: bugs`, `update: changes`, `wip`, `refactor: clean up`.

### Body Rules (when changes are non-trivial):
- Separate from the subject by exactly ONE blank line.
- Wrap lines at 72 characters.
- Focus on the **WHY** (motivation, problem) and **HOW** (technical approach), not merely repeating what changed in the diff.

### Footer Rules (Breaking Changes):
- Append `!` after type/scope (`feat(auth)!: ...`) AND/OR include a footer block starting with `BREAKING CHANGE: ` (in uppercase, followed by a space) describing what broke and how to migrate.

---

## 3. Allowed Types

| Type | SemVer Impact | Prod Release? | When to Use |
| :--- | :--- | :---: | :--- |
| `feat` | Minor (`+0.1.0`) | **YES** | New user-facing, API, or bot feature. |
| `fix` | Patch (`+0.0.1`) | **YES** | Real bugfix solving broken production or runtime behavior. |
| `perf` | Patch (`+0.0.1`) | **YES** | Measurable performance optimization (memory, CPU, streaming). |
| `refactor`| None | **NO** | Code reorganization without functional changes or bug fixes. |
| `docs` | None | **NO** | Documentation, README, code comments only. |
| `style` | None | **NO** | Formatting, Biome linter, whitespace, commas (no logic change). |
| `test` | None | **NO** | Adding or modifying tests, mocks, or test fixtures. |
| `chore` | None | **NO** | Maintenance, dependencies (`chore(deps)`), internal build scripts. |
| `ci` | None | **NO** | CI/CD pipelines, GitHub Actions workflows, deployment templates. |
| `build` | None | **NO** | Build system, Vite config, tsconfig, bundlers. |

**Forbidden Types**: `hotfix`, `bugfix`, `cleanup`, `feature`, `change`, `wip`, `patch`, `release`.

---

## 4. Scopes by Microservice

Always infer the correct scope based on the staged file paths:

### Cross-Cutting / Root
`deps`, `docker`, `ci`, `config`, `security`, `release`

### LeakRapApi (`LeakRapApi/`)
`auth`, `controller`, `service`, `worker`, `model`, `radar`, `token`, `cache`, `db`, `routes`, `middleware`

### LeakRapBotDiscord (`LeakRapBotDiscord/`)
`commands`, `handlers`, `deezer`, `qobuz`, `queue`, `storage`, `archive`, `zip`, `tagging`, `embed`, `gofile`, `anontransfer`

### LeakRapVue (`LeakRapVue/`)
`ui`, `views`, `stores`, `router`, `api`, `layout`, `styles`

### Gofile & anonTransfer (`Gofile/`, `anonTransfer/`)
`client`, `upload`, `folder`

---

## 5. Examples

### Good Examples:
- `fix(worker): handle null user reference in QobuzTokenCheckerWorker`
- `feat(commands): add discography download queue status tracking`
- `refactor(storage): extract chunk deletion helper in LocalStorageService`
- `chore(deps): update fastify to v5.2.1 and biome to v1.9.4`
- `perf(zip): switch to direct disk write stream for large archives`
- `feat(auth)!: require JWT Bearer header on all API endpoints`

### Bad Examples to Avoid:
- ❌ `Fix bug.` (too short, capital F, trailing dot, no scope, vague)
- ❌ `feat: fix typo and clean up code` (refactor/style mislabeled as feat, triggers release)
- ❌ `fix: update dependencies` (dependency updates must be `chore(deps): ...`)
- ❌ `feat(bot): ✨ Added new button` (contains emoji, past tense, capital A)
- ❌ `chore: WIP on radar` (WIP commits prohibited)
