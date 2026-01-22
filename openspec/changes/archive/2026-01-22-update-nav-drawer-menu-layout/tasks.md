## 1. Implementation
- [x] 1.1 Update the header Home anchor (`#veyra-addon-aside > div.veyra-addon-aside__header > span > a`) to display `🏠` while preserving the `/game_dash.php` destination and accessible labeling.
- [x] 1.2 Reorder section rendering to: Shortcuts (🌊 Grakthar Gate Waves → 🧌 Guild Dungeons → 🎄 Winter Aurora Festival) → Favorites → Navigation, keeping the Hole link visually separated within Navigation.
- [x] 1.3 Make the 🧌 Guild Dungeons dropdown deterministic: render immediately with a disabled `Loading...` row; replace it with parsed entries from `guild_dash.php` (or a disabled error row / empty-state row) once the fetch completes.
- [x] 1.4 Add a 🎄 Winter Aurora Festival dropdown in Shortcuts that shows a second sub-row with progress (formatted like `78,482/80,000`) sourced from `/a_lizardmen_winter.php`, auto-refreshes that progress every ~5 minutes while the addon aside is mounted, and includes shortcuts for the festival page plus `🌊 Carols in the Cold` (`/active_wave.php?event=4&wave=2`).
- [x] 1.5 Update `docs/README.md` to reflect the new ordering and Winter dropdown/progress behavior.
- [x] 1.6 Validate specs with `openspec validate update-nav-drawer-menu-layout --strict` and fix any findings.
