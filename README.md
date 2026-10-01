# Translaty

**A fast desktop translation toolbox for text, clipboard, subtitles and localization files.**

Translaty is a local-first Tauri application for the translation work that happens between dedicated CAT tools: a quick message, copied text, an SRT file, or a JSON locale. Its shared translation pipeline batches strings, removes duplicates, protects placeholders, and reuses previous results before calling a provider.

> Early MVP: the React application and translation core are usable now. Desktop packaging requires a local Rust toolchain.

## What it does

- **Quick Translate** — source detection, language swapping, four concise tone modes, copy, clear, loading, and error states.
- **Clipboard Translate** — `Ctrl/Cmd + Shift + T`, clipboard read/translate, copy or replace, and tray-ready desktop integration.
- **Subtitle Translate** — SRT and WebVTT parsing, batched dialogue translation, progress/cancel, preview, and export without sending timestamps.
- **i18n Translate** — nested JSON value traversal, placeholder protection, deduplication, diff preview, and export. Keys are never translated.
- **Translation Memory** — SQLite in Tauri and an in-memory browser adapter; successful results are reused locally.
- **Glossary** — manual terms plus JSON/CSV import; only terms relevant to the current batch enter the provider prompt.
- **Provider choice** — an offline deterministic demo and an opt-in OpenAI-compatible endpoint.

## Clipboard workflow

```text
Copy text → Ctrl/Cmd + Shift + T → translate → Copy / Replace clipboard / Open app
```

The desktop build registers the shortcut through Tauri. The browser preview provides a **Read clipboard now** button so the workflow remains testable without native APIs.

## File workflows

Subtitles are parsed into cue text and structural metadata. Only cue text reaches the translation pipeline; serialization restores the original cue identifiers, timestamps, ordering, line endings, VTT headers, and metadata blocks.

JSON locale files are traversed recursively. String values are translated while keys, nesting, arrays, numbers, booleans, and nulls remain unchanged. Common placeholders such as `{{name}}`, `{0}`, `%s`, `${name}`, line breaks, and HTML tags are validated before a result is accepted or cached.

## Architecture

```text
React feature UI
      ↓
TranslationService
      ↓
protect → deduplicate → memory lookup → token-aware batches
      ↓                                      ↓
 restore + validate ← map results by ID ← provider
```

Business logic is independent from React under `src/translation`. Native capabilities stay behind official Tauri plugins. See [Architecture](docs/ARCHITECTURE.md), [Roadmap](docs/ROADMAP.md), and [Tasks](docs/TASKS.md).

## Development

Prerequisites:

- Node.js 20 or newer
- npm 10 or newer
- For the desktop app: the [Tauri 2 prerequisites](https://v2.tauri.app/start/prerequisites/), including Rust and platform build tools

```bash
npm install
npm run dev
```

Run the desktop shell after installing Rust:

```bash
npm run tauri dev
```

Quality commands:

```bash
npm run lint
npm run typecheck
npm test
npm run format:check
npm run build
```

Build platform installers with `npm run tauri build`. Tauri supports Windows, macOS, and Linux; installers must be built on the target platform.

## Provider setup

The local demo provider is selected by default and sends nothing over the network. To use an OpenAI-compatible service, open **Settings**, select the provider, then enter its base URL, model, and API key. The MVP keeps the API key in process memory only—it is not persisted or committed.

Copy `.env.example` only for non-secret endpoint/model defaults. Never put API keys in Vite environment variables because those values are bundled into frontend code.

## Privacy

- No telemetry.
- Translation history and memory stay on the device.
- The demo provider is fully local.
- A remote provider receives only strings that missed translation memory; file structure and timestamps are excluded.
- API keys are not logged or persisted by the frontend.

## Roadmap

Next priorities are YAML locale files, OS-keychain credentials, dedicated DeepL/Google adapters, folder batches, local model support, and richer translation review. See the [roadmap](docs/ROADMAP.md) for phases.

## Contributing

Open an issue before a large architectural change. Keep translation logic outside React components, add focused tests for parsers and mapping behavior, run all quality commands, and use Conventional Commits.

## License

No license has been selected yet. Add one before distributing binaries or accepting external contributions.
