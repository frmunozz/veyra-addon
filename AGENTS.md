<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# Agent Playbook

Shared playbook for anyone touching the Veyra Chrome extension (`https://demonicscans.org/*`).

## Mission and guardrails
- Build a minimal, fast DOM/UI layer that improves Veyra UX without breaking existing behavior.
- Mirror or optimize existing REST calls; do not invent backend assumptions.
- Keep permissions lean; only add what a feature needs and justify it.

## How to work (checklist)
- Start in the content script; add a background worker only if you truly need cross-tab state/caching/rules.
- No build pipeline: write plain JS/CSS referenced directly from `manifest.json`.
- When logging network data, clone responses so page logic stays intact.
- Keep helpers tiny and dependency-free in `extension/src/lib/`.
- Prefix DOM/CSS with `veyra-addon-*`; avoid global overrides.
- Log with `[Veyra Addon]` and stay concise.

## When you pick up a task
- Read `docs/README.md` for known endpoints/assumptions; update it as you learn more.
- Prototype in `extension/src/content/content.js`; refresh the page to test. Reload the extension only after manifest changes.
- If you change permissions or add background logic, note it in docs and keep scope minimal.
- Update this playbook when you introduce a new convention others must follow.

## Quick defaults
- JavaScript: vanilla ES2020+, short composable functions; avoid frameworks.
- CSS: scoped selectors with the project prefix; keep styles light.
- Networking: `credentials: "include"` when mirroring site requests; avoid blocking/hijacking unless required.

## Documentation hooks
- Log every discovered endpoint (method, URL, payload, response shape, trigger) in `docs/README.md`.
- Capture UX experiments, shortcuts, and toolbar behaviors as they change.
