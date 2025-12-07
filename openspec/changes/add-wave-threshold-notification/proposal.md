# Change: Add wave threshold notification

## Why
Players currently have to manually refresh `active_wave.php?gate=3&wave=8` to see when the general spawns at 2500/2500; a lightweight notification reduces friction while keeping requests minimal.

## What Changes
- Add a background poller that fetches `active_wave.php?gate=3&wave=8` with credentials, parses `#waveThresholds .threshold-meta`, and adjusts polling cadence based on progress (60m / 30m / 10m).
- Issue a browser notification with the text "general spawned!" when 2500/2500 is observed or when the count resets after previously reaching the target; clicking opens the wave page.
- Request/verify notification permission, persist the last observed threshold to avoid duplicate alerts, and document the new permission/endpoint use.

## Impact
- Affected specs: wave-notifications
- Affected code: `extension/manifest.json`, `extension/src/background/service-worker.js`, `docs/*` (permission + endpoint notes)
