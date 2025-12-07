## ADDED Requirements

### Requirement: Drawer cleanup and structure
The addon SHALL initialize on the game dashboard side drawer, removing decorative elements and isolating key items without breaking the page.

#### Scenario: Remove side title and Halloween entry
- **WHEN** the drawer contains a "side-title" header or a "Halloween event" navigation item
- **THEN** the addon removes those nodes before rendering addon sections
- **AND** the Hole item appears separated from other items with a visible spacer or grouping break

#### Scenario: Missing expected nodes is non-fatal
- **WHEN** the expected nodes are absent or selectors fail
- **THEN** the addon logs a single `[Veyra Addon]` warning and aborts drawer modifications, leaving the native drawer intact

### Requirement: Favorites band with star toggles
The addon SHALL render a favorites section and allow starring any navigation entry (including dropdown items) without navigating.

#### Scenario: Star moves item into favorites
- **WHEN** a user clicks the star icon on a menu item
- **THEN** the item moves into the favorites section at the top of the drawer, preserving its label and destination, and the page does not navigate

#### Scenario: Favorites persist and unstar restores placement
- **WHEN** the page reloads after starring items
- **THEN** the same items appear in favorites in the order they were starred, persisted via local storage
- **AND WHEN** a starred item's star is clicked again
- **THEN** it is removed from favorites and returns to its original menu grouping

#### Scenario: Dropdown items are favoritable
- **WHEN** the star on a dropdown child (e.g., wave link or dungeon entry) is clicked
- **THEN** that child item can be favorited independently of its parent dropdown and shows in favorites with its target URL

### Requirement: Static navigation additions
The addon SHALL inject direct links for key destinations and maintain existing critical items.

#### Scenario: Insert new static links
- **WHEN** the drawer is enhanced
- **THEN** it includes menu items for Legendary Forge (`/legendary_forge.php`) and Adventurers Guild (`/adventurers_guild.php`) with working hrefs
- **AND** the Hole link remains available, visually separated from general navigation

#### Scenario: Star icons appear on static links
- **WHEN** viewing any static menu item (including new additions and Hole)
- **THEN** a star control is present and operable as defined in favorites behavior

### Requirement: Grakthar Gate Waves dropdown
The addon SHALL provide a collapsible Grakthar Gate Waves section containing specific wave shortcuts.

#### Scenario: Render wave links
- **WHEN** the drawer is enhanced
- **THEN** the Grakthar Gate Waves dropdown lists Wave 3 (`/active_wave.php?gate=3&wave=8`), Wave 2 (`/active_wave.php?gate=3&wave=5`), and Wave 1 (`/active_wave.php?gate=3&wave=3`)

#### Scenario: Waves support favorites without redirect
- **WHEN** a user stars a wave link
- **THEN** it moves to favorites without triggering navigation, and the dropdown remains functional for unstarred items

### Requirement: Guild Dungeons dropdown
The addon SHALL surface active guild dungeons by reading the Open Dungeons section of `guild_dash.php`.

#### Scenario: Populate from Open Dungeons
- **WHEN** the addon fetches `guild_dash.php` with `credentials: "include"`
- **THEN** it parses entries under the "Open Dungeons" `h2`, creating dropdown items labeled with the dungeon name and linking the primary "Enter" URL from each card
- **AND** each dungeon entry includes a star control consistent with favorites behavior

#### Scenario: Graceful fallback on fetch or parse failure
- **WHEN** the fetch is blocked, returns non-OK, or the Open Dungeons markup is missing or changed
- **THEN** the addon logs a concise warning, skips rendering the Guild Dungeons dropdown, and leaves the native drawer untouched

### Requirement: Graceful degradation and isolation
The addon SHALL avoid breaking site navigation when dependencies change.

#### Scenario: Drawer hooks unavailable
- **WHEN** DOM hooks, selectors, or event bindings fail during initialization
- **THEN** the addon stops modifying the drawer, leaves default content intact, and prevents uncaught errors from bubbling to the page
