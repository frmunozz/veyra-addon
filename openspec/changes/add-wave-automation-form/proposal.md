# Change: Add wave QOL automation form for active wave pages

## Why
The `active_wave.php` HTML now includes a QOL panel and filters, and the addon needs a guided automation flow to reduce manual selection while staying compatible with the new structure.

## What Changes
- Add a wave automation form in the wave monster tools panel to select a target monster and enable/disable automation.
- Persist the selected monster and enabled state per wave so reloads can auto-run the sequence.
- When enabled, auto-run the QOL sequence that sets `#fNameSel`, toggles `#fUnjoined`, clicks `#btnSelectVisible`, and clicks the third quick-attack button, surfacing errors on failure.

## Impact
- Affected specs: `wave-monster-tools`
- Affected code: `extension/src/content/wave-monster-tools.js`, `extension/src/styles/wave-monster-tools.css`, `docs/README.md`
