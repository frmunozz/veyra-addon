## ADDED Requirements
### Requirement: Wave monster page detection and filtering
The addon SHALL detect wave monster lists by the presence of `.monster-card` entries (with ids), known wave URLs, or the `#toggleDeadBtn` marker and expose a floating (top-right, toggleable) filter UI that hides non-selected monsters by name.

#### Scenario: Detect wave pages and bail cleanly
- **WHEN** the page lacks `.monster-card` entries, known wave URLs, and no `#toggleDeadBtn` marker is found
- **THEN** the addon skips rendering the wave filter/loot UI and leaves the page untouched while logging a single `[Veyra Addon]` warning

#### Scenario: Render monster name multi-select
- **WHEN** `.monster-card` entries are present
- **THEN** the addon extracts monster names and ids, deduplicates names, and renders a `veyra-addon-*` multi-select control within a floating menu placed below the header on the top-right, with all names preselected
- **AND** toggling the checkboxes shows only the selected monster cards and hides non-selected ones without deleting them from the DOM; when all names would be deselected the addon restores selection to prevent hiding everything
- **AND** filter choices persist per wave page and are shared between dead/alive views
- **AND** the floating menu can be shown/hidden via a small toggle button anchored near the same top-right position (closed label 🛠️, open label 🛠️ Wave filters and loot 🛠️)
- **AND** the floating menu toggle and `#openBattleDrawerBtn` are mutually disabled while either menu is open to avoid overlapping asides
- **AND** the wave monster UI is delivered via dedicated content/CSS files (e.g., `wave-monster-tools.js` and `wave-monster-tools.css`) scoped to wave pages via manifest to avoid overloading existing menu code

### Requirement: Dead monster bulk looting and aggregation
The addon SHALL enable bulk looting for dead monsters when the `hide_dead_monsters=0` cookie is present, operating only on currently visible (unhidden) cards and summarizing results, with controls surfaced in the floating menu.

#### Scenario: Enable bulk loot controls with count cap
- **WHEN** `hide_dead_monsters=0` is present in cookies on a detected wave page
- **THEN** the addon renders a bulk loot trigger with an adjacent numeric input defaulting to `5` inside the floating menu
- **AND** starting bulk loot processes the first N visible monster cards in sequence (default 5), capping N to the number of visible cards and skipping any cards hidden by the filter
- **AND** filter controls are locked (disabled) during bulk loot and re-enabled when the run finishes or aborts
#### Scenario: Bulk loot unavailable when dead monsters hidden
- **WHEN** `hide_dead_monsters` is not `0`
- **THEN** the bulk loot section shows only a dead-monsters-hidden message and no input/button, while a footer toggle remains available to flip the cookie and reload to show dead monsters

#### Scenario: Sequential loot with progress indicator
- **WHEN** bulk loot runs
- **THEN** the addon issues `loot.php` POST requests one at a time for each selected visible monster with form-encoded `monster_id` and `user_id`, respecting `credentials: "include"`, spacing requests by roughly 500ms, and displays a floating progress counter indicating current/total processed

#### Scenario: Aggregate loot results into a summary modal
- **WHEN** bulk loot completes
- **THEN** the addon aggregates responses across all processed monsters, stacking items by `ITEM_ID` with a count badge on the item image, and sums rewards (e.g., EXP and Gold) for display while counting any failed loot calls
- **AND** the user sees a single summary modal containing the stacked items, cumulative rewards, and a concise failed-count note if any calls failed, instead of one modal per monster
- **AND** modals (summary or per-monster) close when the user clicks the X button or the backdrop

#### Scenario: Continue on loot failure
- **WHEN** an individual `loot.php` call fails (network or non-success response)
- **THEN** the addon skips that monster, increments a failure count, continues with the remaining monsters, and includes the failure count in the final modal summary

### Requirement: Dead monster card action replacements
The addon SHALL replace the dead monster card call-to-action at `body > div.monster-container > div:nth-child(2) > a` with side-by-side Loot and View buttons when `hide_dead_monsters=0`.

#### Scenario: Loot button performs single monster loot with modal
- **WHEN** the user clicks the per-card Loot button on a dead monster
- **THEN** the addon issues a `loot.php` POST request for that monster ID including `monster_id` and `user_id` with `credentials: "include"` and displays a modal showing the items and rewards from the response with item images
- **AND** the button label reads "Quick loot" and is aligned with the View button within the parent container

#### Scenario: View button preserves navigation
- **WHEN** the user clicks the per-card View button
- **THEN** the browser navigates to the monster page (`battle.php?id=...`) matching the original link behavior without interfering with the loot button
