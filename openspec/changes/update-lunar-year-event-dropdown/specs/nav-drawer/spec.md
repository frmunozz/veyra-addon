## ADDED Requirements
### Requirement: Lunar Year Event dropdown
The addon SHALL render a 🐀 Lunar Year Event dropdown in the shortcuts list, replacing the previous Winter Aurora Festival entry, and show live event progress sourced from the Lunar Year event page.

#### Scenario: Lunar Year Event appears in shortcuts order
- **WHEN** the addon renders the shortcuts section
- **THEN** it includes a 🐀 Lunar Year Event dropdown labeled "Lunar Year Event"
- **AND** it appears after `🌊 Grakthar Gate Waves` and `🧌 Guild Dungeons` in the shortcuts order

#### Scenario: Lunar Year Event progress refreshes from event page
- **WHEN** the addon aside is mounted
- **THEN** it fetches `/lunar_plague.php` with `credentials: "include"` to parse current/goal progress text and formats the sublabel as `current/goal`
- **AND** it refreshes the progress about once every 5 minutes while the addon aside remains mounted
- **AND** on fetch or parse failure the sublabel shows `—/—` and a concise warning is logged

#### Scenario: Lunar Year Event shortcuts point to event and battle pages
- **WHEN** a user expands the Lunar Year Event dropdown
- **THEN** it lists the event page (`/lunar_plague.php`) and the battle shortcut (`/active_wave.php?event=6&wave=3`) with working hrefs
