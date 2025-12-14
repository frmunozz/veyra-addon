# Navigation addon notes

## Favorites and layout
- Favorites live in the addon aside and persist via `localStorage["veyraAddonFavorites"]`; starring any link moves it to the favorites band without navigating.
- The addon aside only mounts when `#sideDrawer` and `#nav_fab` are present; otherwise it logs once and leaves the native drawer untouched.
- Layout order: Shortcuts (dropdowns) → Favorites → Navigation. The Hole link is shown inside Navigation with a visual separator.

## Menu shortcuts
- Shortcuts dropdown order: 🌊 Grakthar Gate Waves → 🧌 Guild Dungeons → 🎄 Winter Aurora Festival.
- Static links: Legendary Forge (`/legendary_forge.php`) and Adventurers Guild (`/adventurers_guild.php`).
- Grakthar Gate Waves dropdown: `/active_wave.php?gate=3&wave=8|5|3` (favoritable children).
- Guild Dungeons dropdown: populated from Open Dungeons on `/guild_dash.php` with `credentials: "include"`.
  - Parse the region after the "Open Dungeons" `h2`, collecting `a[href*="guild_dungeon_instance"]` entries and using nearby card titles for names.
  - Renders deterministically with a disabled `Loading...` row and replaces it with results, an error row, or an empty state row once the fetch completes.
- Winter Aurora Festival dropdown: includes shortcuts for `/a_lizardmen_winter.php` and `🌊 Carols in the Cold` (`/active_wave.php?event=4&wave=2`).
  - Shows progress like `78,482/80,000` by fetching `/a_lizardmen_winter.php` with `credentials: "include"` and parsing the kill/goal text from the page.
  - Auto-refreshes progress about once every 5 minutes while the addon aside is mounted; on fetch/parse failure the progress shows `—/—` and logs a warning.

## Wave monster tools
- Wave pages detected via `.monster-container` cards or `#toggleDeadBtn`; monster names come from `body > div.monster-container > div:nth-child(1) > h3`.
- Dead monsters surface a floating "Wave Tools" menu (top-right) with filter checkboxes (hides non-selected cards via `display: none`) and bulk loot controls when cookie `hide_dead_monsters=0`.
- Bulk loot requests `GET /loot.php?id={monsterId}` with `credentials: "include"`, spaced by ~500ms, only for currently visible cards; failures are skipped and counted.
- Per-card loot/View actions replace the dead-monster CTA; single loot also calls `loot.php?id=...` and renders a modal with items/rewards from the response (items expected to include `ITEM_ID`, optional `ITEM_IMAGE`, counts).
- Bulk loot aggregates items by `ITEM_ID` and sums rewards (EXP/Gold) into a single summary modal; modals close via the X control or backdrop.
