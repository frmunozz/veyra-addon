# Change: Update wave automation attack and reload options

## Why
Wave automation currently hardcodes the QOL attack button and has no reload loop, limiting flexibility and causing manual reloads between waves.

## What Changes
- Add an attack stamina selection to the wave automation form based on the QOL attack buttons (`data-stam` 1/10/50/100/200) and persist the choice per wave.
- Add an auto-reload toggle and delay (seconds) to the wave automation form; default to enabled with 30 seconds and persist per wave.
- Run auto-reload only when wave automation is enabled; stop and disable auto-reload when stamina drops below 100.

## Impact
- Affected specs: `wave-monster-tools`
- Affected code: `extension/src/content/wave-monster-tools.js`, `extension/src/styles/wave-monster-tools.css`, `docs/README.md`
