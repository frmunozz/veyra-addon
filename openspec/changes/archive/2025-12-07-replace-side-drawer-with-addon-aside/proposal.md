# Change: Replace native side drawer with addon aside

## Why
The native `#sideDrawer` is noisy and brittle; we want a controlled addon-owned navigation surface that we can evolve without fighting the page's markup or events.

## What Changes
- Hide or disable the page's `#sideDrawer` when the addon is active, leaving a fallback path if our mount fails.
- Render a new addon aside (scoped under `veyra-addon-*`) that carries our navigation and future favorites/shortcuts, reusing the existing `#nav_fab` button/icon/position as its toggle.
- Keep navigation coverage equivalent to the original drawer so users do not lose destinations, ensure the addon aside is full-height with a battle-drawer-like dark backdrop, and let it collapse/expand cleanly on small screens.
- Guard all hooks so failure to mount or fetch data reverts to the native drawer without breaking page behavior.

## Impact
- Affected specs: nav-drawer
- Affected code: `extension/src/content/content.js`, `extension/src/styles/content.css`, `extension/src/lib/*` (as needed)
- Coordination: conflicts with `update-side-drawer-favorites` if both proceed; we should pause that change or merge requirements into this aside.
