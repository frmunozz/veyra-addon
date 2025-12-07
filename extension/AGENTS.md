# Agent Playbook (Extension)

## Scope and defaults
- Content script (`src/content/content.js`) is the primary surface for UI + REST interactions.
- Background worker (`src/background/service-worker.js`) stays empty until cross-tab state/caching/rules are needed.
- No bundler; plain JS/CSS referenced from `manifest.json`.

## Conventions
- Prefix DOM/CSS with `veyra-addon-*`; avoid touching unrelated page styles.
- Log with `[Veyra Addon]`, keep it brief.
- Use `credentials: "include"` when mirroring site requests; do not block/alter page fetches unless required.
- Patch `fetch`/`XMLHttpRequest` only when necessary, and always preserve original behavior.

## Daily moves
- Prototype toolbar/shortcuts in `content.js`; sync styling in `styles/content.css`.
- Store tiny, dependency-free helpers in `src/lib/`.
- If you add permissions or background logic, document the change in `docs/README.md` and keep it minimal.
