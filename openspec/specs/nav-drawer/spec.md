# nav-drawer Specification

## Purpose
TBD - created by archiving change replace-side-drawer-with-addon-aside. Update Purpose after archive.
## Requirements
### Requirement: Addon-managed navigation aside
The addon SHALL render its own navigation aside and suppress the native `#sideDrawer` only after the addon UI is ready, reusing the existing `#nav_fab` control as the toggle.

#### Scenario: Addon aside replaces native drawer when ready
- **WHEN** the addon initializes successfully
- **THEN** it inserts a `veyra-addon-*` aside that holds the navigation menu
- **AND** the native `#sideDrawer` is visually hidden and made inert so it no longer handles clicks
- **AND** the `#nav_fab` button controls the addon aside using the same icon/position, without triggering the native drawer logic

### Requirement: Native drawer fallback
The addon SHALL leave the native drawer intact if addon hooks fail so page navigation is never lost.

#### Scenario: Bail out on missing hooks
- **WHEN** required DOM selectors, mount points, or data fetches fail during initialization
- **THEN** the addon logs a single `[Veyra Addon]` warning and skips hiding `#sideDrawer`, leaving the page behavior unchanged

### Requirement: Navigation coverage and behavior parity
The addon SHALL provide navigation entries in its aside that cover the destinations exposed in the native drawer without altering navigation semantics.

#### Scenario: Clicking addon navigation matches native behavior
- **WHEN** a user clicks a navigation entry inside the addon aside
- **THEN** the browser navigates to the same href as the corresponding native drawer item using a normal anchor click (no extra redirects)

### Requirement: Aside interaction and responsiveness
The addon SHALL provide basic interaction controls (open/close) and keep the page usable on different viewport sizes with a battle-drawer-like presentation.

#### Scenario: Toggle control opens and closes the aside
- **WHEN** the user activates the addon aside toggle (click or keyboard)
- **THEN** the aside opens or collapses without blocking page scroll, and focus remains accessible for keyboard users

#### Scenario: Full-height aside with dark backdrop
- **WHEN** the addon aside is open
- **THEN** it covers the full viewport height with darkened styling comparable to the battle drawer
- **AND** a dark backdrop appears behind it; clicking the backdrop collapses the aside while leaving the underlying page usable

### Requirement: Addon aside layout and cleanup
The addon SHALL extend the addon-managed navigation aside with a shortcuts-first layout while omitting native-only decoration when composing items.

#### Scenario: Addon aside omits native-only decor
- **WHEN** building the addon navigation aside from available navigation data
- **THEN** the rendered aside excludes the native "side-title" header and the "Halloween event" item
- **AND** the Hole link is visually separated from other navigation groups with a spacer or grouping break

#### Scenario: Drawer layout order within addon aside
- **WHEN** the addon renders its navigation enhancements
- **THEN** the shortcuts section appears at the top of the addon aside and lists the `🌊 Grakthar Gate Waves` dropdown, the `🧌 Guild Dungeons` dropdown, and the `🎄 Winter Aurora Festival` dropdown in that order
- **AND** the favorites band appears below shortcuts
- **AND** the navigation section appears below favorites, with the Hole link visually separated from other navigation items

#### Scenario: Home control and footer branding
- **WHEN** the addon renders the addon-managed aside
- **THEN** the Home control is rendered as a `🏠` icon link in the header container at `#veyra-addon-aside > div.veyra-addon-aside__header > span > a` that navigates to `/game_dash.php`
- **AND** the previous "Veyra Addon Menu" header label is removed, and a small footer at the bottom shows the text "Veyra addon Menu" as trademark copy

#### Scenario: Addon aside unavailable falls back cleanly
- **WHEN** the addon-managed aside or `#nav_fab` toggle cannot be mounted and the nav-drawer capability falls back to the native drawer
- **THEN** this change logs a single `[Veyra Addon]` warning and skips favorites/dynamic sections, leaving the native drawer untouched

### Requirement: Collapsible navigation and shortcuts sections
The addon SHALL render collapsible containers for both navigation and shortcuts groupings so users can hide and show their contents without triggering navigation.

#### Scenario: Navigation section collapses
- **WHEN** a user clicks the Navigation section header inside the addon aside
- **THEN** the navigation list toggles between expanded and collapsed states without changing the selected page or triggering navigation events

#### Scenario: Shortcuts section collapses
- **WHEN** a user clicks the Shortcuts section header inside the addon aside
- **THEN** the shortcuts list (including dynamic dropdowns) toggles open/closed reliably without breaking favorites or triggering navigation

### Requirement: Favorites band with star toggles
The addon SHALL render a favorites section inside the addon-managed aside and allow starring any navigation entry (including dropdown items) without navigating.

#### Scenario: Star moves item into favorites
- **WHEN** a user clicks the star icon on a menu item
- **THEN** the item is added to the favorites section at the top of the addon aside, preserving its label and destination, without triggering navigation and while leaving its original menu entry in place

#### Scenario: Starred items stay in source lists with gold stars
- **WHEN** an item is starred and shown in favorites
- **THEN** the same item remains visible in its original menu grouping with a gold star indicator so users can access it from either location

#### Scenario: Favorites persist and gold stars sync
- **WHEN** the page reloads after starring items
- **THEN** the same items appear in favorites in the order they were starred, and both the favorites entries and their source entries show gold stars sourced from local storage
- **AND WHEN** a starred item's star is clicked again from either location
- **THEN** the item disappears from favorites, both stars revert to the default state, and the source entry remains in its original grouping

#### Scenario: Dropdown items are favoritable
- **WHEN** the star on a dropdown child (e.g., wave link or dungeon entry) is clicked
- **THEN** that child item can be favorited independently of its parent dropdown, shows in favorites with its target URL, and continues to appear in the dropdown with a gold star

### Requirement: Static navigation additions
The addon SHALL inject direct links for key destinations into the addon aside while maintaining existing critical items.

#### Scenario: Insert new static links
- **WHEN** the addon aside is enhanced
- **THEN** it includes menu items for Legendary Forge (`/legendary_forge.php`) and Adventurers Guild (`/adventurers_guild.php`) with working hrefs and inline icons (✨ for Legendary Forge, 🏤 for Adventurers Guild)
- **AND** the Hole link remains available, visually separated from general navigation

#### Scenario: Star icons appear on static links
- **WHEN** viewing any static menu item (including new additions and Hole)
- **THEN** a star control is present and operable as defined in favorites behavior

### Requirement: Grakthar Gate Waves dropdown
The addon SHALL provide a collapsible Grakthar Gate Waves section inside the addon aside containing specific wave shortcuts.

#### Scenario: Render wave links
- **WHEN** the addon aside is enhanced
- **THEN** the Grakthar Gate Waves dropdown is labeled with a 🌊 icon and lists "Grakthar - Wave 3" (`/active_wave.php?gate=3&wave=8`), "Grakthar - Wave 2" (`/active_wave.php?gate=3&wave=5`), and "Grakthar - Wave 1" (`/active_wave.php?gate=3&wave=3`)

#### Scenario: Waves dropdown collapses
- **WHEN** the Grakthar Gate Waves header is clicked
- **THEN** the dropdown toggles between expanded and collapsed states without changing the current page or clearing favorites

#### Scenario: Waves support favorites without redirect
- **WHEN** a user stars a wave link
- **THEN** it moves to favorites without triggering navigation, and the dropdown remains functional for unstarred items

### Requirement: Guild Dungeons dropdown
The addon SHALL surface active guild dungeons inside the addon aside by reading the Open Dungeons section of `guild_dash.php` while rendering deterministic loading and error states.

#### Scenario: Render loading state while fetching
- **WHEN** the addon aside is enhanced
- **THEN** the `🧌 Guild Dungeons` dropdown is rendered immediately with a single disabled row labeled `Loading...` until the fetch completes

#### Scenario: Populate from Open Dungeons
- **WHEN** the addon fetches `guild_dash.php` with `credentials: "include"`
- **THEN** it parses entries under the "Open Dungeons" `h2`, extracting the dungeon names from `body > div.wrap > div:nth-child(6) > div:nth-child(1) > div > div:nth-child(1) > div:nth-child(2)` and `body > div.wrap > div:nth-child(6) > div:nth-child(1) > div > div:nth-child(2) > div:nth-child(2)`, and creates dropdown items labeled with those names and linking the primary "Enter" URL from each card
- **AND** each dungeon entry includes a star control consistent with favorites behavior

#### Scenario: Dungeons dropdown collapses
- **WHEN** the Guild Dungeons header is clicked
- **THEN** the dropdown toggles open/closed without altering favorites state or triggering navigation and is labeled with a 🧌 icon

#### Scenario: Graceful fallback on fetch or parse failure
- **WHEN** the fetch is blocked, returns non-OK, or the Open Dungeons markup is missing or changed
- **THEN** the dropdown remains rendered and replaces its loading row with a single disabled error row (e.g., "Failed to load guild dungeons") while logging a concise warning

#### Scenario: Empty guild dungeons state
- **WHEN** `guild_dash.php` returns successfully but no Open Dungeons entries are present
- **THEN** the Guild Dungeons dropdown renders with a single disabled/empty-state row (e.g., "No open dungeons") and no star controls

### Requirement: Graceful degradation and isolation
The addon SHALL avoid breaking site navigation when dependencies change or when the nav-drawer capability falls back to the native drawer.

#### Scenario: Drawer hooks unavailable
- **WHEN** DOM hooks, selectors, or event bindings for the addon aside fail during initialization
- **THEN** the addon stops modifying navigation, leaves default content intact (including the native drawer when fallback occurs), and prevents uncaught errors from bubbling to the page

### Requirement: Winter Aurora Festival dropdown
The addon SHALL provide a collapsible Winter Aurora Festival section inside the addon aside that includes event shortcuts and shows current event progress.

#### Scenario: Render festival dropdown with loading progress
- **WHEN** the addon aside is enhanced
- **THEN** it renders a `🎄 Winter Aurora Festival` dropdown in the shortcuts area
- **AND** the dropdown header shows a second, smaller sub-row that initially reads `Loading...` while event progress is being fetched and parsed

#### Scenario: Display progress parsed from the festival page
- **WHEN** the addon fetches `/a_lizardmen_winter.php` with `credentials: "include"`
- **THEN** it reads the current kill count from `body > div.wrap > div:nth-child(3) > div > div:nth-child(1) > div:nth-child(5) > div:nth-child(1)` (text like `78,540 kills spilled`) and the goal from `body > div.wrap > div:nth-child(3) > div > div:nth-child(1) > div:nth-child(5) > div:nth-child(2)` (text like `98% to 80,000 total`)
- **AND** it strips whitespace/newlines, extracts the numeric values, and formats the progress sub-row as `{current}/{goal}` with thousands separators (e.g., `78,482/80,000`)

#### Scenario: Auto-refresh festival progress every 5 minutes
- **WHEN** the addon aside is mounted on a game page
- **THEN** it automatically re-fetches and updates the Winter Aurora Festival progress sub-row about once every 5 minutes without requiring a page reload
- **AND** it does not refresh more frequently than once per 5 minutes to avoid unnecessary requests

#### Scenario: Festival progress fallback on fetch or parse failure
- **WHEN** the festival fetch is blocked, returns non-OK, or the progress selectors/text cannot be parsed
- **THEN** the dropdown remains rendered and the progress sub-row shows a stable fallback value (e.g., `—/—`) while logging a concise warning

#### Scenario: Festival dropdown includes event shortcuts
- **WHEN** the Winter Aurora Festival dropdown is expanded
- **THEN** it includes a link to `/a_lizardmen_winter.php` for the festival page
- **AND** it includes a link labeled `🌊 Carols in the Cold` pointing to `/active_wave.php?event=4&wave=2`

