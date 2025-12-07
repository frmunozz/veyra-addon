## 1. Implementation
- [ ] 1.1 Capture the existing side drawer structure and mount point; add defensive guards so the addon bails out if selectors or events change.
- [ ] 1.2 Implement favorites state (persisted locally) with star icons that move items to a favorites band without triggering navigation.
- [ ] 1.3 Remove decorative entries (side title, Halloween event) and separate the Hole item from the rest; insert static links for Legendary Forge and Adventurers Guild.
- [ ] 1.4 Add a Grakthar Gate Waves dropdown with Wave 3/2/1 links, all favoritable.
- [ ] 1.5 Fetch and parse Open Dungeons from `guild_dash.php`; render a Guild Dungeons dropdown with favoritable entries and safe fallbacks on fetch/DOM changes.
- [ ] 1.6 Apply scoped styling for favorites spacing, Hole separation, and dropdown affordances.

## 2. Documentation & Validation
- [ ] 2.1 Record the `guild_dash.php` Open Dungeons behavior and new menu links in `docs/README.md`.
- [ ] 2.2 Run `openspec validate update-side-drawer-favorites --strict` and resolve any findings.
- [ ] 2.3 Manual sanity check on `game_dash.php` with the extension enabled/disabled to confirm graceful failure modes.
