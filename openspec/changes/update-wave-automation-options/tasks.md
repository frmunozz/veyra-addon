## 1. Implementation
- [x] 1.1 Extend the wave automation form UI with an attack stamina selector (1/10/50/100/200) plus auto-reload toggle and delay input, defaulting to 50 stamina and 30 seconds.
- [x] 1.2 Persist and restore the new automation fields per wave (enabled state, monster, attack stamina, auto-reload enabled, delay seconds).
- [x] 1.3 Update the automation sequence to click the QOL attack button whose `data-stam` matches the stored attack stamina, and surface errors when missing.
- [x] 1.4 Implement auto-reload scheduling when automation + auto-reload are enabled, reloading N seconds after page load; stop and disable auto-reload when `#stamina_span` is below 100.
- [x] 1.5 Update `extension/src/styles/wave-monster-tools.css` for the new form controls and states.
- [x] 1.6 Update `docs/README.md` to document the new attack selection, auto-reload defaults, stamina cutoff, and selectors used.
- [x] 1.7 Validate specs with `openspec validate update-wave-automation-options --strict` and fix any findings.
