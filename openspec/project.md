# Project Context

## Purpose
Minimalist Chrome extension that injects a lightweight helper layer into the Veyra web game on `https://demonicscans.org/*`. Goals: tighten UI/UX with a toolbar and shortcuts, mirror existing REST calls to reduce clicks/latency, and keep permissions lean while observing how the game behaves.

## Tech Stack
- Chrome Extension Manifest V3 (content script–first, optional background service worker)
- Vanilla JavaScript (ES2020+), no bundler/build pipeline
- Injected CSS scoped to the content script (`src/styles/content.css`)
- Browser `fetch` with `credentials: "include"` for mirroring site requests

## Project Conventions

### Code Style
- Plain JS modules with small, composable functions; avoid dependencies/frameworks
- Prefix DOM/CSS with `veyra-addon-*`; keep UI minimal and lightweight
- Log with `[Veyra Addon]` and keep console noise low
- Store tiny, page-agnostic helpers in `extension/src/lib/`; prefer early returns and clear constants (e.g., `ROOT_ID`, state flags)

### Architecture Patterns
- Start in the content script for all UI and REST interactions; only add `background/service-worker.js` when cross-tab state/caching or request rules are required
- Patch `fetch`/XHR only when needed and always preserve original behavior (clone responses when logging)
- No build tooling—JS and CSS are referenced directly from `manifest.json`
- Mirror existing game endpoints instead of inventing new backend flows

### Testing Strategy
- Manual verification in the browser: refresh the game page after content script changes; reload the extension when `manifest.json` changes
- Use DevTools Network/Console to confirm `[Veyra Addon]` logs, toolbar rendering, keyboard shortcuts, and mirrored REST calls
- No automated tests or CI at this stage

### Git Workflow
- Keep changes small and focused; align feature work with OpenSpec change proposals when introducing new capabilities
- Favor concise commits/branches that map to tasks; avoid rewriting history on shared work

## Domain Context
- Targets the Veyra game hosted on `demonicscans.org`; common query params include `gate` and `wave` (e.g., `/active_wave.php?gate=X&wave=Y`)
- Early UI surface is a fixed toolbar and keyboard shortcuts for navigation/actions; future phases explore prefetching/caching of common REST responses
- Permissions are minimal (`host_permissions` for the site; no extra permissions yet) and should stay tightly scoped

## Important Constraints
- Avoid heavy DOM overrides; keep injected UI isolated via prefixed selectors and minimal styling
- Preserve page behavior when observing network traffic (clone responses, do not block/hijack unless required)
- Keep permissions lean and documented; request new permissions only with justification
- Maintain lightweight footprint (no bundler, no third-party dependencies)

## External Dependencies
- Veyra game backend endpoints on `https://demonicscans.org/*` (e.g., `active_wave.php` and other REST calls observed in Network)
- Chrome extension runtime (Manifest V3 APIs) for content/background scripts
