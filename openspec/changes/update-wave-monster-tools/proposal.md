# Change: Active wave page tooling improvements

## Why
The current wave monster tools improve filtering and looting, but a few UX gaps remain: the page has extra clutter, filters cannot hide everything, bulk loot retries already-looted monsters, and the menu lacks quick controls for common actions.

## What Changes
- Hide the native gate info block (`body > div.gate-info`) on detected active wave pages.
- Add a checkbox in the wave tools panel to hide/show monster images identified by `.monster-img`.
- Add "hide all" and "show all" buttons in the Filter monsters title row (`#veyra-addon-wave-panel > div:nth-child(1) > div.veyra-addon-wave-section__title`).
- Allow filter selections to be empty (hide all monsters), instead of forcing at least one type selected.
- Update Bulk loot controls to include quick buttons for `1`, `5`, `10`, `15`, and `all`, plus a custom count input below them, including a confirm prompt before running `all` and a Stop control while a run is active.
- Make bulk loot skip monsters already looted in the current page session (not persisted across reloads) so successive runs continue with remaining unlooted monsters.
- Show per-type counts in filter labels (e.g. `[05] Monster Name`), padding to two digits for counts under 100.

## Impact
- Affected specs: `wave-monster-tools`
- Affected code: `extension/src/content/wave-monster-tools.js`, `extension/src/styles/wave-monster-tools.css`, `docs/README.md`
