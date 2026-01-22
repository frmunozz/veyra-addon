# wave-monster-tools Specification

## Purpose
TBD - created by archiving change add-wave-monster-tools. Update Purpose after archive.
## Requirements
### Requirement: Wave monster page detection and filtering
The addon SHALL detect wave monster lists by the presence of `.monster-card` entries (with ids), known wave URLs, or the `#toggleDeadBtn` marker and expose a floating (top-right, toggleable) filter UI that hides monsters by name, with convenience controls for toggling all types, toggling monster images, and reducing page clutter.

#### Scenario: Detect wave pages and bail cleanly
- **WHEN** the page lacks `.monster-card` entries, known wave URLs, and no `#toggleDeadBtn` marker is found
- **THEN** the addon skips rendering the wave filter/loot UI and leaves the page untouched while logging a single `[Veyra Addon]` warning

#### Scenario: Render monster filters with counts and convenience actions
- **WHEN** `.monster-card` entries are present
- **THEN** the addon extracts monster names and ids, deduplicates names, and renders a `veyra-addon-*` multi-select control within a floating menu placed below the header on the top-right, with all names preselected by default
- **AND** each option label includes a count prefix formatted as `[NN] {monster name}`, where `NN` is the number of matching monster cards in the current view and is padded to two digits for counts under 100
- **AND** the Filter monsters section title row at `#veyra-addon-wave-panel > div:nth-child(1) > div.veyra-addon-wave-section__title` includes "hide all" and "show all" buttons that clear/select all checkboxes and immediately apply filtering
- **AND** toggling the checkboxes shows only the selected monster cards and hides non-selected ones without deleting them from the DOM; when all names are deselected the addon hides all monster cards and does not auto-restore selection
- **AND** filter choices persist per wave page and are shared between dead/alive views
- **AND** the floating menu can be shown/hidden via a small toggle button anchored near the same top-right position (closed label 🛠️, open label 🛠️ Wave filters and loot 🛠️)
- **AND** the floating menu toggle and `#openBattleDrawerBtn` are mutually disabled while either menu is open to avoid overlapping asides
- **AND** the wave monster UI is delivered via dedicated content/CSS files (e.g., `wave-monster-tools.js` and `wave-monster-tools.css`) scoped to wave pages via manifest to avoid overloading existing menu code

#### Scenario: Toggle monster images
- **WHEN** the user toggles the wave tools images checkbox
- **THEN** the addon hides or shows monster images identified by the `.monster-img` class (e.g., via `display: none`) without removing them from the DOM

#### Scenario: Hide gate info clutter
- **WHEN** the wave tools UI initializes on a detected wave page
- **THEN** the addon hides `body > div.gate-info` (if present) to reduce clutter while leaving non-wave pages untouched

### Requirement: Dead monster bulk looting and aggregation
The addon SHALL enable bulk looting for dead monsters when the `hide_dead_monsters=0` cookie is present, operating only on currently visible (unhidden) and unlooted cards and summarizing results, with controls surfaced in the floating menu.

#### Scenario: Enable bulk loot controls with quick buttons and custom count
- **WHEN** `hide_dead_monsters=0` is present in cookies on a detected wave page
- **THEN** the addon renders quick bulk loot buttons for `1`, `5`, `10`, `15`, and `all` inside the floating menu
- **AND** the addon renders a custom numeric input below the quick buttons for specifying an arbitrary bulk loot count
- **AND** starting bulk loot processes the first N eligible visible monster cards in sequence, capping N to the number of eligible cards, skipping any cards hidden by the filter, and treating `all` as all eligible cards
- **AND** filter controls are locked (disabled) during bulk loot and re-enabled when the run finishes or aborts
- **AND** starting `all` requires a confirmation prompt before the run begins, and an in-progress run exposes a Stop control that cancels additional requests after the current monster finishes

#### Scenario: Bulk loot unavailable when dead monsters hidden
- **WHEN** `hide_dead_monsters` is not `0`
- **THEN** the bulk loot section shows only a dead-monsters-hidden message and no input/buttons, while a footer toggle remains available to flip the cookie and reload to show dead monsters

#### Scenario: Sequential loot with progress indicator
- **WHEN** bulk loot runs
- **THEN** the addon issues `loot.php` POST requests one at a time for each selected eligible monster with form-encoded `monster_id` and `user_id`, respecting `credentials: "include"`, spacing requests by roughly 500ms, and displays a floating progress counter indicating current/total processed

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
- **THEN** the addon tracks which monster ids have already been successfully looted (by bulk loot or per-card quick loot) and excludes them from the eligible set for subsequent bulk loot runs
- **AND** the looted-id tracking is in-memory for the current page load only and resets on reload

### Requirement: Dead monster card action replacements
The addon SHALL replace the dead monster card call-to-action at `body > div.monster-container > div:nth-child(2) > a` with side-by-side Loot and View buttons when `hide_dead_monsters=0`.

#### Scenario: Loot button performs single monster loot with modal
- **WHEN** the user clicks the per-card Loot button on a dead monster
- **THEN** the addon issues a `loot.php` POST request for that monster ID including `monster_id` and `user_id` with `credentials: "include"` and displays a modal showing the items and rewards from the response with item images
- **AND** the button label reads "Quick loot" and is aligned with the View button within the parent container

#### Scenario: View button preserves navigation
- **WHEN** the user clicks the per-card View button
- **THEN** the browser navigates to the monster page (`battle.php?id=...`) matching the original link behavior without interfering with the loot button

### Requirement: Wave QOL automation form and persistence
The addon SHALL render a `veyra-addon-*` automation form inside the wave monster tools panel on `active_wave.php` pages that include QOL elements (`#waveQolPanel` and `#fNameSel`), allowing the user to choose a single monster name and enable or disable automation.

#### Scenario: Save and restore automation settings
- **WHEN** a user selects a monster name and clicks Enable
- **THEN** the addon persists the enabled state and selected name in browser storage keyed by gate/wave (or event/wave) so it is scoped per wave page
- **AND** on the next page load, the form restores the saved selection and enabled state

#### Scenario: Disable automation
- **WHEN** the user disables automation from the form
- **THEN** the addon marks automation disabled in storage and does not auto-run on subsequent loads

### Requirement: Wave QOL automation sequence
The addon SHALL execute a single, sequential QOL action sequence immediately after the required DOM elements are available when automation is enabled.

#### Scenario: Run the QOL sequence once per page load
- **WHEN** automation is enabled and the page provides `#fNameSel`, `#fUnjoined`, `#btnSelectVisible`, and the QOL attack buttons
- **THEN** the addon sets `#fNameSel` to the stored selection and dispatches the corresponding change event
- **AND** the addon toggles `#fUnjoined` from checked to unchecked and back to checked, dispatching change events for each toggle
- **AND** the addon clicks `#btnSelectVisible`
- **AND** the addon clicks `#waveQolPanel > div.qol-top > div.qol-attacks > button:nth-child(3)`
- **AND** the sequence runs once per page load without artificial delays between steps

#### Scenario: Surface step failures
- **WHEN** any required element is missing or the stored selection does not exist in `#fNameSel`
- **THEN** the addon stops the sequence, surfaces the error in the automation form status line, and logs a `[Veyra Addon]` error that identifies the failed step and selector

