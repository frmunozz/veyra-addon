## 1. Implementation
- [x] 1.1 Replace the Winter Aurora Festival dropdown definition in `extension/src/content/menu.js` with a 🐀 Lunar Year Event dropdown targeting `/lunar_plague.php` and `/active_wave.php?event=6&wave=3`.
- [x] 1.2 Update progress fetch/log labels and state naming in `extension/src/content/menu.js` to reference Lunar Year Event while preserving the same refresh cadence and fallback (`—/—`) behavior.
- [x] 1.3 Update `docs/README.md` shortcut notes to reflect the new event name, ordering, and URLs.

## 2. Validation
- [x] 2.1 Load `https://demonicscans.org/lunar_plague.php` with the extension enabled and confirm the shortcuts section shows 🐀 Lunar Year Event with a progress sublabel.
- [x] 2.2 Trigger the Lunar Year Event battle link and confirm it navigates to `/active_wave.php?event=6&wave=3`.
- [x] 2.3 Verify that a fetch or parse failure shows `—/—` and logs a concise `[Veyra Addon]` warning.
