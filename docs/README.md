# Navigation addon notes

## Favorites and layout
- Favorites live in the addon aside and persist via `localStorage["veyraAddonFavorites"]`; starring any link moves it to the favorites band without navigating.
- The addon aside only mounts when `#sideDrawer` and `#nav_fab` are present; otherwise it logs once and leaves the native drawer untouched.
- Layout order: Shortcuts (dropdowns) → Favorites → Navigation. The Hole link is shown inside Navigation with a visual separator.

## Menu shortcuts
- Shortcuts dropdown order: 🌊 Grakthar Gate Waves → 🧌 Guild Dungeons → 🐀 Lunar Year Event.
- Static links: Legendary Forge (`/legendary_forge.php`) and Adventurers Guild (`/adventurers_guild.php`).
- Grakthar Gate Waves dropdown: `/active_wave.php?gate=3&wave=8|5|3` (favoritable children).
- Guild Dungeons dropdown: populated from Open Dungeons on `/guild_dash.php` with `credentials: "include"`.
  - Parse the region after the "Open Dungeons" `h2`, collecting `a[href*="guild_dungeon_instance"]` entries and using nearby card titles for names.
  - Renders deterministically with a disabled `Loading...` row and replaces it with results, an error row, or an empty state row once the fetch completes.
- Lunar Year Event dropdown: includes shortcuts for `/lunar_plague.php` and `🌊 Battle Wave 3` (`/active_wave.php?event=6&wave=3`).
  - Shows progress like `164,423/250,000` by fetching `/lunar_plague.php` with `credentials: "include"` and parsing the culled/goal text from the page.
  - Auto-refreshes progress about once every 5 minutes while the addon aside is mounted; on fetch/parse failure the progress shows `—/—` and logs a warning.

## Wave monster tools
- Wave pages detected via `.monster-card` entries, `#toggleDeadBtn`, or an allowlist of gate wave URLs; when detected the addon hides `body > div.gate-info` to reduce clutter.
- Floating Wave Tools menu (top-right) includes:
  - Filter checkboxes labeled like `[05] Monster Name` (counts padded to 2 digits under 100).
  - "hide all" / "show all" buttons; selecting 0 types hides all monster cards (no auto-restore).
  - A "Show monster images" checkbox that hides/shows `.monster-img` elements.
  - Filter selections persist per wave page via `localStorage["veyra-addon-wave-filters:${pathname}?${search}"]` and are shared between alive/dead views.
- Wave automation form mounts on `active_wave.php` pages that include `#waveQolPanel` + `#fNameSel`, persists per gate/wave or event/wave (monster, attack stamina, auto-reload toggle + delay), and runs once on load when enabled:
  - Sets `#fNameSel` to the stored monster value.
  - Toggles `#fUnjoined` off then on.
  - Clicks `#btnSelectVisible` and the QOL attack button under `#waveQolPanel > div.qol-top > div.qol-attacks` matching the selected `data-stam` (defaults to 50).
  - Auto-reload defaults to enabled with a 30s delay and runs only when automation is enabled; if `#stamina_span` is below 100, auto-reload is disabled, persisted, and the checkbox is disabled.
- Dead monsters (`hide_dead_monsters=0`) enable bulk loot controls with quick buttons (1/5/10/15/all) + a custom count input; "all" prompts for confirmation and an in-progress run shows a Stop button.
- Looting calls `POST /loot.php` with form-encoded `monster_id` + `user_id` (from `demon`/`user_id` cookies), `credentials: "include"`, spaced by ~500ms; bulk loot shows a progress badge and aggregates results into one modal.
- Bulk loot skips monsters already successfully looted in the current page session (tracked in-memory across quick loot + bulk loot; resets on reload).

## Guild dungeon location monster tools
- On `/guild_dungeon_location.php?instance_id=…&location_id=…`, the same floating tools menu mounts and filters monsters found under `.wrap .grid .mon` (alive) and `.wrap .grid .mon.dead` (dead).
- Filter selections persist per location via `localStorage["veyra-addon-wave-filters:/guild_dungeon_location.php:location_id={location_id}"]` (shared across different `instance_id` values).
- Monster name rows are prefixed with `[AA/TT]` (alive/total) per monster name, padded to two digits under 100 (e.g., `[05/10]`).
- Dead monsters get Quick loot + View buttons and bulk loot processes only visible dead monsters (skipping already-looted ids for the current session).
- Looting uses `POST /dungeon_loot.php` with form-encoded `dgmid`, `instance_id`, and `user_id` (from `demon`/`user_id` cookies when available).
