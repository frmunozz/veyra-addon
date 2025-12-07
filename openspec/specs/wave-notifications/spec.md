# wave-notifications Specification

## Purpose
TBD - created by archiving change add-wave-threshold-notification. Update Purpose after archive.
## Requirements
### Requirement: Active wave 8 threshold monitoring
The addon SHALL fetch `https://demonicscans.org/active_wave.php?gate=3&wave=8` with user credentials to read progress from `#waveThresholds .threshold-meta` and store the last observed progress for comparison.

#### Scenario: Parse threshold progress from HTML
- **WHEN** the fetch returns HTML for the wave page
- **THEN** the addon extracts a numeric `current/target` pair from elements under `#waveThresholds .threshold-meta`
- **AND** caches the last observed progress for future comparisons

#### Scenario: Slow retry on auth or parse failure
- **WHEN** the fetch is unauthenticated, redirected, or cannot be parsed
- **THEN** the addon logs a single `[Veyra Addon]` warning, skips notification, and schedules the next poll using the slowest interval

### Requirement: Wave spawn notification
The addon SHALL notify the user with the text "general spawned!" when the wave threshold reaches the target or resets after previously hitting the target, and clicking the notification SHALL open the wave page.

#### Scenario: Notify on reaching 2500/2500
- **WHEN** a poll observes any `.threshold-meta` value of `2500/2500`
- **THEN** a browser notification labeled "general spawned!" is issued once for that occurrence
- **AND** clicking the notification opens `https://demonicscans.org/active_wave.php?gate=3&wave=8`

#### Scenario: Notify on reset after reaching threshold
- **WHEN** the last observed progress was at or above the target and a subsequent poll reports a lower current value (reset)
- **THEN** the addon issues the same notification and updates the stored last progress to the reset value

#### Scenario: Respect notification permission
- **WHEN** notification permission is denied or unavailable
- **THEN** the addon skips creating the notification but continues polling and logs a concise `[Veyra Addon]` message

### Requirement: Adaptive polling cadence
The addon SHALL adjust polling frequency based on progress to minimize load while staying responsive near the threshold.

#### Scenario: Poll interval increases with low progress
- **WHEN** the current value is below 2000
- **THEN** the next poll is scheduled about 60 minutes later

#### Scenario: Poll interval tightens near threshold
- **WHEN** the current value is between 2000 and 2399 inclusive
- **THEN** the next poll is scheduled about 30 minutes later

#### Scenario: High-frequency polling near spawn
- **WHEN** the current value is 2400 or above and below the target
- **THEN** the next poll is scheduled about 10 minutes later

