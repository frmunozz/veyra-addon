## 1. Discovery & Planning
- [x] 1.1 Document the existing `#sideDrawer` DOM structure, event bindings, and mount timing on `game_dash.php`.
- [x] 1.2 Define how the addon toggles between native drawer and addon aside (feature flag/fallback) and align with the `update-side-drawer-favorites` scope.

## 2. Implementation
- [x] 2.1 Add guarded initialization that only hides the native drawer after addon aside is ready; ensure bailout keeps native drawer intact.
- [x] 2.2 Suppress or detach the native `#sideDrawer` (CSS or DOM) when addon mode is active, and restore if addon init fails.
- [x] 2.3 Build the addon aside shell (open/close affordance, title, sections) under `veyra-addon-*` with keyboard accessibility.
- [x] 2.4 Port core navigation destinations from the native drawer into the addon aside, keeping hrefs and click behavior consistent.
- [x] 2.5 Wire dynamic data loaders (e.g., waves, guild dungeons) behind safe fetch/parse guards; no navigation triggers on failure. (Handled by cloning existing drawer links and warning once when missing.)
- [x] 2.6 Add styles for layout, layering, and responsive collapse; avoid global overrides and keep the native page scrollable.

## 3. Documentation & Validation
- [x] 3.1 Update `docs/README.md` with addon-aside behavior, fallbacks, and any endpoints consumed.
- [x] 3.2 Run `openspec validate replace-side-drawer-with-addon-aside --strict` and fix issues.
- [ ] 3.3 Manual sanity check with addon enabled/disabled to verify native drawer fallback works and navigation stays functional. (Pending in-browser verification.)
