## 1. Implementation
- [x] 1.1 Wire favorites/dynamic injection into the addon-managed navigation aside (`veyra-addon-*`) and gate initialization on the nav-drawer toggle/root; bail out cleanly to the native drawer when the addon aside is unavailable.
- [x] 1.2 Implement favorites state (persisted locally) with star icons that move items to a favorites band in the addon aside without triggering navigation.
- [x] 1.3 When composing addon menu items, omit decorative entries (side title, Halloween event) and separate the Hole item from the rest; insert static links for Legendary Forge and Adventurers Guild.
- [x] 1.4 Add a Grakthar Gate Waves dropdown inside the addon aside with Wave 3/2/1 links, all favoritable.
- [x] 1.5 Fetch and parse Open Dungeons from `guild_dash.php`; render a Guild Dungeons dropdown with favoritable entries and safe fallbacks on fetch/DOM changes without breaking the addon aside or native fallback.
- [x] 1.6 Apply scoped styling for favorites spacing, Hole separation, and dropdown affordances inside the addon aside.
- [x] 1.7 Keep starred items visible in their source lists with gold star indicators while duplicating them into favorites.
- [x] 1.8 Place the Home control in the addon aside header, remove the "Veyra Addon Menu" header label, and add a footer tag with "Veyra addon Menu".
- [x] 1.9 Add icons for Legendary Forge (✨), Adventurers Guild (🏤), Grakthar Gate Waves (🌊), and Guild Dungeons (🧌) entries.
- [x] 1.10 Make the Navigation and Shortcuts sections collapsible and ensure wave/dungeon dropdown headers reliably toggle without navigation.
- [x] 1.11 Prefix wave labels with "Grakthar - " and parse Guild Dungeon names from the specified containers before rendering.

## 2. Documentation & Validation
- [x] 2.1 Record the `guild_dash.php` Open Dungeons behavior and new menu links in `docs/README.md`.
- [x] 2.2 Run `openspec validate update-side-drawer-favorites --strict` and resolve any findings.
- [x] 2.3 Manual sanity check on `game_dash.php` with the addon aside open/closed and native fallback to confirm graceful failure modes.
