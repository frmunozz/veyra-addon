(() => {
  const C = window.VeyraAddonConstants || {};
  const TAG = C.TAG || "[Veyra Addon]";
  const STORAGE_KEY = C.STORAGE_KEY || "addonEnabled";
  const NATIVE_DRAWER_ID = C.NATIVE_DRAWER_ID || "sideDrawer";
  const ASIDE_ID = C.ASIDE_ID || "veyra-addon-aside";
  const ASIDE_TOGGLE_ID = C.ASIDE_TOGGLE_ID || "veyra-addon-aside-toggle";
  const NAV_FAB_ID = C.NAV_FAB_ID || "nav_fab";
  const ASIDE_BACKDROP_ID = C.ASIDE_BACKDROP_ID || "veyra-addon-aside-backdrop";
  const MENU_MOUNT_FLAG = C.MENU_MOUNT_FLAG || "veyraAddonMenuMounted";
  const FAVORITES_KEY = C.FAVORITES_KEY || "veyraAddonFavorites";
  const SECTION_STATE_KEY = C.SECTION_STATE_KEY || "veyraAddonSectionState";
  const GUILD_DASH_PATH = "/guild_dash.php";
  const LUNAR_EVENT_PATH = "/lunar_plague.php";
  const LUNAR_PROGRESS_REFRESH_MS = 5 * 60 * 1000;

  const DEFAULT_SECTION_STATE = {
    navigation: true,
    shortcuts: true,
  };

  const STATE = {
    asideBailed: false,
    favorites: [],
    navItems: [],
    holeItem: null,
    waveDropdown: buildWaveDropdown(),
    guildDropdown: buildGuildDungeonsDropdown(),
    lunarDropdown: buildLunarYearDropdown("Loading..."),
    lunarProgressTimer: null,
    lunarProgressInFlight: false,
    lunarProgressLastUpdatedAt: 0,
    navRoot: null,
    aside: null,
    navFab: null,
    backdrop: null,
    sectionState: loadSectionState(),
  };

  const log = (...args) => console.log(TAG, ...args);
  const warn = (...args) => console.warn(TAG, ...args);

  function cleanText(value) {
    return (value || "").replace(/\s+/g, " ").trim();
  }

  function normalizeHref(href) {
    try {
      const url = new URL(href, location.origin);
      return `${url.pathname}${url.search}${url.hash}`;
    } catch (_err) {
      return href;
    }
  }

  function favoriteKey(item) {
    return `${cleanText(item.label)}|${normalizeHref(item.href)}`;
  }

  function loadFavorites() {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((item) => {
          const label = cleanText(item.label);
          const href = item.href;
          if (!label || !href) return null;
          return {
            label,
            href,
            target: item.target || "",
            key: item.key || favoriteKey({ label, href }),
          };
        })
        .filter(Boolean);
    } catch (err) {
      warn("Failed to read favorites; falling back to empty list.", err);
      return [];
    }
  }

  function persistFavorites(favorites) {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch (err) {
      warn("Failed to persist favorites; continuing in-memory only.", err);
    }
  }

  function setFavorites(nextFavorites) {
    STATE.favorites = nextFavorites;
    persistFavorites(nextFavorites);
    renderNav();
  }

  function loadSectionState() {
    try {
      const stored = localStorage.getItem(SECTION_STATE_KEY);
      if (!stored) return { ...DEFAULT_SECTION_STATE };
      const parsed = JSON.parse(stored);
      if (!parsed || typeof parsed !== "object") return { ...DEFAULT_SECTION_STATE };
      return {
        ...DEFAULT_SECTION_STATE,
        navigation: parsed.navigation !== false,
        shortcuts: parsed.shortcuts !== false,
      };
    } catch (err) {
      warn("Failed to read section state; using defaults.", err);
      return { ...DEFAULT_SECTION_STATE };
    }
  }

  function persistSectionState(state) {
    try {
      localStorage.setItem(SECTION_STATE_KEY, JSON.stringify(state));
    } catch (err) {
      warn("Failed to persist section state; continuing in-memory only.", err);
    }
  }

  function extractNavItems(container) {
    const anchors = Array.from(container.querySelectorAll("a[href]"));
    const seen = new Set();

    return anchors
      .map((anchor) => {
        const label = cleanText(anchor.textContent);
        const href = anchor.getAttribute("href");
        if (!label || !href) return null;
        const target = anchor.getAttribute("target") || "";
        return { label, href, target, key: favoriteKey({ label, href }) };
      })
      .filter(Boolean)
      .filter((item) => {
        const key = `${item.label}|${item.href}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }

  function ensureAddonBackdrop() {
    let backdrop = document.getElementById(ASIDE_BACKDROP_ID);
    if (backdrop) return backdrop;

    backdrop = document.createElement("div");
    backdrop.id = ASIDE_BACKDROP_ID;
    backdrop.className = "veyra-addon-aside-backdrop";
    backdrop.setAttribute("aria-hidden", "true");
    document.body.appendChild(backdrop);
    return backdrop;
  }

  function setAsideCollapsed(aside, collapsed, toggle, backdrop) {
    const shouldCollapse = Boolean(collapsed);
    aside.classList.toggle("veyra-addon-aside--collapsed", shouldCollapse);
    aside.setAttribute("aria-hidden", String(shouldCollapse));
    if (toggle) {
      toggle.setAttribute("aria-expanded", String(!shouldCollapse));
      toggle.textContent = shouldCollapse ? "Open" : "Hide";
    }
    if (backdrop) {
      backdrop.dataset.open = String(!shouldCollapse);
      backdrop.style.pointerEvents = shouldCollapse ? "none" : "auto";
    }
    return shouldCollapse;
  }

  function toggleAsideCollapsed(aside, toggle, backdrop) {
    const nextCollapsed = !aside.classList.contains("veyra-addon-aside--collapsed");
    return setAsideCollapsed(aside, nextCollapsed, toggle, backdrop);
  }

  function buildAddonAside(startCollapsed = true, backdrop) {
    const aside = document.createElement("aside");
    aside.id = ASIDE_ID;
    aside.className = "veyra-addon-aside";

    const header = document.createElement("div");
    header.className = "veyra-addon-aside__header";

    const title = document.createElement("span");
    title.className = "veyra-addon-aside__title";

    const home = document.createElement("a");
    home.className = "veyra-addon-home";
    home.href = "/game_dash.php";
    home.textContent = "🏠";
    home.setAttribute("aria-label", "Go to home");
    title.appendChild(home);

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.id = ASIDE_TOGGLE_ID;
    toggle.className = "veyra-addon-aside__toggle";
    toggle.setAttribute("aria-expanded", startCollapsed ? "false" : "true");
    toggle.textContent = startCollapsed ? "Open" : "Hide";

    const nav = document.createElement("nav");
    nav.className = "veyra-addon-aside__nav";

    const sections = document.createElement("div");
    sections.className = "veyra-addon-aside__sections";
    nav.appendChild(sections);
    header.appendChild(title);
    header.appendChild(toggle);
    aside.appendChild(header);
    aside.appendChild(nav);

    const footer = document.createElement("div");
    footer.className = "veyra-addon-aside__footer";
    footer.textContent = "Veyra addon Menu";
    aside.appendChild(footer);

    toggle.addEventListener("click", () => toggleAsideCollapsed(aside, toggle, backdrop));
    setAsideCollapsed(aside, startCollapsed, toggle, backdrop);

    return { aside, sections, toggle };
  }

  function hideNativeDrawer(nativeDrawer) {
    nativeDrawer.dataset.veyraAddonHidden = "true";
    nativeDrawer.setAttribute("aria-hidden", "true");
    nativeDrawer.style.display = "none";
    nativeDrawer.style.visibility = "hidden";
    nativeDrawer.style.pointerEvents = "none";
  }

  function wireNavFabToggle(aside, toggle, navFab, backdrop) {
    if (!navFab) return null;
    const headerToggle = aside.querySelector(`#${ASIDE_TOGGLE_ID}`) || toggle;

    const handler = (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      const collapsed = aside.classList.contains("veyra-addon-aside--collapsed");
      setAsideCollapsed(aside, !collapsed, headerToggle, backdrop);
      navFab.setAttribute("aria-pressed", String(!collapsed));
      navFab.setAttribute("aria-expanded", String(!collapsed));
    };

    navFab.dataset.veyraAddonBound = "true";
    navFab.setAttribute("aria-controls", ASIDE_ID);
    navFab.setAttribute("aria-expanded", "false");
    navFab.addEventListener("click", handler, true);
    return navFab;
  }

  function dedupeItems(items) {
    const seen = new Set();
    return items.filter((item) => {
      const key = favoriteKey(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function isDecorative(item) {
    const label = cleanText(item.label).toLowerCase();
    return label.includes("side-title") || label.includes("side title") || label.includes("halloween");
  }

  function splitHole(items) {
    let hole = null;
    const rest = [];
    items.forEach((item) => {
      const label = cleanText(item.label).toLowerCase();
      const isHole = label === "hole" || item.href?.toLowerCase().includes("hole.php");
      if (!hole && isHole) {
        hole = { ...item, key: favoriteKey(item) };
        return;
      }
      rest.push(item);
    });
    return { hole, rest };
  }

  function ensureStaticLinks(items) {
    const entries = [
      { label: "Legendary Forge", href: "/legendary_forge.php", icon: "✨" },
      { label: "Adventurers Guild", href: "/adventurers_guild.php", icon: "🏤" },
    ];
    const keys = new Set(items.map((item) => favoriteKey(item)));

    entries.forEach((entry) => {
      const key = favoriteKey(entry);
      if (!keys.has(key)) {
        items.push({ ...entry, key });
      }
    });

    return items;
  }

  function createNavItem(label, href, target = "", extra = {}) {
    const cleanedLabel = cleanText(label);
    const cleanHref = href || "";
    return {
      label: cleanedLabel,
      href: cleanHref,
      target,
      icon: extra.icon,
      key: extra.key || favoriteKey({ label: cleanedLabel, href: cleanHref }),
    };
  }

  function buildWaveDropdown() {
    return {
      type: "dropdown",
      key: "grakthar-waves",
      label: "Grakthar Gate Waves",
      icon: "🌊",
      isOpen: false,
      items: [
        createNavItem("Grakthar - Wave 3", "/active_wave.php?gate=3&wave=8", "", {
          key: favoriteKey({ label: "Wave 3", href: "/active_wave.php?gate=3&wave=8" }),
          icon: "🌊",
        }),
        createNavItem("Grakthar - Wave 2", "/active_wave.php?gate=3&wave=5", "", {
          key: favoriteKey({ label: "Wave 2", href: "/active_wave.php?gate=3&wave=5" }),
          icon: "🌊",
        }),
        createNavItem("Grakthar - Wave 1", "/active_wave.php?gate=3&wave=3", "", {
          key: favoriteKey({ label: "Wave 1", href: "/active_wave.php?gate=3&wave=3" }),
          icon: "🌊",
        }),
      ],
    };
  }

  function buildGuildDungeonsDropdown(
    items = [{ type: "empty", label: "Loading...", key: "guild-dungeons-loading" }],
    isOpen = false
  ) {
    return {
      type: "dropdown",
      key: "guild-dungeons",
      label: "Guild Dungeons",
      icon: "🧌",
      isOpen,
      items,
    };
  }

  function buildLunarYearDropdown(progressLabel, isOpen = false) {
    return {
      type: "dropdown",
      key: "lunar-year-event",
      label: "Lunar Year Event",
      icon: "🐀",
      subLabel: progressLabel,
      isOpen,
      items: [
        createNavItem("Event Page", LUNAR_EVENT_PATH, "", {
          icon: "🐀",
          key: favoriteKey({ label: "Lunar Year Event", href: LUNAR_EVENT_PATH }),
        }),
        createNavItem("Battle Wave 3", "/active_wave.php?event=6&wave=3", "", {
          icon: "🌊",
          key: favoriteKey({ label: "Battle Wave 3", href: "/active_wave.php?event=6&wave=3" }),
        }),
      ],
    };
  }

  function buildCatalog() {
    const catalog = new Map();
    const addItem = (item) => {
      if (!item || !item.key) return;
      if (item.type === "empty") return;
      if (!catalog.has(item.key)) {
        catalog.set(item.key, item);
      }
    };

    if (STATE.holeItem) addItem(STATE.holeItem);
    STATE.navItems.forEach(addItem);
    STATE.waveDropdown.items.forEach(addItem);
    if (STATE.guildDropdown?.items) {
      STATE.guildDropdown.items.forEach(addItem);
    }
    if (STATE.lunarDropdown?.items) {
      STATE.lunarDropdown.items.forEach(addItem);
    }
    return catalog;
  }

  function buildSection(title, options = {}) {
    const section = document.createElement("section");
    section.className = "veyra-addon-section";
    const list = document.createElement("ul");
    list.className = "veyra-addon-aside__list";

    if (title) {
      const isCollapsible = Boolean(options.collapsibleKey);
      const heading = document.createElement(isCollapsible ? "button" : "div");
      heading.className = "veyra-addon-section__title";
      if (isCollapsible) {
        heading.classList.add("veyra-addon-section__title-button");
        heading.type = "button";
        const listId = `veyra-addon-${options.collapsibleKey}-list`;
        list.id = listId;
        heading.setAttribute("aria-controls", listId);
        let isOpen = STATE.sectionState[options.collapsibleKey] !== false;

        const titleSpan = document.createElement("span");
        titleSpan.textContent = title;
        const chevron = document.createElement("span");
        chevron.className = "veyra-addon-section__chevron";

        const applyVisibility = () => {
          section.classList.toggle("veyra-addon-section--collapsed", !isOpen);
          list.hidden = !isOpen;
          heading.setAttribute("aria-expanded", String(isOpen));
          chevron.textContent = isOpen ? "▾" : "▸";
        };

        heading.appendChild(titleSpan);
        heading.appendChild(chevron);
        applyVisibility();

        heading.addEventListener("click", () => {
          isOpen = !isOpen;
          STATE.sectionState[options.collapsibleKey] = isOpen;
          persistSectionState(STATE.sectionState);
          applyVisibility();
        });
      } else {
        heading.textContent = title;
      }

      section.appendChild(heading);
    }

    section.appendChild(list);
    return { section, list };
  }

  function createStarButton(item, isActive) {
    const star = document.createElement("button");
    star.type = "button";
    star.className = `veyra-addon-star ${isActive ? "veyra-addon-star--active" : ""}`;
    star.setAttribute("aria-pressed", String(Boolean(isActive)));
    star.setAttribute(
      "aria-label",
      isActive ? `Remove ${item.label} from favorites` : `Add ${item.label} to favorites`
    );
    star.textContent = isActive ? "★" : "☆";
    star.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const key = item.key || favoriteKey(item);
      const existingIndex = STATE.favorites.findIndex((fav) => fav.key === key);
      if (existingIndex >= 0) {
        const nextFavorites = [...STATE.favorites.slice(0, existingIndex), ...STATE.favorites.slice(existingIndex + 1)];
        setFavorites(nextFavorites);
      } else {
        const nextFavorites = [...STATE.favorites, { ...item, key }];
        setFavorites(nextFavorites);
      }
    });
    return star;
  }

  function createLinkRow(item, favoriteKeys, options = {}) {
    const li = document.createElement("li");
    li.className = "veyra-addon-aside__item";

    const row = document.createElement("div");
    row.className = "veyra-addon-row";

    const isFavorited = favoriteKeys.has(item.key);
    const disabled = options.disabled;
    if (disabled) {
      row.classList.add("veyra-addon-row--muted");
    }

    const link = document.createElement(options.asSpan ? "span" : "a");
    link.className = "veyra-addon-aside__link";
    const label = document.createElement("span");
    label.className = "veyra-addon-aside__label";
    if (item.icon) {
      const icon = document.createElement("span");
      icon.className = "veyra-addon-icon";
      icon.textContent = item.icon;
      label.appendChild(icon);
    }
    label.appendChild(document.createTextNode(item.label));
    link.appendChild(label);
    if (!options.asSpan) {
      link.href = item.href;
      if (item.target) {
        link.target = item.target;
      }
    }
    if (disabled) {
      link.setAttribute("aria-disabled", "true");
    }

    row.appendChild(link);

    if (!disabled && !options.hideStar) {
      const star = createStarButton(item, isFavorited);
      row.appendChild(star);
    }

    li.appendChild(row);
    return li;
  }

  function renderFavoritesSection(catalog) {
    const favoriteKeys = new Set(STATE.favorites.map((fav) => fav.key));
    const { section, list } = buildSection("Favorites");

    if (!STATE.favorites.length) {
      const empty = document.createElement("li");
      empty.className = "veyra-addon-aside__item veyra-addon-aside__item--empty";
      empty.textContent = "Star any menu item to pin it here.";
      list.appendChild(empty);
      return { section, favoriteKeys };
    }

    STATE.favorites.forEach((fav) => {
      const item = catalog.get(fav.key) || fav;
      list.appendChild(createLinkRow(item, favoriteKeys));
    });

    return { section, favoriteKeys };
  }

  function renderLinkGroup(title, items, favoriteKeys, options = {}) {
    if (!items.length) return null;
    const { section, list } = buildSection(title, options);
    items.forEach((item) => {
      list.appendChild(createLinkRow(item, favoriteKeys));
    });
    return section;
  }

  function renderDropdown(dropdown, favoriteKeys) {
    const wrapper = document.createElement("li");
    wrapper.className = "veyra-addon-dropdown";

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "veyra-addon-dropdown__toggle";
    toggle.setAttribute("aria-expanded", String(Boolean(dropdown.isOpen)));
    const label = document.createElement("span");
    label.className = "veyra-addon-dropdown__label";
    const main = document.createElement("span");
    main.className = "veyra-addon-dropdown__label-main";
    if (dropdown.icon) {
      const icon = document.createElement("span");
      icon.className = "veyra-addon-icon";
      icon.textContent = dropdown.icon;
      main.appendChild(icon);
    }
    main.appendChild(document.createTextNode(dropdown.label));
    label.appendChild(main);
    if (dropdown.subLabel) {
      const subLabel = document.createElement("span");
      subLabel.className = "veyra-addon-dropdown__sublabel";
      subLabel.textContent = dropdown.subLabel;
      label.appendChild(subLabel);
    }
    toggle.appendChild(label);

    const chevron = document.createElement("span");
    chevron.className = "veyra-addon-dropdown__chevron";
    chevron.setAttribute("aria-hidden", "true");
    chevron.textContent = dropdown.isOpen ? "▾" : "▸";
    toggle.appendChild(chevron);

    const list = document.createElement("ul");
    list.className = "veyra-addon-dropdown__list";
    list.hidden = !dropdown.isOpen;

    const dropdownItems = dropdown.items || [];

    if (!dropdownItems.length) {
      const empty = document.createElement("li");
      empty.className = "veyra-addon-aside__item veyra-addon-aside__item--empty";
      empty.textContent = "No items available.";
      list.appendChild(empty);
    } else {
      dropdownItems.forEach((item) => {
        if (item.type === "empty") {
          list.appendChild(createLinkRow(item, favoriteKeys, { asSpan: true, disabled: true, hideStar: true }));
        } else {
          list.appendChild(createLinkRow(item, favoriteKeys));
        }
      });
    }

    toggle.addEventListener("click", () => {
      dropdown.isOpen = !dropdown.isOpen;
      list.hidden = !dropdown.isOpen;
      toggle.setAttribute("aria-expanded", String(Boolean(dropdown.isOpen)));
      chevron.textContent = dropdown.isOpen ? "▾" : "▸";
    });

    wrapper.appendChild(toggle);
    wrapper.appendChild(list);
    return wrapper;
  }

  function renderNav() {
    if (!STATE.navRoot) return;
    STATE.navRoot.innerHTML = "";

    const catalog = buildCatalog();
    const { section: favoritesSection, favoriteKeys } = renderFavoritesSection(catalog);

    const dropdowns = [STATE.waveDropdown, STATE.guildDropdown, STATE.lunarDropdown].filter(Boolean);
    if (dropdowns.length) {
      const dropdownSection = buildSection("Shortcuts", { collapsibleKey: "shortcuts" });
      dropdowns.forEach((dropdown) => {
        dropdownSection.list.appendChild(renderDropdown(dropdown, favoriteKeys));
      });
      STATE.navRoot.appendChild(dropdownSection.section);
    }

    STATE.navRoot.appendChild(favoritesSection);

    const hasNavigation = Boolean(STATE.navItems.length || STATE.holeItem);
    if (hasNavigation) {
      const navigation = buildSection("Navigation", { collapsibleKey: "navigation" });
      STATE.navItems.forEach((item) => {
        navigation.list.appendChild(createLinkRow(item, favoriteKeys));
      });

      if (STATE.holeItem) {
        const separator = document.createElement("li");
        separator.className = "veyra-addon-aside__separator";
        separator.setAttribute("aria-hidden", "true");
        navigation.list.appendChild(separator);
        navigation.list.appendChild(createLinkRow(STATE.holeItem, favoriteKeys));
      }

      STATE.navRoot.appendChild(navigation.section);
    }
  }

  function parseNumberFromText(value, { pick = "first" } = {}) {
    const matches = (value || "").match(/[\d,]+/g);
    if (!matches || !matches.length) return null;
    const raw = pick === "last" ? matches[matches.length - 1] : matches[0];
    const parsed = Number(raw.replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }

  function formatCount(value) {
    if (!Number.isFinite(value)) return "—";
    return new Intl.NumberFormat("en-US").format(value);
  }

  function parseLunarProgress(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const rows = Array.from(doc.querySelectorAll("div.row"));
    const progressRow = rows.find((row) => {
      const text = cleanText(row.textContent || "").toLowerCase();
      return text.includes("rats culled") && text.includes("total");
    });

    if (!progressRow) return null;

    const rowText = cleanText(progressRow.textContent || "");
    const currentMatch = rowText.match(/([\d,]+)\s+rats\s+culled/i);
    const goalMatch = rowText.match(/to\s+([\d,]+)\s+total/i);
    const current = parseNumberFromText(currentMatch?.[1] || "", { pick: "first" });
    const goal = parseNumberFromText(goalMatch?.[1] || "", { pick: "last" });
    if (!Number.isFinite(current) || !Number.isFinite(goal)) {
      return null;
    }
    return { current, goal };
  }

  async function loadLunarProgress() {
    if (STATE.lunarProgressInFlight) return;
    STATE.lunarProgressInFlight = true;
    STATE.lunarProgressLastUpdatedAt = Date.now();

    try {
      const response = await fetch(LUNAR_EVENT_PATH, { credentials: "include" });
      if (!response.ok) {
        warn(`Lunar Year Event fetch failed with status ${response.status}; leaving fallback progress.`);
        if (STATE.lunarDropdown?.subLabel !== "—/—") {
          STATE.lunarDropdown = buildLunarYearDropdown("—/—", Boolean(STATE.lunarDropdown?.isOpen));
          renderNav();
        }
        return;
      }

      const html = await response.text();
      const parsed = parseLunarProgress(html);
      if (!parsed) {
        warn("Lunar Year Event progress parse failed; leaving fallback progress.");
        if (STATE.lunarDropdown?.subLabel !== "—/—") {
          STATE.lunarDropdown = buildLunarYearDropdown("—/—", Boolean(STATE.lunarDropdown?.isOpen));
          renderNav();
        }
        return;
      }

      const nextLabel = `${formatCount(parsed.current)}/${formatCount(parsed.goal)}`;
      if (STATE.lunarDropdown?.subLabel !== nextLabel) {
        STATE.lunarDropdown = buildLunarYearDropdown(nextLabel, Boolean(STATE.lunarDropdown?.isOpen));
        renderNav();
      }
    } catch (err) {
      warn("Lunar Year Event fetch threw; leaving fallback progress.", err);
      if (STATE.lunarDropdown?.subLabel !== "—/—") {
        STATE.lunarDropdown = buildLunarYearDropdown("—/—", Boolean(STATE.lunarDropdown?.isOpen));
        renderNav();
      }
    } finally {
      STATE.lunarProgressInFlight = false;
    }
  }

  function startLunarProgressRefresh() {
    if (STATE.lunarProgressTimer) return;
    if (!document.getElementById(ASIDE_ID)) return;

    loadLunarProgress();
    STATE.lunarProgressTimer = window.setInterval(() => {
      if (!document.getElementById(ASIDE_ID)) {
        window.clearInterval(STATE.lunarProgressTimer);
        STATE.lunarProgressTimer = null;
        return;
      }

      const elapsed = Date.now() - STATE.lunarProgressLastUpdatedAt;
      if (elapsed < LUNAR_PROGRESS_REFRESH_MS) return;
      loadLunarProgress();
    }, LUNAR_PROGRESS_REFRESH_MS);
  }

  function parseDungeonName(link) {
    const scopes = [link.closest(".card"), link.closest(".panel"), link.closest(".card-body"), link.parentElement].filter(
      Boolean
    );

    for (const scope of scopes) {
      const nameNode = scope.querySelector("h1, h2, h3, h4, h5, .card-title, .title, .dungeon-name, strong");
      const name = cleanText(nameNode?.textContent || "");
      if (name) return name;
    }

    let cursor = link.previousElementSibling;
    while (cursor) {
      const name = cleanText(cursor.textContent || "");
      if (name) return name;
      cursor = cursor.previousElementSibling;
    }

    return cleanText(link.textContent || "");
  }

  function extractDungeonNamesFromSelectors(doc) {
    const selectors = [
      "body > div.wrap > div:nth-child(6) > div:nth-child(1) > div > div:nth-child(1) > div:nth-child(2)",
      "body > div.wrap > div:nth-child(6) > div:nth-child(1) > div > div:nth-child(2) > div:nth-child(2)",
    ];

    return selectors
      .map((selector) => {
        const node = doc.querySelector(selector);
        return cleanText(node?.textContent || "");
      })
      .filter(Boolean);
  }

  function parseOpenDungeons(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const headings = Array.from(doc.querySelectorAll("h2"));
    const heading = headings.find((node) => cleanText(node.textContent).toLowerCase() === "open dungeons");
    if (!heading) {
      return { items: null, missing: true };
    }

    const region = document.createElement("div");
    let cursor = heading.nextElementSibling;
    while (cursor && cursor.tagName !== "H2") {
      region.appendChild(cursor.cloneNode(true));
      cursor = cursor.nextElementSibling;
    }

    const links = Array.from(region.querySelectorAll("a[href*='guild_dungeon_instance']"));
    const nameHints = extractDungeonNamesFromSelectors(doc);
    const entries = links
      .map((link, index) => {
        const href = link.getAttribute("href");
        const hintedName = nameHints[index];
        const name = hintedName || parseDungeonName(link);
        if (!href || !name) return null;
        return createNavItem(name, href, link.getAttribute("target") || "", { icon: "🧌" });
      })
      .filter(Boolean);

    return { items: dedupeItems(entries), missing: false };
  }

  function syncDungeonFavorites(latestItems) {
    if (!Array.isArray(latestItems) || !latestItems.length || !STATE.favorites.length) return;
    const latestByLabel = new Map();
    latestItems.forEach((item) => {
      const label = cleanText(item.label).toLowerCase();
      if (label) latestByLabel.set(label, item);
    });

    let changed = false;
    const seen = new Set();
    const nextFavorites = [];

    STATE.favorites.forEach((fav) => {
      let nextFav = fav;
      const isDungeon = fav.href?.includes("guild_dungeon_instance");
      if (isDungeon) {
        const match = latestByLabel.get(cleanText(fav.label).toLowerCase());
        if (match && match.href !== fav.href) {
          nextFav = {
            ...fav,
            href: match.href,
            target: match.target || fav.target || "",
            key: favoriteKey({ label: fav.label, href: match.href }),
          };
          changed = true;
        }
      }

      if (!seen.has(nextFav.key)) {
        seen.add(nextFav.key);
        nextFavorites.push(nextFav);
      }
    });

    if (changed) {
      setFavorites(nextFavorites);
    }
  }

  async function loadGuildDungeons() {
    if (!STATE.guildDropdown) {
      STATE.guildDropdown = buildGuildDungeonsDropdown(undefined, false);
      renderNav();
    }

    try {
      const response = await fetch(GUILD_DASH_PATH, { credentials: "include" });
      if (!response.ok) {
        warn(`Guild dungeons fetch failed with status ${response.status}; showing error state.`);
        STATE.guildDropdown = buildGuildDungeonsDropdown([
          { type: "empty", label: "Failed to load guild dungeons", key: "guild-dungeons-error" },
        ], Boolean(STATE.guildDropdown?.isOpen));
        renderNav();
        return;
      }

      const html = await response.text();
      const parsed = parseOpenDungeons(html);
      if (parsed.missing) {
        warn("Open Dungeons section not found; showing error state.");
        STATE.guildDropdown = buildGuildDungeonsDropdown([
          { type: "empty", label: "Failed to load guild dungeons", key: "guild-dungeons-error" },
        ], Boolean(STATE.guildDropdown?.isOpen));
        renderNav();
        return;
      }

      if (!parsed.items || !parsed.items.length) {
        STATE.guildDropdown = buildGuildDungeonsDropdown([
          { type: "empty", label: "No open dungeons", key: "guild-dungeons-empty" },
        ], Boolean(STATE.guildDropdown?.isOpen));
        renderNav();
        return;
      }

      STATE.guildDropdown = buildGuildDungeonsDropdown(parsed.items, Boolean(STATE.guildDropdown?.isOpen));
      syncDungeonFavorites(parsed.items);
      renderNav();
    } catch (err) {
      warn("Guild dungeons fetch threw; showing error state.", err);
      STATE.guildDropdown = buildGuildDungeonsDropdown([
        { type: "empty", label: "Failed to load guild dungeons", key: "guild-dungeons-error" },
      ], Boolean(STATE.guildDropdown?.isOpen));
      renderNav();
    }
  }

  function prepareNavItems(rawNavItems) {
    const filtered = dedupeItems(rawNavItems.filter((item) => !isDecorative(item)));
    const { hole, rest } = splitHole(filtered);
    const withStatic = ensureStaticLinks(rest);
    STATE.navItems = withStatic.map((item) => ({ ...item, key: favoriteKey(item) }));
    STATE.holeItem = hole;
  }

  function initAddonAside() {
    if (document.getElementById(ASIDE_ID)) {
      return true;
    }

    const nativeDrawer = document.getElementById(NATIVE_DRAWER_ID);
    const navFab = document.getElementById(NAV_FAB_ID);
    if (!nativeDrawer || !navFab) {
      if (!STATE.asideBailed) {
        STATE.asideBailed = true;
        warn("Native drawer or nav toggle not found; addon aside disabled and native drawer left intact.");
      }
      return false;
    }

    try {
      const navItems = extractNavItems(nativeDrawer);
      if (!navItems.length) {
        if (!STATE.asideBailed) {
          STATE.asideBailed = true;
          warn("No links found in native drawer; skipping addon aside and preserving page menu.");
        }
        return false;
      }

      prepareNavItems(navItems);
      STATE.favorites = loadFavorites();

      const backdrop = ensureAddonBackdrop();
      const { aside, sections, toggle } = buildAddonAside(true, backdrop);
      STATE.aside = aside;
      STATE.navRoot = sections;
      STATE.navFab = navFab;
      STATE.backdrop = backdrop;

      backdrop.addEventListener("click", () => {
        const headerToggle = document.getElementById(ASIDE_TOGGLE_ID);
        setAsideCollapsed(STATE.aside, true, headerToggle, backdrop);
        navFab.setAttribute("aria-pressed", "false");
        navFab.setAttribute("aria-expanded", "false");
      });

      document.body.appendChild(aside);
      const boundFab = wireNavFabToggle(aside, toggle, navFab, backdrop);
      if (!boundFab) {
        warn("nav_fab button not found; using header toggle instead.");
      }

      hideNativeDrawer(nativeDrawer);
      renderNav();
      return true;
    } catch (err) {
      if (!STATE.asideBailed) {
        STATE.asideBailed = true;
        warn("Addon aside failed to mount; leaving native drawer untouched.", err);
      }
      return false;
    }
  }

  async function initGuildDungeonsDropdown() {
    await loadGuildDungeons();
  }

  function getEnabledFlag() {
    return new Promise((resolve) => {
      try {
        if (!chrome?.storage?.local) {
          resolve(true);
          return;
        }

        chrome.storage.local.get([STORAGE_KEY], (result) => {
          if (chrome.runtime?.lastError) {
            log("storage read failed", chrome.runtime.lastError);
            resolve(true);
            return;
          }
          resolve(result?.[STORAGE_KEY] !== false);
        });
      } catch (err) {
        log("storage read threw", err);
        resolve(true);
      }
    });
  }

  function startAddonMenu() {
    if (document.documentElement.dataset[MENU_MOUNT_FLAG]) {
      return;
    }

    getEnabledFlag().then((enabled) => {
      if (!enabled) {
        log("Addon disabled via popup; skipping menu init.");
        return;
      }

      document.documentElement.dataset[MENU_MOUNT_FLAG] = "true";
      const mounted = initAddonAside();
      if (!mounted) return;
      initGuildDungeonsDropdown();
      startLunarProgressRefresh();
    });
  }

  function init() {
    if (document.documentElement.dataset[MENU_MOUNT_FLAG]) {
      return;
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", startAddonMenu, { once: true });
      return;
    }

    startAddonMenu();
  }

  init();
})();
