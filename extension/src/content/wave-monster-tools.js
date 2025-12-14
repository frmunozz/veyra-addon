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
  const WAVE_WHITELIST = [
    "/active_wave.php?gate=3&wave=3",
    "/active_wave.php?gate=3&wave=5",
    "/active_wave.php?gate=3&wave=8",
  ];

  const log = (...args) => console.log(TAG, ...args);
  const warn = (...args) => console.warn(TAG, ...args);

  const cleanText = (value) => (value || "").replace(/\s+/g, " ").trim();
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
      return url.searchParams.get("id") || url.searchParams.get("monster_id");
    } catch (_err) {
      return null;
    }
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
        const nameNode = el.querySelector("h3") || el.querySelector("strong");
        const name =
          cleanText(nameNode ? nameNode.textContent : "") ||
          cleanText(el.getAttribute("data-name")) ||
          cleanText(el.dataset && el.dataset.name) ||
          "";
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
        };
      })
      .filter((entry) => entry && entry.el && entry.monsterId);
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

  let warnedNoWave = false;
  let monsterCards = [];

  const start = async () => {
    const { cards, markerFound } = await waitForWaveMarkers();
    if (!markerFound) {
      if (!warnedNoWave) {
        warnedNoWave = true;
        warn("Wave page not detected; skipping wave monster tooling.");
      }
      return;
    }

    const gateInfo = document.querySelector("body > div.gate-info");
    if (gateInfo) {
      gateInfo.style.display = "none";
    }

    if (document.getElementById(MENU_ID)) {
      return;
    }

    monsterCards = cards;

    const storageKey = `veyra-addon-wave-filters:${location.pathname}?${location.search}`;
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

    const userId = getCookie(USER_ID_COOKIE) || getCookie("user_id");

    const lootedMonsterIds = new Set();
    const monsterCounts = monsterCards.reduce((acc, card) => {
      acc.set(card.name, (acc.get(card.name) || 0) + 1);
      return acc;
    }, new Map());
    const formatCount = (count) => {
      const raw = Number.isFinite(count) ? count : 0;
      return raw < 100 ? String(raw).padStart(2, "0") : String(raw);
    };

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
    filterSection.appendChild(imagesToggle);
    panel.appendChild(filterSection);

    const showDead = shouldShowDeadMonsters();
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
    bulkInfo.textContent = showDead
      ? "Loots visible dead monsters in sequence (skips already-looted this session)."
      : "Dead monsters hidden; bulk loot unavailable.";

    if (showDead) {
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

    panel.appendChild(bulkSection);
    panel.appendChild(footerSection);

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
      toggleButton.textContent = STATE.panelOpen ? "🛠️ Wave filters and loot 🛠️" : "🛠️";
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

    const requestLoot = async (monsterId) => {
      const url = `/loot.php`;
      const body = `monster_id=${encodeURIComponent(monsterId)}&user_id=${encodeURIComponent(userId || "")}`;
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

    const handleSingleLoot = async (monsterId, name) => {
      if (!userId) {
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
        const result = await requestLoot(monsterId);
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
      if (!userId) {
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
          return { card, monsterId };
        })
        .filter(({ card, monsterId }) => {
          if (!monsterId) return false;
          if (lootedMonsterIds.has(monsterId)) return false;
          if (!STATE.selectedNames.has(card.name)) return false;
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
            const res = await requestLoot(monsterId);
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

    if (showDead) {
      monsterCards.forEach((card) => {
        if (!card.cta) return;
        const container = card.cta.parentElement;
        if (!container) return;

        const controls = document.createElement("div");
        controls.className = "veyra-addon-wave-actions";

        const lootButton = document.createElement("button");
        lootButton.type = "button";
        lootButton.className = "veyra-addon-wave-action veyra-addon-wave-action--loot";
        lootButton.textContent = "Quick loot";
        lootButton.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          const monsterId = card.monsterId || extractMonsterId(card.viewHref);
          if (!monsterId) {
            warn("Missing monster id for loot action");
            return;
          }
          handleSingleLoot(monsterId, card.name);
        });

        const viewButton = document.createElement("a");
        viewButton.href = card.viewHref || "#";
        viewButton.className = "veyra-addon-wave-action veyra-addon-wave-action--view";
        viewButton.textContent = "View";
        viewButton.target = card.cta.target || "_self";

        controls.appendChild(lootButton);
        controls.appendChild(viewButton);

        card.cta.replaceWith(controls);
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
