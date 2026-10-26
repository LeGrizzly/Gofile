# LeakRap Monorepo — GitHub Copilot Custom Instructions

## Repository Overview
LeakRap is a suite of microservices dedicated to music search, automated audio stream extraction (Qobuz Hi-Res, Deezer FLAC/MP3), metadata tagging, and secure file hosting:
- `LeakRapApi`: Fastify v5 + TypeScript backend, MongoDB (Mongoose), autonomous background workers.
- `LeakRapBotDiscord`: Discord bot (TypeScript, Node.js, `discord.js` v14), audio extraction, streaming ZIP packaging, Bee-Queue (DragonflyDB/Redis).
- `LeakRapVue`: Admin dashboard SPA (Vue 3 Composition API `<script setup lang="ts">`, Vite, Pinia, Tailwind CSS v4).
- `Gofile` & `anonTransfer`: Standalone TypeScript upload packages.
- `infra-leakrap`: WireGuard VPN & deployment CI/CD.

---

## Commit Message Generation Instructions (semantic-release & Conventional Commits)

When generating Git commit messages for changes in this repository:
1. **Strictly adhere to Conventional Commits v1.0.0**: `<type>(<scope>): <subject>`.
2. **Prevent accidental releases**:
   - `feat` triggers a **Minor** release (`0.X.0`) and production deployment. Use ONLY for new features.
   - `fix` triggers a **Patch** release (`0.0.X`) and production deployment. Use ONLY for real bugs.
   - If changes are refactoring, code cleanup, or typing improvements, use `refactor` or `chore` to avoid triggering releases.
3. **Format**:
   - Language: English only.
   - Mood: Imperative present tense (`add`, `fix`, `update`, `remove`, `refactor`).
   - Case: Type and scope strictly in lowercase; subject begins with lowercase.
   - Punctuation: **NEVER** add a trailing dot (`.`) at the end of the subject.
   - Length: 50 to 72 characters max.
   - No emojis in the commit header.
4. **Authorized Scopes**:
   - Transverse: `deps`, `docker`, `ci`, `config`, `security`, `release`.
   - `LeakRapApi`: `auth`, `controller`, `service`, `worker`, `model`, `radar`, `token`, `cache`, `db`, `routes`, `middleware`.
   - `LeakRapBotDiscord`: `commands`, `handlers`, `deezer`, `qobuz`, `queue`, `storage`, `archive`, `zip`, `tagging`, `embed`, `gofile`, `anontransfer`.
   - `LeakRapVue`: `ui`, `views`, `stores`, `router`, `api`, `layout`, `styles`.
   - `Gofile` / `anonTransfer`: `client`, `upload`, `folder`.
5. **Detailed instructions**: See `.github/copilot-commit-instructions.md`.
