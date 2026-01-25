# Change: Add wave monster sorting control

## Why
Players need a quick way to prioritize monsters by HP in wave battles; today they must scan each card manually.

## What Changes
- Add a sort-by selector in the Wave Tools panel on wave pages with options: default/original order, lowest hp, highest hp, highest max hp.
- Persist the selected sort per wave page and apply it on load without altering filter selections.
- Sort order derives from the HP stat value text on each monster card and preserves original order on ties.

## Impact
- Affected specs: wave-monster-tools
- Affected code: extension/src/content/wave-monster-tools.js, extension/src/styles/wave-monster-tools.css, docs/README.md
