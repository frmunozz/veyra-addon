## 1. Implementation
- [x] 1.1 Add `notifications` (and any supporting) permission to `manifest.json`; keep content script ordering aligned with `constants.js` and feature scripts.
- [x] 1.2 Implement background poller for `active_wave.php?gate=3&wave=8` with credentialed fetch, dynamic intervals (60m/30m/10m), state persistence, and reset detection.
- [x] 1.3 Gate notifications on permission, emit "general spawned!" once per threshold/reset, and wire notification click to open the wave page.
- [x] 1.4 Document the new permission and endpoint usage for the wave notification feature.

## 2. Validation
- [x] 2.1 Run `openspec validate add-wave-threshold-notification --strict`.
- [ ] 2.2 Manual verification: observe polling cadence changes, confirm notification firing at 2500/2500 or after reset, and verify click opens the wave page while auth failures back off gracefully.
