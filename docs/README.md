# Project notes

## Objectives
- Improve the Veyra UI/UX with minimal, fast DOM injections.
- Add helper interactions that call the same REST endpoints as the game to reduce clicks/latency.
- Keep permissions tight; only request more (e.g., `declarativeNetRequest`) when needed.

## Baseline plan
1. **Phase 0:** Confirm injection. Keep only a content script that tweaks the DOM and logs REST traffic.
2. **Phase 1:** Build a fixed toolbar and keyboard shortcuts for frequent actions (next/prev wave, jump, auto-play).
3. **Phase 2:** Prefetch and cache common REST responses to avoid redundant calls.
4. **Phase 3 (optional):** Introduce a background service worker for cross-tab state or rules-based request handling.

## Endpoint log (fill as you explore)
- Record each endpoint you observe: URL, method, request params/body, cookies/headers, and response shape.
- Note which in-page actions trigger each call so you can replicate them from the content script.

## UI ideas to prototype
- Compact header/toolbar with large, keyboard-friendly targets.
- Overlay for quick navigation (gate/wave selectors).
- Inline stats/status card showing cached data (e.g., current wave info).

## Dev tips
- Reload the extension after manifest changes; for content script JS/CSS edits, a simple page refresh is enough.
- Use `response.clone()` when logging fetch responses so the page logic still consumes the original stream.
- Keep helper code in `src/lib/` small and focused to avoid coupling to page internals.
