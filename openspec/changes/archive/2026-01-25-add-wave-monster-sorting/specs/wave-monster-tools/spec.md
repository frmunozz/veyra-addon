## ADDED Requirements
### Requirement: Wave monster sorting control
The addon SHALL provide a sort selector in the wave tools panel on wave pages that reorders monster cards by HP values parsed from each card's HP stat row, supports "lowest hp", "highest hp", and "highest max hp", defaults to the original HTML order when no sort is selected, and persists the selected mode per wave page.

#### Scenario: Default order and per-wave persistence
- **WHEN** a wave page loads without a stored sort selection
- **THEN** the sort control defaults to original order and cards stay in their initial DOM sequence
- **AND** when the user selects a sort mode, that selection is stored per wave page and restored on reload

#### Scenario: Sort by lowest hp
- **WHEN** the user selects "lowest hp"
- **THEN** monster cards are reordered in ascending order by current HP parsed from the HP stat value text
- **AND** cards with equal HP retain their original relative order

#### Scenario: Sort by highest hp
- **WHEN** the user selects "highest hp"
- **THEN** monster cards are reordered in descending order by current HP parsed from the HP stat value text
- **AND** cards with equal HP retain their original relative order

#### Scenario: Sort by highest max hp
- **WHEN** the user selects "highest max hp"
- **THEN** monster cards are reordered in descending order by max HP parsed from the HP stat value text
- **AND** cards with equal max HP retain their original relative order

#### Scenario: Sorting preserves filters
- **WHEN** a sort mode is applied
- **THEN** filter checkbox selections remain unchanged and any hidden cards stay hidden
