## ADDED Requirements
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
