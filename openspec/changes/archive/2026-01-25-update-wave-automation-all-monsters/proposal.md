# Change: Allow wave automation "All monsters" selection

## Why
Wave automation currently blocks enabling/running when the selected monster value is empty, which prevents using the built-in "All monsters" option in `#fNameSel` (value ""). Users need to automate the bulk "All monsters" selection.

## What Changes
- Treat the `#fNameSel` empty value ("All monsters") as a valid selection in the automation form and run sequence.
- Surface "All monsters" explicitly in the automation dropdown and persist it like other selections.
- Adjust validation/status messaging to error only when no valid option exists, not when the empty value is chosen.

## Impact
- Affected specs: wave-monster-tools
- Affected code: extension/src/content/wave-monster-tools.js, docs/README.md
