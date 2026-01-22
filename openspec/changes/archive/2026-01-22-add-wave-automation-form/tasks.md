## 1. Implementation
- [x] 1.1 Add automation form UI to the wave monster tools panel with a monster select, enable toggle, and status line.
- [x] 1.2 Persist enabled state and selected monster per wave (gate/wave or event/wave) and restore on load.
- [x] 1.3 Implement sequential auto-run on `active_wave.php`: set `#fNameSel`, toggle `#fUnjoined` off/on, click `#btnSelectVisible`, click the third QOL attack button; run once per load and stop on failure.
- [x] 1.4 Surface errors in the form and console with `[Veyra Addon]`, including the failing step and selector.
- [x] 1.5 Update `extension/src/styles/wave-monster-tools.css` for prefixed automation form styling.
- [x] 1.6 Update `docs/README.md` to document the wave automation behavior and selectors used.
- [x] 1.7 Validate specs with `openspec validate add-wave-automation-form --strict` and fix any findings.
