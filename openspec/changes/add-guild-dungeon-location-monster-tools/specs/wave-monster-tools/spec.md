## MODIFIED Requirements
### Requirement: Wave monster page detection and filtering
The addon SHALL detect wave monster lists (via `.monster-card` entries, known wave URLs, or the `#toggleDeadBtn` marker) and guild dungeon location monster lists (via `.wrap .grid .mon` entries) and expose a floating (top-right, toggleable) filter UI that hides monsters by name, with page-appropriate convenience controls.

#### Scenario: Detect wave/dungeon pages and bail cleanly
- **WHEN** the page is not a detected wave list and contains no dungeon location monster list markers (`div.mon` entries in the expected container)
- **THEN** the addon skips rendering the filter/loot UI and leaves the page untouched while logging a single `[Veyra Addon]` warning

#### Scenario: Render monster filters with counts and convenience actions
- **WHEN** monster entries are present (wave cards or dungeon `div.mon` entries)
- **THEN** the addon extracts monster names (and ids when available), deduplicates names, and renders a `veyra-addon-*` multi-select control within a floating menu placed below the header on the top-right, with all names preselected by default
- **AND** each option label includes a count prefix formatted as `[NN] {monster name}`, where `NN` is the number of matching monsters in the current view and is padded to two digits for counts under 100
- **AND** the Filter monsters section title row includes "hide all" and "show all" buttons that clear/select all checkboxes and immediately apply filtering
- **AND** toggling the checkboxes shows only the selected monsters and hides non-selected ones without deleting them from the DOM; when all names are deselected the addon hides all monsters and does not auto-restore selection
- **AND** wave page filter choices persist per `pathname?search` and are shared between dead/alive views
- **AND** dungeon location page filter choices persist per `location_id` and are shared across different `instance_id` values

#### Scenario: Toggle monster images (wave only)
- **WHEN** the user toggles the wave tools images checkbox on a wave page
- **THEN** the addon hides or shows monster images identified by the `.monster-img` class (e.g., via `display: none`) without removing them from the DOM
- **AND** dungeon location pages do not render the images checkbox

#### Scenario: Hide gate info clutter (wave only)
- **WHEN** the wave tools UI initializes on a detected wave page
- **THEN** the addon hides `body > div.gate-info` (if present) to reduce clutter while leaving dungeon location pages untouched

#### Scenario: Show alive/total counts on dungeon locations
- **WHEN** the tools UI initializes on a dungeon location page with both alive and dead monsters present
- **THEN** the addon prefixes each monster name with an `[AA/TT]` indicator representing alive/total counts for that monster name (e.g., `[05/10]`)

### Requirement: Dead monster bulk looting and aggregation
The addon SHALL enable bulk looting for dead monsters, operating only on currently visible (unhidden), dead, and unlooted monsters and summarizing results, with controls surfaced in the floating menu.

#### Scenario: Enable bulk loot controls with quick buttons and custom count
- **WHEN** bulk loot is available (wave page with `hide_dead_monsters=0`, or a dungeon location page where dead monsters are present alongside alive monsters)
- **THEN** the addon renders quick bulk loot buttons for `1`, `5`, `10`, `15`, and `all` inside the floating menu
- **AND** the addon renders a custom numeric input below the quick buttons for specifying an arbitrary bulk loot count
- **AND** starting bulk loot processes the first N eligible visible dead monsters in sequence, capping N to the number of eligible monsters, skipping any monsters hidden by the filter, and treating `all` as all eligible monsters
- **AND** filter controls are locked (disabled) during bulk loot and re-enabled when the run finishes or aborts
- **AND** starting `all` requires a confirmation prompt before the run begins, and an in-progress run exposes a Stop control that cancels additional requests after the current monster finishes

#### Scenario: Bulk loot unavailable when dead monsters hidden (wave only)
- **WHEN** `hide_dead_monsters` is not `0` on a detected wave page
- **THEN** the bulk loot section shows only a dead-monsters-hidden message and no input/buttons, while a footer toggle remains available to flip the cookie and reload to show dead monsters

#### Scenario: Per-card dead monster quick actions
- **WHEN** dead monsters are displayed
- **THEN** the addon renders Quick loot + View actions for dead monsters so a user can loot without leaving the page
- **AND** on wave pages, the addon replaces the native dead-monster CTA with the Quick loot + View action row
- **AND** on dungeon location pages, the addon appends the Quick loot + View action row only to `div.mon.dead` entries

#### Scenario: Sequential loot with progress indicator
- **WHEN** bulk loot runs
- **THEN** the addon issues `loot.php` POST requests one at a time for each eligible monster with form-encoded `monster_id` and `user_id`, respecting `credentials: "include"`, spacing requests by roughly 500ms, and displays a floating progress counter indicating current/total processed

#### Scenario: Aggregate loot results into a summary modal
- **WHEN** bulk loot completes
- **THEN** the addon aggregates responses across all processed monsters, stacking items by `ITEM_ID` with a count badge on the item image, and sums rewards (e.g., EXP and Gold) for display while counting any failed loot calls
- **AND** the user sees a single summary modal containing the stacked items, cumulative rewards, and a concise failed-count note if any calls failed, instead of one modal per monster
- **AND** modals (summary or per-monster) close when the user clicks the X button or the backdrop

#### Scenario: Continue on loot failure
- **WHEN** an individual `loot.php` call fails (network or non-success response)
- **THEN** the addon skips that monster, increments a failure count, continues with the remaining monsters, and includes the failure count in the final modal summary

#### Scenario: Successive bulk loot runs skip already looted monsters
- **WHEN** the user starts bulk loot multiple times in the same page session
- **THEN** the addon tracks which dead monster ids have already been successfully looted (by bulk loot or per-card quick loot) and excludes them from the eligible set for subsequent bulk loot runs
- **AND** the looted-id tracking is in-memory for the current page load only and resets on reload
