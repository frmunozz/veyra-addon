## ADDED Requirements

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
