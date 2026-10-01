# Translaty Tasks

## TRANS-100 — Application foundation

- **Priority:** P0
- **Dependencies:** None
- **Scope:** Vite/React/Tauri, quality tools, architecture docs, app shell.
- **Files:** root config, `src/app`, `src-tauri`, `docs`.
- **Acceptance criteria:** App builds; lint/typecheck/test pass; Tauri config is valid.
- **Tests:** `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
- **Status:** Done (desktop compile pending local Rust toolchain)

## TRANS-110 — Translation core and batching

- **Priority:** P0
- **Dependencies:** TRANS-100
- **Scope:** Provider contract, placeholder engine, deduplication, token-aware batches, memory hooks.
- **Files:** `src/translation`, `src/storage`, core tests.
- **Acceptance criteria:** Stable ID mapping; placeholders validated; duplicates translated once.
- **Tests:** Core Vitest suite.
- **Status:** Done

## TRANS-120 — Quick Translate

- **Priority:** P0
- **Dependencies:** TRANS-110
- **Scope:** Text translation workspace and provider/settings controls.
- **Files:** `src/features/quick-translate`, app composition.
- **Acceptance criteria:** Modes, swap, copy, clear, loading, and errors work.
- **Tests:** Component smoke tests and typecheck.
- **Status:** Done

## TRANS-130 — Subtitle Translation

- **Priority:** P0
- **Dependencies:** TRANS-110
- **Scope:** SRT/VTT parse, translate text only, preview, progress, and export.
- **Files:** `src/features/subtitle`, parser tests.
- **Acceptance criteria:** Timing/order/metadata round-trip; multiline cues supported.
- **Tests:** SRT and VTT fixtures.
- **Status:** Done

## TRANS-140 — i18n JSON Translation

- **Priority:** P0
- **Dependencies:** TRANS-110
- **Scope:** JSON traversal, value mapping, diff preview, and export.
- **Files:** `src/features/i18n`, traversal tests.
- **Acceptance criteria:** Keys and non-string values are unchanged; nested strings translate.
- **Tests:** Nested JSON and duplicate-value fixtures.
- **Status:** Done

## TRANS-150 — Clipboard desktop integration

- **Priority:** P0
- **Dependencies:** TRANS-100, TRANS-110
- **Scope:** Clipboard read/write, global shortcut, compact view, native permissions.
- **Files:** `src/features/clipboard`, `src-tauri`.
- **Acceptance criteria:** Shortcut reads text, translates, and offers copy/replace/open actions.
- **Tests:** Browser fallback tests; manual Tauri smoke test.
- **Status:** Done (manual desktop smoke test pending local Rust toolchain)

## TRANS-160 — Translation memory, history, and glossary

- **Priority:** P1
- **Dependencies:** TRANS-110
- **Scope:** SQLite memory, recent history, focused glossary entries/import.
- **Files:** `src/storage`, `src/features/settings`, `src-tauri` migrations.
- **Acceptance criteria:** Hits avoid provider calls; failures are not cached.
- **Tests:** Repository contract and orchestration tests.
- **Status:** Done for memory/history/glossary MVP

## TRANS-190 — Release quality

- **Priority:** P0
- **Dependencies:** TRANS-120..160
- **Scope:** Integration QA, documentation, packaging notes.
- **Files:** all, `README.md`.
- **Acceptance criteria:** Quality gates pass and public README is usable.
- **Tests:** Full quality suite and desktop build where toolchain is available.
- **Status:** Done for frontend quality gates; native bundle pending Rust toolchain
