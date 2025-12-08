# Navigation addon notes

## Favorites and layout
- Favorites live in the addon aside and persist via `localStorage["veyraAddonFavorites"]`; starring any link moves it to the favorites band without navigating.
- The addon aside only mounts when `#sideDrawer` and `#nav_fab` are present; otherwise it logs once and leaves the native drawer untouched.
- The Hole link is separated from the rest of navigation, followed by static and dropdown shortcuts.

## Menu shortcuts
- Static links: Legendary Forge (`/legendary_forge.php`) and Adventurers Guild (`/adventurers_guild.php`).
- Grakthar Gate Waves dropdown: `/active_wave.php?gate=3&wave=8|5|3` (favoritable children).
- Guild Dungeons dropdown: populated from Open Dungeons on `/guild_dash.php` with `credentials: "include"`.
  - Parse the region after the "Open Dungeons" `h2`, collecting `a[href*="guild_dungeon_instance"]` entries and using nearby card titles for names.
  - On fetch failure or missing section, log a warning and skip the dropdown; when no entries exist, render an empty state row instead.
