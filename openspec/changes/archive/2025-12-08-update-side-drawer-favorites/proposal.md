# Change: Side drawer favorites and dynamic sections

## Why
Users need faster navigation inside the Veyra side drawer; after replacing the native drawer with our own addon aside, we need favorites and shortcuts that live inside our UI while keeping the native fallback safe.

## What Changes
- Extend the addon nav aside (per `nav-drawer` spec) with a favorites band where any menu option (including dropdown items) can be starred; starring duplicates the item into favorites without triggering navigation and shows gold stars in both copies.
- Compose the addon menu to omit decorative native-only entries (side title, Halloween event), visually separate the Hole item, place the Home control in the header, add a footer "Veyra addon Menu" tag, and insert static links for Legendary Forge (✨) and Adventurers Guild (🏤).
- Make navigation and shortcuts sections collapsible and add a Grakthar Gate Waves dropdown (🌊) with prefixed "Grakthar - Wave 3/2/1" links that can be collapsed.
- Add a Guild Dungeons dropdown (🧌) populated from `guild_dash.php` “Open Dungeons” with names extracted from the provided containers, include Enter links with favoriting, and fail gracefully if the markup or request changes.
- Keep behavior resilient: if the addon aside cannot mount or DOM hooks/fetches fail, log once and fall back to the native drawer untouched.

## Impact
- Affected specs: nav-drawer
- Affected code: `extension/src/content/content.js`, `extension/src/styles/content.css`, `extension/src/lib/*` (helpers as needed)
