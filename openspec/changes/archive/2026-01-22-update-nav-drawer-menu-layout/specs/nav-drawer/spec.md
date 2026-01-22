## ADDED Requirements
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

## MODIFIED Requirements
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
