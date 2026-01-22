(() => {
  const C = window.VeyraAddonConstants || {};
  const TAG = C.TAG || "[Veyra Addon]";
  const MENU_ID = "veyra-addon-wave-menu";
  const PANEL_ID = "veyra-addon-wave-panel";
  const TOGGLE_ID = "veyra-addon-wave-toggle";
  const FILTER_LIST_ID = "veyra-addon-wave-filter";
  const PROGRESS_ID = "veyra-addon-wave-progress";
  const MODAL_ROOT_ID = "veyra-addon-wave-modal-root";
  const BATTLE_DRAWER_TOGGLE_ID = "openBattleDrawerBtn";
  const HIDE_DEAD_COOKIE = "hide_dead_monsters";
  const USER_ID_COOKIE = "demon";
  const BULK_DEFAULT_COUNT = 5;
  const LOOT_DELAY_MS = 520;
  const AUTOMATION_STORAGE_PREFIX = "veyra-addon-wave-automation";
  const WAVE_QOL_PANEL_ID = "waveQolPanel";
  const WAVE_QOL_SELECT_ID = "fNameSel";
  const WAVE_QOL_UNJOINED_ID = "fUnjoined";
  const WAVE_QOL_SELECT_VISIBLE_ID = "btnSelectVisible";
  const WAVE_QOL_ATTACKS_SELECTOR = "#waveQolPanel > div.qol-top > div.qol-attacks > button";
  const DEFAULT_ATTACK_STAM = 50;
  const DEFAULT_RELOAD_DELAY_SEC = 30;
  const STAMINA_VALUE_ID = "stamina_span";
  const PAGE_LOAD_TIMESTAMP = Date.now();
  const DATASET_NAME_KEY = "veyraAddonMonsterName";
  const DATASET_ID_KEY = "veyraAddonMonsterId";
  const GUILD_MONSTER_CONTAINER_SELECTORS = [
    "body > div.wrap > div.grid > div:nth-child(1) > div:nth-child(2)",
    "body > div.wrap > div.grid > div:nth-child(1)",
    "body > div.wrap > div.grid",
    "body > div.wrap",
  ];
  const WAVE_WHITELIST = [
    "/active_wave.php?gate=3&wave=3",
    "/active_wave.php?gate=3&wave=5",
    "/active_wave.php?gate=3&wave=8",
  ];

  const log = (...args) => console.log(TAG, ...args);
  const warn = (...args) => console.warn(TAG, ...args);
  const error = (...args) => console.error(TAG, ...args);

  const cleanText = (value) => (value || "").replace(/\s+/g, " ").trim();
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const detectPageType = () => {
    const path = String(location.pathname || "");
    if (path.endsWith("/active_wave.php")) return "wave";
    if (path.endsWith("/guild_dungeon_location.php")) return "guild_dungeon_location";
    return "unknown";
  };

  const getCookie = (name) => {
    const cookies = document.cookie ? document.cookie.split(";") : [];
    for (const cookie of cookies) {
      const [rawKey, ...rawVal] = cookie.split("=");
      if (!rawKey) continue;
      if (rawKey.trim() === name) return decodeURIComponent(rawVal.join("="));
    }
    return null;
  };

  const shouldShowDeadMonsters = () => getCookie(HIDE_DEAD_COOKIE) === "0";

  const isElementVisible = (el) => {
    if (!el) return false;
    return !!(el.offsetParent || el.getClientRects().length);
  };

  const extractMonsterId = (href) => {
    if (!href) return null;
    try {
      const url = new URL(href, location.origin);
      return (
        url.searchParams.get("id") ||
        url.searchParams.get("monster_id") ||
        url.searchParams.get("monsterId") ||
        url.searchParams.get("enemy_id") ||
        url.searchParams.get("dgmid") ||
        url.searchParams.get("dgmId")
      );
    } catch (_err) {
      return null;
    }
  };

  const extractInstanceId = (href) => {
    if (!href) return null;
    try {
      const url = new URL(href, location.origin);
      return url.searchParams.get("instance_id") || url.searchParams.get("instanceId");
    } catch (_err) {
      return null;
    }
  };

  const extractMonsterIdFromInputs = (root) => {
    if (!root) return null;
    const candidate =
      root.querySelector("input[name='monster_id']") ||
      root.querySelector("input[name='monsterId']") ||
      root.querySelector("input[name='id']") ||
      root.querySelector("input[name='enemy_id']");
    const value = candidate ? cleanText(candidate.value) : "";
    return value || null;
  };

  const extractMonsterIdFromLinks = (root) => {
    if (!root) return null;
    const links = Array.from(root.querySelectorAll("a[href]"))
      .map((a) => a.getAttribute("href"))
      .filter(Boolean);
    for (const href of links) {
      const id = extractMonsterId(href);
      if (id) return id;
    }
    return null;
  };

  const extractGuildUserId = () => {
    const healButton =
      document.getElementById("healBtn") || document.querySelector("button[onclick*='healDungeonPlayer']");
    if (!healButton) return null;
    const handler = healButton.getAttribute("onclick") || "";
    const match = handler.match(/healDungeonPlayer\([^,]+,\s*(\d+)/);
    return match ? match[1] : null;
  };

  const resolveUserId = (pageType) => {
    const fromCookie = getCookie(USER_ID_COOKIE) || getCookie("user_id");
    if (fromCookie) return fromCookie;
    if (pageType === "guild_dungeon_location") return extractGuildUserId();
    return null;
  };

  const pickViewHref = (root, monsterId) => {
    if (!root) return "";
    const links = Array.from(root.querySelectorAll("a[href]"))
      .map((a) => a.getAttribute("href"))
      .filter((href) => href && !href.startsWith("#") && !href.startsWith("javascript:"));
    if (!links.length) return "";
    if (monsterId) {
      const exact = links.find((href) => String(extractMonsterId(href) || "") === String(monsterId));
      if (exact) return exact;
    }
    return links[0] || "";
  };

  const findGuildMonsterContainer = () => {
    for (const selector of GUILD_MONSTER_CONTAINER_SELECTORS) {
      const node = document.querySelector(selector);
      if (!node) continue;
      if (node.querySelector(".mon")) return node;
    }
    return null;
  };

  const extractGuildMonsterName = (titleNode) => {
    if (!titleNode) return "";
    const clone = titleNode.cloneNode(true);
    clone.querySelectorAll(".row, .pill, .veyra-addon-wave-alive-count, .veyra-addon-wave-actions").forEach((n) => {
      n.remove();
    });
    return cleanText(clone.textContent);
  };

  const isWhitelistedWaveUrl = () => {
    try {
      const url = new URL(location.href);
      const key = `${url.pathname}?${url.searchParams.toString()}`;
      return WAVE_WHITELIST.includes(key);
    } catch (_err) {
      return false;
    }
  };

  const collectMonsterCards = () => {
    const cards = Array.from(
      document.querySelectorAll(
        ".monster-container .monster-card, .monster-card, [data-monster-id].monster-card, .monster-card[data-monster-id]",
      ),
    );
    return cards
      .map((el) => {
        const storedName = cleanText(el.dataset && el.dataset[DATASET_NAME_KEY]);
        const nameNode = el.querySelector("h3") || el.querySelector("strong");
        const name =
          storedName ||
          cleanText(nameNode ? nameNode.textContent : "") ||
          cleanText(el.getAttribute("data-name")) ||
          cleanText(el.dataset && el.dataset.name) ||
          "";
        if (!storedName && name) {
          el.dataset[DATASET_NAME_KEY] = name;
        }
        const cta =
          el.querySelector("a[href*='battle.php']") ||
          el.querySelector(":scope > div:nth-child(2) > a[href]") ||
          el.querySelector("a[href]");
        const viewHref = cta ? cta.getAttribute("href") : "";
        const monsterId =
          el.getAttribute("data-monster-id") ||
          (el.dataset && el.dataset.monsterId) ||
          extractMonsterId(viewHref) ||
          extractMonsterId(el.getAttribute("href"));
        const label = name || (monsterId ? `Monster ${monsterId}` : "Unknown");
        return {
          el,
          name: label,
          cta,
          viewHref,
          monsterId,
          isDead: false,
        };
      })
      .filter((entry) => entry && entry.el && entry.name);
  };

  const collectGuildDungeonMonsters = () => {
    const container = findGuildMonsterContainer();
    if (!container) return [];

    const cards = Array.from(container.querySelectorAll("div.mon"));
    return cards
      .map((el) => {
        const storedName = cleanText(el.dataset && el.dataset[DATASET_NAME_KEY]);
        const detailColumn = el.querySelector(":scope > div");
        const titleNode = detailColumn ? detailColumn.querySelector(":scope > div") : null;

        let name = storedName || extractGuildMonsterName(titleNode);
        if (!name) {
          const img = el.querySelector("img[alt]");
          name = cleanText(img ? img.getAttribute("alt") : "");
        }

        if (!storedName && name) {
          el.dataset[DATASET_NAME_KEY] = name;
        }

        const storedMonsterId = cleanText(el.dataset && el.dataset[DATASET_ID_KEY]);
        const viewLink =
          el.querySelector("a.btn[href*='battle.php']") ||
          el.querySelector("a[href*='battle.php']") ||
          el.querySelector("a.btn[href]") ||
          el.querySelector("a[href]");
        const viewHref = viewLink ? viewLink.getAttribute("href") : "";
        const instanceId = extractInstanceId(viewHref);

        const monsterId =
          storedMonsterId ||
          el.getAttribute("data-monster-id") ||
          (el.dataset && (el.dataset.monsterId || el.dataset.monster_id || el.dataset.id)) ||
          extractMonsterIdFromInputs(el) ||
          extractMonsterId(viewHref) ||
          extractMonsterIdFromLinks(el);

        if (!storedMonsterId && monsterId) {
          el.dataset[DATASET_ID_KEY] = monsterId;
        }

        const label = name || (monsterId ? `Monster ${monsterId}` : "Unknown");
        const canLoot = Boolean(el.querySelector(".pill-warn")) && Boolean(monsterId);
        return {
          el,
          name: label,
          monsterId,
          viewHref,
          cta: null,
          isDead: el.classList.contains("dead"),
          nameNode: titleNode || null,
          actionsContainer: viewLink ? viewLink.parentElement : null,
          instanceId: instanceId || null,
          canLoot,
        };
      })
      .filter((entry) => entry && entry.el && entry.name);
  };

  const waitForWaveMarkers = async () => {
    const maxAttempts = 10;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const cards = collectMonsterCards();
      const markerFound =
        Boolean(cards.length) || Boolean(document.getElementById("toggleDeadBtn")) || isWhitelistedWaveUrl();
      if (markerFound) {
        return { cards, markerFound };
      }
      await wait(150);
    }
    return { cards: [], markerFound: false };
  };

  const waitForGuildDungeonMarkers = async () => {
    const maxAttempts = 10;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const cards = collectGuildDungeonMonsters();
      const markerFound = Boolean(cards.length);
      if (markerFound) {
        return { cards, markerFound };
      }
      await wait(150);
    }
    return { cards: [], markerFound: false };
  };

  let warnedNoWave = false;
  let monsterCards = [];

  const start = async () => {
    const pageType = detectPageType();
    const { cards, markerFound } =
      pageType === "guild_dungeon_location" ? await waitForGuildDungeonMarkers() : await waitForWaveMarkers();
    if (!markerFound) {
      if (!warnedNoWave) {
        warnedNoWave = true;
        warn("Wave/dungeon page not detected; skipping monster tooling.");
      }
      return;
    }

    const isWavePage = pageType === "wave";
    if (isWavePage) {
      const gateInfo = document.querySelector("body > div.gate-info");
      if (gateInfo) {
        gateInfo.style.display = "none";
      }
    }

    if (document.getElementById(MENU_ID)) {
      return;
    }

    const showDead = isWavePage ? shouldShowDeadMonsters() : true;
    monsterCards = isWavePage ? cards.map((card) => ({ ...card, isDead: showDead })) : cards;

    const storageKey = (() => {
      if (pageType === "guild_dungeon_location") {
        try {
          const url = new URL(location.href);
          const locationId = url.searchParams.get("location_id");
          if (locationId) {
            return `veyra-addon-wave-filters:${location.pathname}:location_id=${locationId}`;
          }
        } catch (_err) {
          // ignore
        }
      }
      return `veyra-addon-wave-filters:${location.pathname}?${location.search}`;
    })();
    const uniqueNames = Array.from(new Set(monsterCards.map((card) => card.name))).filter(Boolean);

    const loadSavedFilters = () => {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored === null) return null;
        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed)) return null;
        return parsed.filter((name) => typeof name === "string" && name.trim());
      } catch (_err) {
        return null;
      }
    };

    const saveFilters = (namesSet) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(Array.from(namesSet)));
      } catch (_err) {
        // ignore storage failures
      }
    };

    const saved = loadSavedFilters();
    const savedProvided = saved !== null;
    const savedCount = savedProvided ? saved.length : 0;
    const savedNames = savedProvided ? saved.filter((name) => uniqueNames.includes(name)) : [];
    const selectedNames =
      !savedProvided
        ? new Set(uniqueNames)
        : savedCount === 0
          ? new Set()
          : savedNames.length
          ? new Set(savedNames)
          : new Set(uniqueNames);

    const userId = resolveUserId(pageType);
    const pageInstanceId = (() => {
      if (pageType !== "guild_dungeon_location") return null;
      try {
        const url = new URL(location.href);
        return url.searchParams.get("instance_id");
      } catch (_err) {
        return null;
      }
    })();

    const lootedMonsterIds = new Set();
    const monsterCounts = monsterCards.reduce((acc, card) => {
      acc.set(card.name, (acc.get(card.name) || 0) + 1);
      return acc;
    }, new Map());

    const aliveCounts = monsterCards.reduce((acc, card) => {
      if (!card || !card.name) return acc;
      if (!card.isDead) {
        acc.set(card.name, (acc.get(card.name) || 0) + 1);
      }
      return acc;
    }, new Map());
    const formatCount = (count) => {
      const raw = Number.isFinite(count) ? count : 0;
      return raw < 100 ? String(raw).padStart(2, "0") : String(raw);
    };

    if (pageType === "guild_dungeon_location") {
      monsterCards.forEach((card) => {
        const node = card.nameNode;
        if (!node) return;
        if (node.querySelector(".veyra-addon-wave-alive-count")) return;
        const alive = aliveCounts.get(card.name) || 0;
        const total = monsterCounts.get(card.name) || 0;
        const badge = document.createElement("span");
        badge.className = "veyra-addon-wave-alive-count";
        badge.textContent = `[${formatCount(alive)}/${formatCount(total)}] `;
        const row = node.querySelector(":scope > .row") || node.querySelector(".row");
        if (row) {
          row.insertAdjacentElement("afterend", badge);
        } else {
          node.prepend(badge);
        }
      });
    }

    const STATE = {
      selectedNames,
      panelOpen: false,
      bulkRunning: false,
      bulkStopRequested: false,
      imagesVisible: true,
    };

    const menuRoot = document.createElement("div");
    menuRoot.id = MENU_ID;
    menuRoot.className = "veyra-addon-wave-menu";

    const toggleButton = document.createElement("button");
    toggleButton.id = TOGGLE_ID;
    toggleButton.type = "button";
    toggleButton.className = "veyra-addon-wave-toggle";
    toggleButton.setAttribute("aria-expanded", "false");
    toggleButton.textContent = "🛠️";

    const panel = document.createElement("div");
    panel.id = PANEL_ID;
    panel.className = "veyra-addon-wave-panel";
    panel.hidden = true;
    panel.style.display = "none";

    const filterSection = document.createElement("div");
    filterSection.className = "veyra-addon-wave-section";
    const filterHeading = document.createElement("div");
    filterHeading.className = "veyra-addon-wave-section__title veyra-addon-wave-section__title--row";

    const filterHeadingText = document.createElement("span");
    filterHeadingText.className = "veyra-addon-wave-section__title-text";
    filterHeadingText.textContent = "Filter monsters";

    const filterHeadingActions = document.createElement("div");
    filterHeadingActions.className = "veyra-addon-wave-section__actions";

    const hideAllButton = document.createElement("button");
    hideAllButton.type = "button";
    hideAllButton.className = "veyra-addon-wave-mini-button";
    hideAllButton.textContent = "hide all";
    hideAllButton.disabled = !uniqueNames.length;

    const showAllButton = document.createElement("button");
    showAllButton.type = "button";
    showAllButton.className = "veyra-addon-wave-mini-button";
    showAllButton.textContent = "show all";
    showAllButton.disabled = !uniqueNames.length;

    hideAllButton.addEventListener("click", () => {
      if (STATE.bulkRunning) return;
      STATE.selectedNames.clear();
      filterList.querySelectorAll("input[type='checkbox']").forEach((input) => {
        input.checked = false;
      });
      saveFilters(STATE.selectedNames);
      applyFilters();
    });

    showAllButton.addEventListener("click", () => {
      if (STATE.bulkRunning) return;
      STATE.selectedNames.clear();
      uniqueNames.forEach((name) => STATE.selectedNames.add(name));
      filterList.querySelectorAll("input[type='checkbox']").forEach((input) => {
        input.checked = true;
      });
      saveFilters(STATE.selectedNames);
      applyFilters();
    });

    filterHeadingActions.appendChild(hideAllButton);
    filterHeadingActions.appendChild(showAllButton);
    filterHeading.appendChild(filterHeadingText);
    filterHeading.appendChild(filterHeadingActions);
    const filterList = document.createElement("div");
    filterList.id = FILTER_LIST_ID;
    filterList.className = "veyra-addon-wave-filter";

    if (!uniqueNames.length) {
      const empty = document.createElement("div");
      empty.className = "veyra-addon-wave-empty";
      empty.textContent = "No monsters detected to filter.";
      filterList.appendChild(empty);
    } else {
      uniqueNames.sort().forEach((name) => {
        const label = document.createElement("label");
        label.className = "veyra-addon-wave-filter__option";
        label.setAttribute("data-name", name);

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        const shouldCheck = STATE.selectedNames.has(name);
        checkbox.checked = shouldCheck;
        checkbox.value = name;

        const optionLabel = document.createElement("span");
        optionLabel.textContent = `[${formatCount(monsterCounts.get(name) || 0)}] ${name}`;

        checkbox.addEventListener("change", () => {
          if (STATE.bulkRunning) {
            checkbox.checked = STATE.selectedNames.has(name);
            return;
          }
          if (checkbox.checked) {
            STATE.selectedNames.add(name);
          } else {
            STATE.selectedNames.delete(name);
          }
          saveFilters(STATE.selectedNames);
          applyFilters();
        });

        label.appendChild(checkbox);
        label.appendChild(optionLabel);
        filterList.appendChild(label);
      });
    }

    const imagesToggle = document.createElement("label");
    imagesToggle.className = "veyra-addon-wave-toggle-row";

    const imagesCheckbox = document.createElement("input");
    imagesCheckbox.type = "checkbox";
    imagesCheckbox.checked = STATE.imagesVisible;
    imagesCheckbox.className = "veyra-addon-wave-toggle-row__checkbox";
    imagesCheckbox.setAttribute("aria-label", "Toggle monster images");
    imagesCheckbox.addEventListener("change", () => {
      if (STATE.bulkRunning) {
        imagesCheckbox.checked = STATE.imagesVisible;
        return;
      }
      STATE.imagesVisible = imagesCheckbox.checked;
      applyImageVisibility();
    });

    const imagesText = document.createElement("span");
    imagesText.textContent = "Show monster images";

    imagesToggle.appendChild(imagesCheckbox);
    imagesToggle.appendChild(imagesText);

    filterSection.appendChild(filterHeading);
    filterSection.appendChild(filterList);
    if (isWavePage) {
      filterSection.appendChild(imagesToggle);
    }
    panel.appendChild(filterSection);

    let bulkCustomInput = null;
    let bulkCustomButton = null;
    let bulkStopButton = null;
    const bulkQuickButtons = [];
    const bulkSection = document.createElement("div");
    bulkSection.className = "veyra-addon-wave-section";
    const bulkHeading = document.createElement("div");
    bulkHeading.className = "veyra-addon-wave-section__title";
    bulkHeading.textContent = "Bulk loot";
    const bulkControls = document.createElement("div");
    bulkControls.className = "veyra-addon-wave-bulk";

    const bulkInfo = document.createElement("div");
    bulkInfo.className = "veyra-addon-wave-bulk__info";
    bulkInfo.textContent = isWavePage
      ? showDead
        ? "Loots visible dead monsters in sequence (skips already-looted this session)."
        : "Dead monsters hidden; bulk loot unavailable."
      : "Loots visible dead monsters in sequence (skips already-looted this session).";

    const bulkLootEnabled = !isWavePage || showDead;
    if (bulkLootEnabled) {
      const quickRow = document.createElement("div");
      quickRow.className = "veyra-addon-wave-bulk__quick";

      const makeQuickButton = (label, handler) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "veyra-addon-wave-bulk__button veyra-addon-wave-bulk__button--small";
        button.textContent = label;
        button.addEventListener("click", handler);
        bulkQuickButtons.push(button);
        return button;
      };

      quickRow.appendChild(
        makeQuickButton("1", async () => {
          if (STATE.bulkRunning) return;
          await runBulkLoot(1);
        }),
      );
      quickRow.appendChild(
        makeQuickButton("5", async () => {
          if (STATE.bulkRunning) return;
          await runBulkLoot(5);
        }),
      );
      quickRow.appendChild(
        makeQuickButton("10", async () => {
          if (STATE.bulkRunning) return;
          await runBulkLoot(10);
        }),
      );
      quickRow.appendChild(
        makeQuickButton("15", async () => {
          if (STATE.bulkRunning) return;
          await runBulkLoot(15);
        }),
      );
      quickRow.appendChild(
        makeQuickButton("all", async () => {
          if (STATE.bulkRunning) return;
          const ok = window.confirm("Bulk loot ALL eligible visible monsters? This may take a while.");
          if (!ok) return;
          await runBulkLoot(Number.POSITIVE_INFINITY);
        }),
      );

      bulkStopButton = document.createElement("button");
      bulkStopButton.type = "button";
      bulkStopButton.className = "veyra-addon-wave-bulk__button veyra-addon-wave-bulk__button--stop veyra-addon-wave-bulk__button--small";
      bulkStopButton.textContent = "Stop";
      bulkStopButton.hidden = true;
      bulkStopButton.disabled = true;
      bulkStopButton.addEventListener("click", () => {
        if (!STATE.bulkRunning) return;
        STATE.bulkStopRequested = true;
        bulkStopButton.disabled = true;
        bulkStopButton.textContent = "Stopping...";
      });
      quickRow.appendChild(bulkStopButton);

      const customRow = document.createElement("div");
      customRow.className = "veyra-addon-wave-bulk__custom";

      bulkCustomInput = document.createElement("input");
      bulkCustomInput.type = "number";
      bulkCustomInput.min = "1";
      bulkCustomInput.value = String(BULK_DEFAULT_COUNT);
      bulkCustomInput.className = "veyra-addon-wave-bulk__input";
      bulkCustomInput.setAttribute("aria-label", "Custom monsters to loot");

      bulkCustomButton = document.createElement("button");
      bulkCustomButton.type = "button";
      bulkCustomButton.className = "veyra-addon-wave-bulk__button veyra-addon-wave-bulk__button--small";
      bulkCustomButton.textContent = "Loot";
      bulkCustomButton.addEventListener("click", async () => {
        if (STATE.bulkRunning) return;
        const desiredCount = Number.parseInt(bulkCustomInput.value, 10);
        const runCount = Number.isFinite(desiredCount) && desiredCount > 0 ? desiredCount : BULK_DEFAULT_COUNT;
        await runBulkLoot(runCount);
      });
      bulkCustomInput.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        bulkCustomButton.click();
      });

      customRow.appendChild(bulkCustomInput);
      customRow.appendChild(bulkCustomButton);

      bulkControls.appendChild(quickRow);
      bulkControls.appendChild(customRow);
    }
    bulkSection.appendChild(bulkHeading);
    bulkSection.appendChild(bulkInfo);
    bulkSection.appendChild(bulkControls);

    panel.appendChild(bulkSection);

    const buildWaveAutomationKey = () => {
      if (!isWavePage) return null;
      try {
        const url = new URL(location.href);
        const wave = url.searchParams.get("wave");
        const event = url.searchParams.get("event");
        const gate = url.searchParams.get("gate");
        if (wave && (event || gate)) {
          const mode =
            event && Number.parseInt(event, 10) > 0 ? `event=${event}` : `gate=${gate || "0"}`;
          return `${AUTOMATION_STORAGE_PREFIX}:${mode}&wave=${wave}`;
        }
      } catch (_err) {
        // ignore
      }
      return `${AUTOMATION_STORAGE_PREFIX}:${location.pathname}?${location.search}`;
    };

    const buildAutomationOptions = () => {
      const options = new Map();
      monsterCards.forEach((card) => {
        if (!card || !card.el) return;
        const rawValue = cleanText(card.el.getAttribute("data-name") || card.el.dataset?.name || "");
        const value = rawValue || cleanText(card.name).toLowerCase();
        if (!value) return;
        const label = cleanText(card.name) || value;
        if (!options.has(value)) {
          options.set(value, label);
        }
      });
      return Array.from(options.entries()).sort((a, b) => a[1].localeCompare(b[1]));
    };

    const buildAttackOptions = () => {
      const options = new Map();
      const buttons = Array.from(document.querySelectorAll(WAVE_QOL_ATTACKS_SELECTOR));
      buttons.forEach((button) => {
        const rawStam = button?.dataset?.stam;
        const stamValue = Number.parseInt(rawStam, 10);
        if (!Number.isFinite(stamValue)) return;
        const label = cleanText(button.textContent) || `Attack (${stamValue})`;
        if (!options.has(stamValue)) {
          options.set(stamValue, label);
        }
      });
      if (!options.size) {
        [1, 10, 50, 100, 200].forEach((stamValue) => {
          options.set(stamValue, `Attack (${stamValue})`);
        });
      }
      return Array.from(options.entries()).sort((a, b) => a[0] - b[0]);
    };

    const setupWaveAutomation = () => {
      if (!isWavePage) return null;
      const hasQolPanel = Boolean(document.getElementById(WAVE_QOL_PANEL_ID));
      const hasQolSelect = Boolean(document.getElementById(WAVE_QOL_SELECT_ID));
      if (!hasQolPanel || !hasQolSelect) return null;

      const storageKey = buildWaveAutomationKey();
      const defaultState = {
        enabled: false,
        selection: "",
        attackStam: DEFAULT_ATTACK_STAM,
        autoReload: true,
        reloadDelaySec: DEFAULT_RELOAD_DELAY_SEC,
      };
      const loadState = () => {
        if (!storageKey) return { ...defaultState };
        try {
          const raw = localStorage.getItem(storageKey);
          if (!raw) return { ...defaultState };
          const parsed = JSON.parse(raw);
          const parsedAttack = Number.parseInt(parsed?.attackStam, 10);
          const parsedDelay = Number.parseInt(parsed?.reloadDelaySec, 10);
          return {
            enabled: Boolean(parsed && parsed.enabled),
            selection: typeof parsed?.selection === "string" ? parsed.selection : "",
            attackStam: Number.isFinite(parsedAttack) ? parsedAttack : DEFAULT_ATTACK_STAM,
            autoReload: typeof parsed?.autoReload === "boolean" ? parsed.autoReload : true,
            reloadDelaySec:
              Number.isFinite(parsedDelay) && parsedDelay > 0 ? parsedDelay : DEFAULT_RELOAD_DELAY_SEC,
          };
        } catch (_err) {
          return { ...defaultState };
        }
      };
      const saveState = (nextState) => {
        if (!storageKey) return;
        try {
          localStorage.setItem(storageKey, JSON.stringify(nextState));
        } catch (_err) {
          // ignore storage failures
        }
      };

      const state = loadState();
      let ran = false;
      let reloadTimer = null;
      let autoReloadLocked = false;

      const getStaminaValue = () => {
        const staminaEl = document.getElementById(STAMINA_VALUE_ID);
        if (!staminaEl) return null;
        const rawValue = cleanText(staminaEl.textContent).replace(/,/g, "");
        const staminaValue = Number.parseInt(rawValue, 10);
        return Number.isFinite(staminaValue) ? staminaValue : null;
      };

      const section = document.createElement("div");
      section.className = "veyra-addon-wave-section veyra-addon-wave-automation";

      const heading = document.createElement("div");
      heading.className = "veyra-addon-wave-section__title";
      heading.textContent = "Wave automation";

      const body = document.createElement("div");
      body.className = "veyra-addon-wave-automation__body";

      const selectRow = document.createElement("div");
      selectRow.className = "veyra-addon-wave-automation__row";
      const selectLabel = document.createElement("span");
      selectLabel.className = "veyra-addon-wave-automation__label";
      selectLabel.textContent = "Monster";

      const select = document.createElement("select");
      select.className = "veyra-addon-wave-automation__select";
      select.setAttribute("aria-label", "Wave automation monster");

      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "Select a monster";
      select.appendChild(defaultOption);

      const options = buildAutomationOptions();
      options.forEach(([value, label]) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        select.appendChild(option);
      });

      selectRow.appendChild(selectLabel);
      selectRow.appendChild(select);

      const attackRow = document.createElement("div");
      attackRow.className = "veyra-addon-wave-automation__row";
      const attackLabel = document.createElement("span");
      attackLabel.className = "veyra-addon-wave-automation__label";
      attackLabel.textContent = "Attack";

      const attackSelect = document.createElement("select");
      attackSelect.className = "veyra-addon-wave-automation__select";
      attackSelect.setAttribute("aria-label", "Wave automation attack stamina");

      const attackOptions = buildAttackOptions();
      attackOptions.forEach(([value, label]) => {
        const option = document.createElement("option");
        option.value = String(value);
        option.textContent = label;
        attackSelect.appendChild(option);
      });

      attackRow.appendChild(attackLabel);
      attackRow.appendChild(attackSelect);

      const reloadRow = document.createElement("div");
      reloadRow.className = "veyra-addon-wave-automation__row";
      const reloadLabel = document.createElement("span");
      reloadLabel.className = "veyra-addon-wave-automation__label";
      reloadLabel.textContent = "Auto reload";

      const reloadControls = document.createElement("div");
      reloadControls.className = "veyra-addon-wave-automation__reload";

      const reloadCheckbox = document.createElement("input");
      reloadCheckbox.type = "checkbox";
      reloadCheckbox.className = "veyra-addon-wave-automation__checkbox";
      reloadCheckbox.setAttribute("aria-label", "Enable auto reload");

      const reloadInput = document.createElement("input");
      reloadInput.type = "number";
      reloadInput.min = "1";
      reloadInput.className = "veyra-addon-wave-automation__input";
      reloadInput.setAttribute("aria-label", "Auto reload delay in seconds");

      const reloadSuffix = document.createElement("span");
      reloadSuffix.className = "veyra-addon-wave-automation__suffix";
      reloadSuffix.textContent = "sec";

      reloadControls.appendChild(reloadCheckbox);
      reloadControls.appendChild(reloadInput);
      reloadControls.appendChild(reloadSuffix);

      reloadRow.appendChild(reloadLabel);
      reloadRow.appendChild(reloadControls);

      const actions = document.createElement("div");
      actions.className = "veyra-addon-wave-automation__actions";
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "veyra-addon-wave-automation__button";
      actions.appendChild(toggle);

      const status = document.createElement("div");
      status.className = "veyra-addon-wave-automation__status";

      const setStatus = (message, stateClass = "idle") => {
        status.textContent = message;
        status.dataset.state = stateClass;
      };

      const selectionExists = (value) =>
        Array.from(select.options).some((option) => option.value === value);
      const attackValueExists = (value) =>
        Array.from(attackSelect.options).some(
          (option) => Number.parseInt(option.value, 10) === value,
        );
      const normalizeAttackValue = (value) => {
        if (Number.isFinite(value) && attackValueExists(value)) return value;
        if (attackValueExists(DEFAULT_ATTACK_STAM)) return DEFAULT_ATTACK_STAM;
        const fallback = Number.parseInt(attackSelect.options[0]?.value, 10);
        return Number.isFinite(fallback) ? fallback : DEFAULT_ATTACK_STAM;
      };
      const normalizeReloadDelay = (value) => {
        const parsed = Number.parseInt(value, 10);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_RELOAD_DELAY_SEC;
      };
      const clearReloadTimer = () => {
        if (!reloadTimer) return;
        window.clearTimeout(reloadTimer);
        reloadTimer = null;
      };
      const setAutoReloadLock = (locked) => {
        autoReloadLocked = locked;
        reloadCheckbox.disabled = locked;
        reloadInput.disabled = locked;
        if (locked) {
          if (state.autoReload) {
            state.autoReload = false;
            saveState(state);
          }
          reloadCheckbox.checked = false;
        }
      };
      const scheduleReload = () => {
        clearReloadTimer();
        if (!state.enabled || !state.autoReload) return { scheduled: false };
        const staminaValue = getStaminaValue();
        if (Number.isFinite(staminaValue) && staminaValue < 100) {
          setAutoReloadLock(true);
          return { scheduled: false, locked: true, staminaValue };
        }
        setAutoReloadLock(false);
        const delayMs = Math.max(
          0,
          state.reloadDelaySec * 1000 - (Date.now() - PAGE_LOAD_TIMESTAMP),
        );
        reloadTimer = window.setTimeout(() => {
          const currentStam = getStaminaValue();
          if (Number.isFinite(currentStam) && currentStam < 100) {
            setAutoReloadLock(true);
            announceState();
            return;
          }
          location.reload();
        }, delayMs);
        return { scheduled: true, delaySeconds: Math.max(0, Math.ceil(delayMs / 1000)) };
      };

      if (state.selection && selectionExists(state.selection)) {
        select.value = state.selection;
      } else {
        select.value = "";
      }
      state.attackStam = normalizeAttackValue(state.attackStam);
      attackSelect.value = String(state.attackStam);
      state.reloadDelaySec = normalizeReloadDelay(state.reloadDelaySec);
      reloadInput.value = String(state.reloadDelaySec);
      reloadCheckbox.checked = state.autoReload;

      const updateToggleLabel = () => {
        toggle.textContent = state.enabled ? "Disable" : "Enable";
        toggle.classList.toggle("veyra-addon-wave-automation__button--active", state.enabled);
      };

      const announceState = () => {
        const selectedLabel = select.options[select.selectedIndex]?.textContent?.trim() || "Select a monster";
        const attackLabel = attackSelect.options[attackSelect.selectedIndex]?.textContent?.trim() || "Attack";
        const reloadLabel = autoReloadLocked
          ? "Auto reload disabled (stamina < 100)."
          : state.autoReload
            ? `Auto reload in ${state.reloadDelaySec}s.`
            : "Auto reload off.";
        if (state.enabled) {
          setStatus(`Enabled for "${selectedLabel}" (${attackLabel}). ${reloadLabel}`, autoReloadLocked ? "error" : "ready");
        } else {
          setStatus("Disabled.", "idle");
        }
      };

      updateToggleLabel();
      const initialStam = getStaminaValue();
      if (Number.isFinite(initialStam) && initialStam < 100) {
        setAutoReloadLock(true);
      } else {
        setAutoReloadLock(false);
      }
      announceState();
      if (state.enabled && state.autoReload) {
        scheduleReload();
      }

      select.addEventListener("change", () => {
        state.selection = select.value;
        saveState(state);
        if (state.enabled) {
          announceState();
        }
      });

      attackSelect.addEventListener("change", () => {
        const nextValue = Number.parseInt(attackSelect.value, 10);
        state.attackStam = normalizeAttackValue(nextValue);
        attackSelect.value = String(state.attackStam);
        saveState(state);
        if (state.enabled) {
          announceState();
        }
      });

      const commitReloadDelay = () => {
        state.reloadDelaySec = normalizeReloadDelay(reloadInput.value);
        reloadInput.value = String(state.reloadDelaySec);
        saveState(state);
        if (state.enabled && state.autoReload) {
          scheduleReload();
        }
        if (state.enabled) {
          announceState();
        }
      };

      reloadCheckbox.addEventListener("change", () => {
        if (autoReloadLocked) {
          reloadCheckbox.checked = false;
          return;
        }
        state.autoReload = reloadCheckbox.checked;
        saveState(state);
        if (state.enabled && state.autoReload) {
          scheduleReload();
        } else {
          clearReloadTimer();
        }
        if (state.enabled) {
          announceState();
        }
      });

      reloadInput.addEventListener("change", commitReloadDelay);
      reloadInput.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        commitReloadDelay();
      });

      toggle.addEventListener("click", () => {
        if (!state.enabled) {
          if (!select.value) {
            setStatus("Select a monster before enabling.", "error");
            return;
          }
          state.selection = select.value;
          state.attackStam = normalizeAttackValue(Number.parseInt(attackSelect.value, 10));
          attackSelect.value = String(state.attackStam);
          state.reloadDelaySec = normalizeReloadDelay(reloadInput.value);
          reloadInput.value = String(state.reloadDelaySec);
          state.enabled = true;
          saveState(state);
          updateToggleLabel();
          announceState();
          scheduleReload();
          return;
        }

        state.enabled = false;
        saveState(state);
        updateToggleLabel();
        announceState();
        clearReloadTimer();
      });

      body.appendChild(selectRow);
      body.appendChild(attackRow);
      body.appendChild(reloadRow);
      body.appendChild(actions);
      body.appendChild(status);

      section.appendChild(heading);
      section.appendChild(body);
      panel.appendChild(section);

      const failStep = (step, selector, detail) => {
        const message = `Automation failed at ${step}: ${selector}. ${detail}`;
        setStatus(message, "error");
        error("Wave automation failed:", step, selector, detail);
      };

      const run = () => {
        if (!state.enabled || ran) return;
        ran = true;

        const selectionValue = state.selection;
        if (!selectionValue) {
          failStep("select-monster", `#${WAVE_QOL_SELECT_ID}`, "No stored selection.");
          return;
        }

        const nameSelect = document.getElementById(WAVE_QOL_SELECT_ID);
        if (!nameSelect) {
          failStep("select-monster", `#${WAVE_QOL_SELECT_ID}`, "Select element missing.");
          return;
        }

        const optionFound = Array.from(nameSelect.options).some((opt) => opt.value === selectionValue);
        if (!optionFound) {
          failStep("select-monster", `#${WAVE_QOL_SELECT_ID}`, `Option "${selectionValue}" not found.`);
          return;
        }

        setStatus("Running automation...", "running");
        nameSelect.value = selectionValue;
        nameSelect.dispatchEvent(new Event("change", { bubbles: true }));
        nameSelect.dispatchEvent(new Event("input", { bubbles: true }));

        const unjoinedToggle = document.getElementById(WAVE_QOL_UNJOINED_ID);
        if (!unjoinedToggle) {
          failStep("toggle-unjoined", `#${WAVE_QOL_UNJOINED_ID}`, "Checkbox missing.");
          return;
        }

        unjoinedToggle.checked = false;
        unjoinedToggle.dispatchEvent(new Event("change", { bubbles: true }));
        unjoinedToggle.checked = true;
        unjoinedToggle.dispatchEvent(new Event("change", { bubbles: true }));

        const selectVisible = document.getElementById(WAVE_QOL_SELECT_VISIBLE_ID);
        if (!selectVisible) {
          failStep("select-visible", `#${WAVE_QOL_SELECT_VISIBLE_ID}`, "Button missing.");
          return;
        }
        selectVisible.click();

        const attackStam = normalizeAttackValue(state.attackStam);
        if (state.attackStam !== attackStam) {
          state.attackStam = attackStam;
          attackSelect.value = String(attackStam);
          saveState(state);
        }
        const attackSelector = `#${WAVE_QOL_PANEL_ID} > div.qol-top > div.qol-attacks > button[data-stam="${attackStam}"]`;
        const quickAttack = document.querySelector(attackSelector);
        if (!quickAttack) {
          failStep("quick-attack", attackSelector, `Attack button missing for ${attackStam} stamina.`);
          return;
        }
        quickAttack.click();

        const reloadStatus = scheduleReload();
        if (reloadStatus?.scheduled) {
          setStatus(`Automation complete. Reloading in ${reloadStatus.delaySeconds}s.`, "ready");
        } else if (reloadStatus?.locked) {
          announceState();
        } else {
          setStatus("Automation complete.", "success");
        }
      };

      return { run };
    };

    const automation = setupWaveAutomation();
    if (isWavePage) {
      const footerSection = document.createElement("div");
      footerSection.className = "veyra-addon-wave-section veyra-addon-wave-section--footer";
      const toggleDeadButton = document.createElement("button");
      toggleDeadButton.type = "button";
      toggleDeadButton.className = "veyra-addon-wave-bulk__button";
      toggleDeadButton.textContent = showDead ? "🙈 Show Alive monsters" : "👁️ Show dead monsters";
      toggleDeadButton.addEventListener("click", () => {
        const nextValue = showDead ? "1" : "0";
        document.cookie = `${HIDE_DEAD_COOKIE}=${nextValue}; path=/`;
        location.reload();
      });
      footerSection.appendChild(toggleDeadButton);
      panel.appendChild(footerSection);
    }

  menuRoot.appendChild(toggleButton);
  menuRoot.appendChild(panel);
  document.body.appendChild(menuRoot);

  const progressBadge = document.createElement("div");
  progressBadge.id = PROGRESS_ID;
  progressBadge.className = "veyra-addon-wave-progress";
  progressBadge.hidden = true;
  document.body.appendChild(progressBadge);

  const modalRoot = document.createElement("div");
  modalRoot.id = MODAL_ROOT_ID;
  modalRoot.className = "veyra-addon-wave-modal-root";
  document.body.appendChild(modalRoot);

  const battleDrawerToggle = document.getElementById(BATTLE_DRAWER_TOGGLE_ID);
  const isBattleDrawerOpen = () => {
    if (!battleDrawerToggle) return false;
    const expanded = battleDrawerToggle.getAttribute("aria-expanded");
    const dataOpen = battleDrawerToggle.dataset.open;
    return expanded === "true" || dataOpen === "true" || battleDrawerToggle.classList.contains("open");
  };

  const syncToggleLocks = () => {
    const battleOpen = isBattleDrawerOpen();
    if (toggleButton.disabled !== battleOpen) {
      toggleButton.disabled = battleOpen;
    }
    if (battleDrawerToggle && battleDrawerToggle.disabled !== STATE.panelOpen) {
      battleDrawerToggle.disabled = STATE.panelOpen;
    }
  };

    const setPanelOpen = (nextOpen) => {
      STATE.panelOpen = Boolean(nextOpen);
      panel.hidden = !STATE.panelOpen;
      panel.style.display = STATE.panelOpen ? "flex" : "none";
      toggleButton.textContent = STATE.panelOpen
        ? isWavePage
          ? "🛠️ Wave filters and loot 🛠️"
          : "🛠️ Monster filters and loot 🛠️"
        : "🛠️";
      toggleButton.setAttribute("aria-expanded", STATE.panelOpen ? "true" : "false");
      toggleButton.classList.toggle("veyra-addon-wave-toggle--active", STATE.panelOpen);
      panel.dataset.open = STATE.panelOpen ? "true" : "false";
      syncToggleLocks();
    };

    toggleButton.addEventListener("click", () => setPanelOpen(!STATE.panelOpen));

    const handleOutsideClick = (event) => {
      if (!STATE.panelOpen) return;
      if (menuRoot.contains(event.target)) return;
      setPanelOpen(false);
    };
    document.addEventListener("click", handleOutsideClick);

    if (battleDrawerToggle) {
      const observer = new MutationObserver(syncToggleLocks);
      observer.observe(battleDrawerToggle, { attributes: true });
      battleDrawerToggle.addEventListener("click", () => setTimeout(syncToggleLocks, 0));
    }

    const applyImageVisibility = () => {
      if (!isWavePage) return;
      document.querySelectorAll(".monster-img").forEach((img) => {
        img.style.display = STATE.imagesVisible ? "" : "none";
      });
    };

    const applyFilters = () => {
      monsterCards.forEach((card) => {
        const isSelected = STATE.selectedNames.has(card.name);
        card.el.style.display = isSelected ? "" : "none";
      });
    };

    applyFilters();
    applyImageVisibility();
    if (automation) {
      automation.run();
    }

    const lockFilters = (locked) => {
      const inputs = filterList.querySelectorAll("input[type='checkbox']");
      inputs.forEach((input) => {
        input.disabled = locked;
      });
      hideAllButton.disabled = locked || !uniqueNames.length;
      showAllButton.disabled = locked || !uniqueNames.length;
      imagesCheckbox.disabled = locked;

      bulkQuickButtons.forEach((button) => {
        button.disabled = locked;
      });
      if (bulkCustomInput) bulkCustomInput.disabled = locked;
      if (bulkCustomButton) bulkCustomButton.disabled = locked;
      if (bulkStopButton) {
        bulkStopButton.hidden = !locked;
        bulkStopButton.disabled = !locked || STATE.bulkStopRequested;
        if (!locked) {
          bulkStopButton.textContent = "Stop";
        }
      }
      panel.classList.toggle("veyra-addon-wave-panel--locked", locked);
    };

    const parseLootPayload = (data) => {
      if (!data || typeof data !== "object") {
        return { items: [], rewards: {}, message: null };
      }

      const rawItems = Array.isArray(data.items) ? data.items : Array.isArray(data.loot) ? data.loot : [];
      const items = rawItems
        .map((item) => {
          const id = item.ITEM_ID || item.item_id || item.id || item.slug || item.name || "unknown";
          const image =
            item.IMAGE_URL ||
            item.ITEM_IMAGE ||
            item.image ||
            item.icon ||
            (item.img && item.img.src) ||
            (item.img && item.img.url) ||
            "";
          const quantity = Number.parseInt(item.count || item.quantity || item.qty || 1, 10);
          const name = item.NAME || item.ITEM_NAME || item.name || `Item ${id}`;
          return { id: String(id), image, quantity: Number.isFinite(quantity) ? quantity : 1, name };
        })
        .filter(Boolean);

      const rewards = {
        exp:
          Number.parseInt(
            data.exp || data.EXP || data.reward_exp || data.total_exp || (data.rewards && data.rewards.exp),
            10,
          ) || 0,
        gold:
          Number.parseInt(
            data.gold || data.Gold || data.reward_gold || data.total_gold || (data.rewards && data.rewards.gold),
            10,
          ) || 0,
      };

      const message = data.message || data.msg || data.status || null;

      return { items, rewards, message };
    };

    const showModal = ({ title, subtitle = "", items = [], rewards = {}, failures = 0 }) => {
    const backdrop = document.createElement("div");
    backdrop.className = "veyra-addon-wave-modal-backdrop";

    const modal = document.createElement("div");
    modal.className = "veyra-addon-wave-modal";

    const header = document.createElement("div");
    header.className = "veyra-addon-wave-modal__header";

    const heading = document.createElement("div");
    heading.className = "veyra-addon-wave-modal__title";
    heading.textContent = title;

    const close = document.createElement("button");
    close.type = "button";
    close.className = "veyra-addon-wave-modal__close";
    close.setAttribute("aria-label", "Close");
    close.textContent = "✕";

    close.addEventListener("click", () => {
      backdrop.remove();
    });

    header.appendChild(heading);
    header.appendChild(close);
    modal.appendChild(header);

    if (subtitle) {
      const sub = document.createElement("div");
      sub.className = "veyra-addon-wave-modal__subtitle";
      sub.textContent = subtitle;
      modal.appendChild(sub);
    }

    const rewardsRow = document.createElement("div");
    rewardsRow.className = "veyra-addon-wave-rewards";
    if (rewards.exp) {
      const exp = document.createElement("span");
      exp.textContent = `EXP: ${rewards.exp}`;
      rewardsRow.appendChild(exp);
    }
    if (rewards.gold) {
      const gold = document.createElement("span");
      gold.textContent = `Gold: ${rewards.gold}`;
      rewardsRow.appendChild(gold);
    }
    if (failures > 0) {
      const fail = document.createElement("span");
      fail.className = "veyra-addon-wave-rewards__failures";
      fail.textContent = `Failed: ${failures}`;
      rewardsRow.appendChild(fail);
    }
    if (rewardsRow.childElementCount > 0) {
      modal.appendChild(rewardsRow);
    }

    const itemGrid = document.createElement("div");
    itemGrid.className = "veyra-addon-wave-items";
    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "veyra-addon-wave-empty";
      empty.textContent = "No loot returned.";
      itemGrid.appendChild(empty);
    } else {
      items.forEach((item) => {
        const card = document.createElement("div");
        card.className = "veyra-addon-wave-item";

        const image = document.createElement("div");
        image.className = "veyra-addon-wave-item__image";
        if (item.image) {
          const img = document.createElement("img");
          img.src = item.image;
          img.alt = item.name || "Item";
          image.appendChild(img);
        } else {
          image.textContent = item.name ? item.name[0] || "?" : "?";
        }

        const qty = document.createElement("span");
        qty.className = "veyra-addon-wave-item__qty";
        qty.textContent = `x${item.quantity || 1}`;

        const name = document.createElement("div");
        name.className = "veyra-addon-wave-item__name";
        name.textContent = item.name || "Item";

        image.appendChild(qty);
        card.appendChild(image);
        card.appendChild(name);
        itemGrid.appendChild(card);
      });
    }

    modal.appendChild(itemGrid);
    backdrop.appendChild(modal);
    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) {
        backdrop.remove();
      }
    });
    modalRoot.appendChild(backdrop);
  };

    const showProgress = (current, total) => {
    progressBadge.hidden = false;
    progressBadge.textContent = `Looting ${current}/${total}`;
  };

    const hideProgress = () => {
    progressBadge.hidden = true;
  };

    const requestLoot = async (monsterId, opts = {}) => {
      const url = pageType === "guild_dungeon_location" ? "/dungeon_loot.php" : "/loot.php";
      const params = new URLSearchParams();
      if (pageType === "guild_dungeon_location") {
        params.set("dgmid", String(monsterId || ""));
        const instanceId = opts.instanceId || pageInstanceId;
        if (instanceId) {
          params.set("instance_id", String(instanceId));
        }
        if (userId) {
          params.set("user_id", String(userId));
        }
      } else {
        params.set("monster_id", String(monsterId || ""));
        if (userId) {
          params.set("user_id", String(userId));
        }
      }
      const body = params.toString();
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        credentials: "include",
      });
      const text = await response.text();
      let data = null;
      try {
        data = JSON.parse(text);
      } catch (_err) {
        data = null;
      }
      if (!response.ok) {
        throw new Error(`Loot failed (${response.status})`);
      }
      return { raw: data || text, parsed: parseLootPayload(data || {}) };
    };

    const handleSingleLoot = async (monsterId, name, opts = {}) => {
      if (!userId && pageType !== "guild_dungeon_location") {
        warn("Cannot loot: missing user id cookie");
        showModal({
          title: "Loot failed",
          subtitle: "Missing user id; please ensure you are logged in.",
          items: [],
          rewards: {},
        });
        return;
      }
      try {
        const result = await requestLoot(monsterId, opts);
        lootedMonsterIds.add(String(monsterId));
        const { items, rewards, message } = result.parsed;
      showModal({
        title: "Loot acquired",
        subtitle: message || name || "Loot result",
        items,
        rewards,
      });
    } catch (err) {
      warn("Single loot failed", err);
      showModal({
        title: "Loot failed",
        subtitle: name ? `Could not loot ${name}` : "Could not loot monster",
        items: [],
        rewards: {},
      });
    }
  };

    const aggregateLoot = (results) => {
    const stack = new Map();
    let totalExp = 0;
    let totalGold = 0;

    results.forEach((res) => {
      const items = res.parsed?.items || [];
      const rewards = res.parsed?.rewards || {};

      items.forEach((item) => {
        const key = item.id || item.name;
        if (!key) return;
        if (!stack.has(key)) {
          stack.set(key, {
            id: key,
            name: item.name || `Item ${key}`,
            image: item.image || "",
            quantity: 0,
          });
        }
        const current = stack.get(key);
        if (!current.image && item.image) current.image = item.image;
        if (item.name) current.name = item.name;
        current.quantity += item.quantity || 1;
      });

      totalExp += Number.isFinite(rewards.exp) ? rewards.exp : 0;
      totalGold += Number.isFinite(rewards.gold) ? rewards.gold : 0;
    });

    return {
      items: Array.from(stack.values()),
      rewards: { exp: totalExp, gold: totalGold },
    };
  };

    const runBulkLoot = async (desiredCount) => {
      if (!userId && pageType !== "guild_dungeon_location") {
        warn("Cannot bulk loot: missing user id cookie");
        showModal({
          title: "Bulk loot unavailable",
          subtitle: "Missing user id; please ensure you are logged in.",
        });
        return;
      }
      const eligibleCards = monsterCards
        .map((card) => {
          const monsterId = String(card.monsterId || extractMonsterId(card.viewHref) || "");
          return { card, monsterId, instanceId: card.instanceId || null };
        })
        .filter(({ card, monsterId }) => {
          if (!monsterId) return false;
          if (lootedMonsterIds.has(monsterId)) return false;
          if (!STATE.selectedNames.has(card.name)) return false;
          if (!card.isDead) return false;
          if (card.canLoot === false) return false;
          return isElementVisible(card.el);
        });

      if (!eligibleCards.length) {
        showModal({
          title: "No eligible monsters",
          subtitle: "Select visible monsters that have not been looted this session before bulk looting.",
        });
        return;
      }

      const isAll = desiredCount === Number.POSITIVE_INFINITY;
      const desiredNumeric = Number.parseInt(String(desiredCount), 10);
      const requestedCount =
        !isAll && Number.isFinite(desiredNumeric) && desiredNumeric > 0 ? desiredNumeric : BULK_DEFAULT_COUNT;
      const targetCount = isAll ? eligibleCards.length : Math.min(requestedCount, eligibleCards.length);

      STATE.bulkRunning = true;
      STATE.bulkStopRequested = false;
      lockFilters(true);

      if (bulkStopButton) {
        bulkStopButton.textContent = "Stop";
        bulkStopButton.disabled = false;
      }

      const results = [];
      let failures = 0;
      let processed = 0;

      try {
        for (let i = 0; i < targetCount; i += 1) {
          if (STATE.bulkStopRequested) break;

          const { monsterId } = eligibleCards[i];
          processed += 1;
          showProgress(processed, targetCount);

          try {
            const { instanceId } = eligibleCards[i];
            const res = await requestLoot(monsterId, { instanceId });
            results.push(res);
            lootedMonsterIds.add(monsterId);
          } catch (err) {
            warn("Bulk loot failed for monster", monsterId, err);
            failures += 1;
          }

          // keep the ~500ms spacing
          await wait(LOOT_DELAY_MS);
        }
      } finally {
        hideProgress();
        STATE.bulkRunning = false;
        lockFilters(false);
        setPanelOpen(true);
      }

      const aggregated = aggregateLoot(results);
      const stoppedNote = STATE.bulkStopRequested ? " (stopped)" : "";
      showModal({
        title: "Bulk loot summary",
        subtitle: `Processed ${processed} monster(s)${stoppedNote}`,
        items: aggregated.items,
        rewards: aggregated.rewards,
        failures,
      });
    };

    const addLootViewActions = (card, opts = {}) => {
      const controls = document.createElement("div");
      controls.className = "veyra-addon-wave-actions";

      const lootButton = document.createElement("button");
      lootButton.type = "button";
      lootButton.className = "veyra-addon-wave-action veyra-addon-wave-action--loot";
      lootButton.textContent = opts.lootLabel || "Quick loot";
      if (opts.lootDisabled) {
        lootButton.disabled = true;
        lootButton.title = opts.lootDisabledReason || "Loot unavailable";
      }
      lootButton.addEventListener("click", (event) => {
        if (lootButton.disabled) return;
        event.preventDefault();
        event.stopPropagation();
        const monsterId = card.monsterId || extractMonsterId(card.viewHref);
        if (!monsterId) {
          warn("Missing monster id for loot action");
          return;
        }
        handleSingleLoot(monsterId, card.name, { instanceId: card.instanceId || null });
      });

      const viewButton = document.createElement("a");
      viewButton.href = card.viewHref || "#";
      viewButton.className = "veyra-addon-wave-action veyra-addon-wave-action--view";
      viewButton.textContent = "View";
      viewButton.target = opts.target || "_self";

      controls.appendChild(lootButton);
      controls.appendChild(viewButton);
      return controls;
    };

    if (isWavePage && showDead) {
      monsterCards.forEach((card) => {
        if (!card.cta) return;
        const container = card.cta.parentElement;
        if (!container) return;
        card.cta.replaceWith(addLootViewActions(card, { target: card.cta.target || "_self" }));
      });
    }

    if (!isWavePage) {
      monsterCards.forEach((card) => {
        if (!card.isDead) return;
        if (card.el.querySelector(".veyra-addon-wave-actions")) return;
        const controls = addLootViewActions(card, {
          lootLabel: "Loot",
          lootDisabled: card.canLoot === false,
          lootDisabledReason: "Cannot loot (not eligible or already looted)",
        });
        const host = card.actionsContainer;
        if (host) {
          host.textContent = "";
          host.appendChild(controls);
        } else {
          const detailColumn = card.el.querySelector(":scope > div");
          if (detailColumn) {
            detailColumn.appendChild(controls);
          } else {
            card.el.appendChild(controls);
          }
        }
      });
    }

    setPanelOpen(false);
  };

  const boot = () => {
    start().catch((err) => warn("Wave tools init failed; skipping wave tooling.", err));
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
