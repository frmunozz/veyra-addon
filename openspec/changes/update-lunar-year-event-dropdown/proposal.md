# Change: Replace Winter Aurora Festival shortcut with Lunar Year Event

## Why
The Winter Aurora Festival shortcut is no longer relevant, and the current event now lives under the Lunar Year flow. The addon should surface the correct event entry and progress for players.

## What Changes
- Replace the Winter Aurora Festival shortcuts dropdown with a 🐀 Lunar Year Event dropdown.
- Point the event page to `/lunar_plague.php` and the battle shortcut to `/active_wave.php?event=6&wave=3`.
- Keep the same progress/refresh behavior as the previous event (fetch the event page with credentials, parse current/goal text, refresh about every 5 minutes).

## Impact
- Affected specs: `specs/nav-drawer/spec.md` (new event dropdown requirement).
- Affected code: `extension/src/content/menu.js` (event dropdown + progress fetch), `docs/README.md` (shortcut ordering and event notes).
