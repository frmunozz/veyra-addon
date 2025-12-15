# Change: Nav drawer menu layout updates

## Why
The addon aside currently places the dynamic shortcut dropdowns below favorites/navigation and loads some content asynchronously without a deterministic placeholder. Players also need event-focused shortcuts and at-a-glance Winter Aurora Festival progress during the event.

## What Changes
- Render a deterministic shortcuts-first layout: `🌊 Grakthar Gate Waves` → `🧌 Guild Dungeons` → `🎄 Winter Aurora Festival` → Favorites → Navigation.
- Render the header Home link (`#veyra-addon-aside > div.veyra-addon-aside__header > span > a`) as `🏠` while preserving the `/game_dash.php` destination and accessible labeling.
- Make the `🧌 Guild Dungeons` dropdown deterministic by rendering a disabled `Loading...` row immediately and replacing it with results (or an error/empty state) after fetching `guild_dash.php`.
- Add a `🎄 Winter Aurora Festival` dropdown with a sub-row showing live progress formatted like `78,482/80,000`, sourced by fetching `/a_lizardmen_winter.php` and parsing the current/goal values from the page text, auto-refreshed every ~5 minutes while the addon aside is mounted.
- Include shortcuts inside the Winter dropdown for the festival page (`/a_lizardmen_winter.php`) and `🌊 Carols in the Cold` (`/active_wave.php?event=4&wave=2`).

## Impact
- Affected specs: `nav-drawer`
- Affected code: `extension/src/content/menu.js` (header Home icon, deterministic dropdown states, section ordering, Winter progress fetch/parse), `docs/README.md` (menu ordering notes)
