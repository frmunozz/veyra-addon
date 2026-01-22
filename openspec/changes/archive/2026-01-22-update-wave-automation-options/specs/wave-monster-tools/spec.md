## MODIFIED Requirements
### Requirement: Wave QOL automation form and persistence
The addon SHALL render a `veyra-addon-*` automation form inside the wave monster tools panel on `active_wave.php` pages that include QOL elements (`#waveQolPanel` and `#fNameSel`), allowing the user to choose a single monster name, an attack stamina amount sourced from the QOL attack buttons, enable or disable automation, and configure auto-reload settings.

#### Scenario: Save and restore automation settings
- **WHEN** a user selects a monster name, an attack stamina value (1/10/50/100/200), configures auto-reload, and enables automation
- **THEN** the addon persists the enabled state, selected monster, attack stamina, auto-reload enabled state, and reload delay seconds in browser storage keyed by gate/wave (or event/wave) so it is scoped per wave page
- **AND** on the next page load, the form restores the saved settings, defaulting to attack stamina 50 and auto-reload enabled with a 30 second delay when no saved values exist

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
- **AND** the addon clicks the QOL attack button under `#waveQolPanel > div.qol-top > div.qol-attacks` whose `data-stam` matches the stored attack stamina value
- **AND** the sequence runs once per page load without artificial delays between steps

#### Scenario: Surface step failures
- **WHEN** any required element is missing, the stored selection does not exist in `#fNameSel`, or the configured `data-stam` button is not found
- **THEN** the addon stops the sequence, surfaces the error in the automation form status line, and logs a `[Veyra Addon]` error that identifies the failed step and selector

## ADDED Requirements
### Requirement: Wave automation auto-reload loop
The addon SHALL optionally auto-reload the wave page when automation is enabled, using a user-configured delay in seconds that defaults to 30 seconds, and only while stamina is at least 100.

#### Scenario: Schedule auto-reload after page load
- **WHEN** automation is enabled, auto-reload is enabled, and `#stamina_span` reports at least 100 stamina on page load
- **THEN** the addon schedules a page reload to occur the configured number of seconds after the page was loaded

#### Scenario: Stop auto-reload on low stamina
- **WHEN** automation is enabled but `#stamina_span` reports less than 100 stamina
- **THEN** the addon disables auto-reload, persists that disabled state, disables the auto-reload checkbox, and does not schedule a reload
