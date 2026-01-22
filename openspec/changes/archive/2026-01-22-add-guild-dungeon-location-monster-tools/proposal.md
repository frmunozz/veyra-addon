# Change: Guild dungeon location monster tooling

## Why
The wave monster tools already improve filtering and looting, but guild dungeon location pages list alive and dead monsters together with a different DOM layout. Extending the same tooling to `/guild_dungeon_location.php` improves dungeon UX and enables consistent filtering + bulk loot without switching views.

## What Changes
- Mount the existing floating monster tools menu on `/guild_dungeon_location.php` pages.
- Parse monsters from `body > div.wrap > div.grid > div:nth-child(1) > div:nth-child(2)` using `div.mon` (alive) and `div.mon.dead` (dead).
- Persist filters per `location_id` (ignoring `instance_id`) so selections carry across different dungeon instances for the same location.
- Prefix each monster name with an alive/total indicator like `05/10`.
- Add Quick loot + View actions for dead monsters and ensure bulk loot targets only dead monsters on mixed pages.
- Keep wave-only behaviors (gate-info hiding + image toggle) scoped to wave pages.

## Impact
- Affected specs: `wave-monster-tools`
- Affected code: `extension/manifest.json`, `extension/src/content/wave-monster-tools.js`, `extension/src/styles/wave-monster-tools.css`, `docs/README.md`

