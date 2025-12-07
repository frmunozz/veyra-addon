# Development notes

## File structure and loading
- Chrome manifest (`extension/manifest.json`) loads shared constants first, then feature scripts. Current order for `https://demonicscans.org/*`: `src/content/constants.js`, `src/content/menu.js` (addon aside).
- Styles: `src/styles/menu.css` (addon aside). Keep selectors scoped with the `veyra-addon-*` prefix.
- Background worker: `src/background/service-worker.js` exists but is minimal; prefer content scripts first.

## Shared constants
- `src/content/constants.js` exports `window.VeyraAddonConstants` (TAG, storage key, IDs, mount flags). Always read IDs/flags from this object in new scripts to avoid duplication.

## Current features
- Addon menu (`src/content/menu.js`): clones links from `#sideDrawer`, hides the native drawer after mounting, reuses `#nav_fab` as the toggle, and shows a full-height dark aside with backdrop. Mount flag: `veyraAddonMenuMounted`.
- Wave threshold notifier (background): polls `active_wave.php?gate=3&wave=8` with `credentials: "include"` and dynamic cadence (60m/30m/10m based on current progress), stores the last progress in `chrome.storage.local` (`veyraAddonWaveState`), and fires a notification (`general spawned!`) on reaching the configured target (default 2500) or when a reset is detected; clicking opens the wave page. Auth/parse failures log once and back off using the slowest interval.

## Adding a new feature/content script
1) Identify the route(s) or pattern to match (e.g., `https://demonicscans.org/guild_*`). Add a new content script entry in `manifest.json` **or** extend the existing match with a new JS file in the current entry (keep order: constants first).
2) Create a new JS module under `src/content/` with a dedicated mount flag (`veyraAddon<Feature>Mounted`) stored in `VeyraAddonConstants` if shared. Guard against double-mount and missing DOM hooks.
3) Scope DOM/CSS with the `veyra-addon-*` prefix; add any new styles to `src/styles/menu.css` or a new scoped stylesheet. Avoid global overrides; prefer component-level classes.
4) Use `getEnabledFlag`-style gating if the feature should respect the popup toggle. Reuse helpers/constants rather than redefining strings.
5) Log failures once with `[Veyra Addon]` warnings and bail out gracefully, leaving native page behavior intact.
6) Document the feature and any endpoints in `docs/fetch-guidelines.md` or a new doc; add implementation notes or patterns here if they affect future work.

## Permissions and hosts
- Host permissions currently cover `https://demonicscans.org/*`. If a new feature needs broader scope, justify and update `manifest.json` carefully.
- Permissions now include `notifications` and `alarms` to support the background wave notifier. Keep additions minimal; prefer content scripts over background/service worker unless cross-tab state or rules are required.

## Testing/dev loop
- For JS/CSS changes in content scripts, refresh the page to reload scripts. Only reload the extension when `manifest.json` changes.
- Validate OpenSpec changes with `openspec validate <change-id> --strict` when specs are updated.
- Watch for console logs prefixed with `[Veyra Addon]` to confirm mounts and fallbacks.
