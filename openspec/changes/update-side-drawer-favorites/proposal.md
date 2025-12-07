# Change: Side drawer favorites and dynamic sections

## Why
Users need faster navigation inside the Veyra side drawer; the current menu mixes seasonal items, lacks quick access to key pages, and forces scrolling to reach often-used links.

## What Changes
- Remove decorative entries (side title, Halloween event) and visually separate the Hole item from other links.
- Add a favorites band where any menu option (including dropdown items) can be starred; starring moves the item into favorites without triggering navigation.
- Insert new destinations: Legendary Forge and Adventurers Guild; add a Grakthar Gate Waves dropdown with Wave 3/2/1 links.
- Add a Guild Dungeons dropdown populated from `guild_dash.php` “Open Dungeons”; include Enter links with favoriting and fail gracefully if the markup or request changes.
- Keep behavior resilient: if DOM hooks or fetches fail, abort addon injection and let the page show the default drawer.

## Impact
- Affected specs: nav-drawer
- Affected code: `extension/src/content/content.js`, `extension/src/styles/content.css`, `extension/src/lib/*` (helpers as needed)
