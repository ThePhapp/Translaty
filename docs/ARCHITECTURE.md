# Translaty Architecture

Translaty is a Tauri 2 desktop application with a React/TypeScript interface. Translation logic is framework-independent and lives under `src/translation`; UI features consume it through small services.

## Modules

- `src/app`: composition, navigation, global settings, and desktop lifecycle.
- `src/components`: reusable presentational controls.
- `src/features`: Quick Translate, Clipboard, Subtitle, and i18n workflows.
- `src/translation/core`: provider contracts and orchestration.
- `src/translation/providers`: replaceable provider implementations.
- `src/translation/batching`: normalization, deduplication, token-aware batching, and ID mapping.
- `src/translation/placeholders`: extraction, restoration, and validation.
- `src/storage`: settings, history, and translation-memory persistence.
- `src-tauri`: native window, shortcut, clipboard, and SQLite capabilities.

## Translation flow

```text
feature input -> collect strings -> protect placeholders -> normalize/deduplicate
  -> translation-memory lookup -> batch misses -> provider -> validate/restore
  -> cache successes -> map results to original locations -> export
```

Providers implement a small contract and never reach into React state. MyMemory provides no-key translation for short text, a deterministic offline preview supports UI development, and the OpenAI-compatible provider handles configurable endpoints with a session-only API key. Preview output is never added to translation memory.

## Data and security

Settings without secrets are stored locally. Translation memory uses SQLite in Tauri and an in-memory implementation in browser tests. API keys are never committed or persisted by the web layer. Content is sent only when the selected provider requires it; the demo provider stays entirely local. No telemetry is included.

## Native boundary

The frontend uses official Tauri plugins for clipboard, global shortcuts, dialogs, and SQLite. Browser capability checks keep the UI testable without native APIs. Native commands remain thin; parsing and translation behavior is portable TypeScript.
