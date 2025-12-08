## ADDED Requirements

### Requirement: Addon aside layout and cleanup
The addon SHALL extend the addon-managed navigation aside with a favorites-first layout while omitting native-only decoration when composing items.

#### Scenario: Addon aside omits native-only decor
- **WHEN** building the addon navigation aside from available navigation data
- **THEN** the rendered aside excludes the native "side-title" header and the "Halloween event" item
- **AND** the Hole link is visually separated from other navigation groups with a spacer or grouping break

#### Scenario: Drawer layout order within addon aside
- **WHEN** the addon renders its navigation enhancements
- **THEN** the favorites band appears at the top of the addon aside, followed by the separated Hole item, and then the remaining navigation (static links and dropdowns) to keep the layout predictable

#### Scenario: Addon aside unavailable falls back cleanly
- **WHEN** the addon-managed aside or `#nav_fab` toggle cannot be mounted and the nav-drawer capability falls back to the native drawer
- **THEN** this change logs a single `[Veyra Addon]` warning and skips favorites/dynamic sections, leaving the native drawer untouched

### Requirement: Favorites band with star toggles
The addon SHALL render a favorites section inside the addon-managed aside and allow starring any navigation entry (including dropdown items) without navigating.

#### Scenario: Star moves item into favorites
- **WHEN** a user clicks the star icon on a menu item
- **THEN** the item moves into the favorites section at the top of the addon aside, preserving its label and destination, and the page does not navigate

#### Scenario: Starred item removed from source list
- **WHEN** an item is starred and shown in favorites
- **THEN** it is hidden from its original menu grouping until unstarred so users do not see duplicates in the addon aside

#### Scenario: Favorites persist and unstar restores placement
- **WHEN** the page reloads after starring items
- **THEN** the same items appear in favorites in the order they were starred, persisted via local storage
- **AND WHEN** a starred item's star is clicked again
- **THEN** it is removed from favorites and returns to its original menu grouping inside the addon aside

#### Scenario: Dropdown items are favoritable
- **WHEN** the star on a dropdown child (e.g., wave link or dungeon entry) is clicked
- **THEN** that child item can be favorited independently of its parent dropdown and shows in favorites with its target URL

### Requirement: Static navigation additions
The addon SHALL inject direct links for key destinations into the addon aside while maintaining existing critical items.

#### Scenario: Insert new static links
- **WHEN** the addon aside is enhanced
- **THEN** it includes menu items for Legendary Forge (`/legendary_forge.php`) and Adventurers Guild (`/adventurers_guild.php`) with working hrefs
- **AND** the Hole link remains available, visually separated from general navigation

#### Scenario: Star icons appear on static links
- **WHEN** viewing any static menu item (including new additions and Hole)
- **THEN** a star control is present and operable as defined in favorites behavior

### Requirement: Grakthar Gate Waves dropdown
The addon SHALL provide a collapsible Grakthar Gate Waves section inside the addon aside containing specific wave shortcuts.

#### Scenario: Render wave links
- **WHEN** the addon aside is enhanced
- **THEN** the Grakthar Gate Waves dropdown lists Wave 3 (`/active_wave.php?gate=3&wave=8`), Wave 2 (`/active_wave.php?gate=3&wave=5`), and Wave 1 (`/active_wave.php?gate=3&wave=3`)

#### Scenario: Waves support favorites without redirect
- **WHEN** a user stars a wave link
- **THEN** it moves to favorites without triggering navigation, and the dropdown remains functional for unstarred items

### Requirement: Guild Dungeons dropdown
The addon SHALL surface active guild dungeons inside the addon aside by reading the Open Dungeons section of `guild_dash.php`.

#### Scenario: Populate from Open Dungeons
- **WHEN** the addon fetches `guild_dash.php` with `credentials: "include"`
- **THEN** it parses entries under the "Open Dungeons" `h2`, creating dropdown items labeled with the dungeon name and linking the primary "Enter" URL from each card
- **AND** each dungeon entry includes a star control consistent with favorites behavior

#### Scenario: Graceful fallback on fetch or parse failure
- **WHEN** the fetch is blocked, returns non-OK, or the Open Dungeons markup is missing or changed
- **THEN** the addon logs a concise warning, skips rendering the Guild Dungeons dropdown, and leaves the addon aside otherwise intact while respecting native fallback if already triggered

#### Scenario: Empty guild dungeons state
- **WHEN** `guild_dash.php` returns successfully but no Open Dungeons entries are present
- **THEN** the Guild Dungeons dropdown renders with a single disabled/empty-state row (e.g., "No open dungeons") and no star controls

### Requirement: Graceful degradation and isolation
The addon SHALL avoid breaking site navigation when dependencies change or when the nav-drawer capability falls back to the native drawer.

#### Scenario: Drawer hooks unavailable
- **WHEN** DOM hooks, selectors, or event bindings for the addon aside fail during initialization
- **THEN** the addon stops modifying navigation, leaves default content intact (including the native drawer when fallback occurs), and prevents uncaught errors from bubbling to the page
