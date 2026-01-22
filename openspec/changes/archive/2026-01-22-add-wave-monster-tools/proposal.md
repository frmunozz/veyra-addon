# Change: Wave monster filtering and loot tooling

## Why
Players on wave pages need a faster way to filter visible monsters and loot dead monsters in bulk without manual clicks or losing track of results.

## What Changes
- Detect wave pages via `.monster-card` entries (or `#toggleDeadBtn`/known wave URLs) and surface a floating, toggleable filtering UI (top-right, below the header) that hides non-selected monsters by name. Filters persist per wave page and are shared between alive/dead views.
- Add bulk loot controls when viewing dead monsters (`hide_dead_monsters=0`), including sequential POSTs to `loot.php` with form-encoded `monster_id` and `user_id`, ~500ms delay, progress feedback, failure skips with counts, filter locking during runs, and an aggregated results modal, all housed in the floating menu.
- Replace dead monster card actions with explicit Quick loot/View buttons (aligned within the parent) and support a configurable bulk loot count (default 5) that caps at the available monsters; disable the floating-menu toggle and `#openBattleDrawerBtn` while either menu is open to prevent overlap; modals close via X or backdrop.
- Provide a footer toggle to show/hide dead monsters (cookie flip + reload), change the floating button label (closed: 🛠️; open: 🛠️ Wave filters and loot 🛠️), and load the feature only on wave pages via dedicated content/CSS files.

## Impact
- Affected specs: `wave-monster-tools`
- Affected code: content script DOM/menu layer, loot/fetch helpers, injected CSS for menu, optional background worker if fetch isolation is needed
