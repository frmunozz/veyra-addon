# Veyra addon fetch playbook

## Defaults
- Use `fetch(url, { credentials: "include" })`; avoid extra headers unless an endpoint rejects missing ones.
- Let the browser supply cookies/UA; do not spoof referers or add custom headers by default.
- When logging, clone the response (`response.clone()`) so the page can still consume the stream.
- Wrap calls in try/catch and log a concise `[Veyra Addon]` warning on failure; bail out of that feature instead of throwing uncaught errors.

## Static page shortcuts (links or optional prefetch)
- Legendary Forge: `/legendary_forge.php`
- Adventurers Guild: `/adventurers_guild.php`
- Grakthar Gate Waves: `/active_wave.php?gate=3&wave=8|5|3`
- Pattern: plain `fetch` with credentials; navigation uses `<a>` elements, prefetch only if needed.

## Guild Dungeons (Open Dungeons scrape)
- Endpoint: `GET /guild_dash.php` with `credentials: "include"`.
- Parsing: find `h2.title` with text "Open Dungeons", then for each card read the dungeon name and the primary "Enter" link (e.g., `guild_dungeon_instance.php?id=...`).
- Fallbacks: if fetch is blocked/non-OK or markup changes, log once and skip rendering the Guild Dungeons dropdown so the native drawer stays intact.

## Documentation habit
- When replicating any new endpoint, record method, URL, params, headers (if required), and triggering UI action in `docs/fetch-guidelines.md` (or a feature-specific doc).
