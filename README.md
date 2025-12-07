# Veyra Addon (Chrome Extension)

Minimalist Chrome extension to improve the Veyra web game UI (`https://demonicscans.org/*`). The goal is to inject a lightweight content layer that refines layout, adds helper controls, and makes smarter REST interactions with the existing game endpoints.

## Quick start
- Load the unpacked extension: `chrome://extensions` → enable Developer Mode → **Load unpacked** → select the `extension/` directory.
- Open the game page and check DevTools Console for `[Veyra Addon]` logs to confirm injection.
- Click the extension icon to open the popup menu; use it to toggle the addon on/off, follow quick links, and hit Reload when prompted after changing the toggle.
- Edit `extension/src/content/content.js` to prototype DOM tweaks and REST calls.

## Repository layout
- `extension/manifest.json` — Manifest V3 setup.
- `extension/src/content/` — Content scripts that run in-page.
- `extension/src/background/` — (Optional) background service worker for cross-tab/stateful logic.
- `extension/src/styles/` — CSS injected by the content script.
- `extension/src/lib/` — Small helpers shared by scripts.
- `extension/assets/` — Icons and static assets for the extension listing.
- `docs/` — Notes, roadmap, and endpoint findings.

## Development workflow
- Keep iteration fast by working only in `content.js` at first; reload the extension and refresh the game page to test.
- Use the Network tab to document REST endpoints; mirror useful calls from the content script to add your own UI actions.
- Once you add storage/cross-tab logic, wire it into `background/service-worker.js` and request the minimum permissions you need.

## Next steps
- Capture a list of REST endpoints (method, URL, payload, response shape) in `docs/README.md`.
- Sketch the first UI pass (toolbar + keyboard shortcuts) in `content.js` and `styles/content.css`.
- Decide if you need `declarativeNetRequest` or a background worker for caching; otherwise stay content-script only.
