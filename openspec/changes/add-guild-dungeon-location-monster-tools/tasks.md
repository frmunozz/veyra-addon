## 1. Implementation
- [x] 1.1 Inject `wave-monster-tools.js` + `wave-monster-tools.css` on `https://demonicscans.org/guild_dungeon_location.php*` via `extension/manifest.json`.
- [x] 1.2 Parse guild dungeon monsters from `div.mon` / `div.mon.dead`, extracting name + monster id, and classifying alive vs dead.
- [x] 1.3 Persist filter selections per `location_id` (shared across different `instance_id` values).
- [x] 1.4 Prefix monster names with alive/total counts like `05/10`.
- [x] 1.5 Add per-card Quick loot + View actions for dead monsters.
- [x] 1.6 Update bulk loot eligibility to target only dead monsters on mixed pages.
- [x] 1.7 Update `docs/README.md` with the new dungeon location tooling behaviors.
- [x] 1.8 Validate specs with `openspec validate add-guild-dungeon-location-monster-tools --strict` and fix any findings.

