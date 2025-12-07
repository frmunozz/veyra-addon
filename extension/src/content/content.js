(() => {
  const TAG = "[Veyra Addon]";
  const ROOT_ID = "veyra-addon-toolbar";
  const STORAGE_KEY = "addonEnabled";
  const STATE = { fetchPatched: false, drawerSurveyed: false, drawer: null };
  const DRAWER_SELECTORS = [
    "#side-menu",
    "#sideMenu",
    "#side-drawer",
    ".side-drawer",
    ".side-menu",
    ".side-nav",
    ".sidenav",
    "nav.side",
    "nav.side-nav",
    "aside .side-nav",
    "aside .side-menu",
  ];
  const DRAWER_LIST_SELECTORS = ["ul.nav", "ul.menu", "ul.list-group", ".side-nav-list", "ul"];
  const WARNED_KEYS = new Set();

  const log = (...args) => console.log(TAG, ...args);
  const warn = (key, ...args) => {
    if (WARNED_KEYS.has(key)) return;
    WARNED_KEYS.add(key);
    console.warn(TAG, ...args);
  };

  const onDomReady = (fn) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  };

  const normalizeText = (value) => (value || "").replace(/\s+/g, " ").trim();

  function findSideDrawerMount() {
    for (const selector of DRAWER_SELECTORS) {
      const root = document.querySelector(selector);
      if (!root) continue;

      const navContainer =
        root.classList?.contains("side-nav") || root.matches(".side-nav")
          ? root
          : root.querySelector(".side-nav");
      const mount = pickListContainer(navContainer || root);
      if (!mount) continue;

      const anchors = mount.querySelectorAll("a").length;
      if (anchors < 2) continue;

      return { root, mount, selector, navContainer };
    }

    const keywordLink = findDrawerKeywordLink();
    if (keywordLink) {
      const fallbackRoot = keywordLink.closest(
        "nav, aside, .side-menu, .side-nav, .sidebar, .side, .menu, .list-group",
      );
      if (fallbackRoot) {
        const navContainer =
          fallbackRoot.classList?.contains("side-nav") || fallbackRoot.matches(".side-nav")
            ? fallbackRoot
            : fallbackRoot.querySelector(".side-nav");
        const mount = pickListContainer(navContainer || fallbackRoot);
        if (mount && mount.querySelectorAll("a").length >= 2) {
          return { root: fallbackRoot, mount, selector: "keyword-fallback", navContainer };
        }
      }
    }

    return null;
  }

  function findDrawerKeywordLink() {
    const keywords = [/hole/i, /guild/i, /grakthar/i, /forge/i, /halloween/i];
    const links = document.querySelectorAll("a");
    return Array.from(links).find((anchor) => {
      const text = normalizeText(anchor.textContent);
      return keywords.some((rx) => rx.test(text));
    });
  }

  function pickListContainer(root) {
    for (const selector of DRAWER_LIST_SELECTORS) {
      const el = root.querySelector(selector);
      if (el && el.querySelector("a")) return el;
    }

    if (root.matches("ul, ol")) return root;
    return root.querySelectorAll("a").length ? root : null;
  }

  function logDrawerSnapshot(found) {
    const anchorNodes = Array.from(found.mount.querySelectorAll("a"));
    const sample = anchorNodes.slice(0, 10).map((anchor) => ({
      text: normalizeText(anchor.textContent),
      href: anchor.getAttribute("href") || "",
    }));

    log("Side drawer located", {
      selector: found.selector,
      rootTag: found.root.tagName,
      navContainerTag: found.navContainer?.tagName || null,
      navContainerClass: found.navContainer?.className || null,
      mountTag: found.mount.tagName,
      items: anchorNodes.length,
      sample,
    });
  }

  function runDrawerProbe(drawerCtx) {
    try {
      const target = drawerCtx.navContainer || drawerCtx.mount;
      if (!target) {
        warn("drawer-probe-no-target", "Drawer probe skipped; no target container found.");
        return;
      }

      const probeTag = target.tagName === "UL" || target.tagName === "OL" ? "li" : "div";
      const probe = document.createElement(probeTag);
      probe.dataset.veyraAddon = "probe";
      const items = Array.from(target.children);
      const templateItem =
        items.find(
          (child) =>
            child?.classList &&
            !child.classList.contains("selected") &&
            !child.classList.contains("active"),
        ) || target.firstElementChild;
      const baseClass = templateItem?.className
        ? templateItem.className
            .split(/\s+/)
            .filter((cls) => cls && cls !== "selected" && cls !== "active")
            .join(" ")
        : "";
      probe.className = ["veyra-addon-probe", baseClass].filter(Boolean).join(" ");
      probe.setAttribute("aria-hidden", "true");
      probe.textContent = "[Veyra Addon] probe";
      probe.style.pointerEvents = "none";
      probe.style.userSelect = "none";
      target.appendChild(probe);
      log("Drawer probe injected (left in place for validation)", {
        target: target.tagName,
        targetClasses: target.className,
        childCount: target.children.length,
      });
    } catch (err) {
      warn("drawer-probe-failed", "Drawer probe failed; skipping nav injection test.", err);
    }
  }

  function surveySideDrawer({ allowRetry = true } = {}) {
    if (STATE.drawerSurveyed) return;

    let found;
    try {
      found = findSideDrawerMount();
    } catch (err) {
      STATE.drawerSurveyed = true;
      warn("drawer-locate-error", "Drawer lookup threw; skipping nav enhancements.", err);
      return;
    }

    if (!found) {
      if (allowRetry) {
        setTimeout(() => surveySideDrawer({ allowRetry: false }), 400);
        return;
      }
      STATE.drawerSurveyed = true;
      warn("drawer-missing", "Side drawer not found; leaving page untouched.");
      return;
    }

    STATE.drawerSurveyed = true;
    STATE.drawer = {
      root: found.root,
      mount: found.mount,
      selector: found.selector,
      navContainer: found.navContainer || null,
    };

    logDrawerSnapshot(found);
    runDrawerProbe(found);
  }

  function patchFetchLogger() {
    if (STATE.fetchPatched || typeof window.fetch !== "function") return;
    STATE.fetchPatched = true;
    const origFetch = window.fetch;
    window.fetch = async (...args) => {
      log("fetch →", ...args);
      const response = await origFetch(...args);
      try {
        const clone = response.clone();
        const text = await clone.text();
        log("fetch response preview:", text.slice(0, 200));
      } catch (err) {
        log("fetch response preview failed:", err);
      }
      return response;
    };
  }

  function createToolbar() {
    if (document.getElementById(ROOT_ID)) return;

    const bar = document.createElement("div");
    bar.id = ROOT_ID;
    bar.innerHTML = `
      <div class="veyra-addon-row">
        <span class="veyra-addon-label">Veyra Addon</span>
        <button type="button" data-action="prev">Prev</button>
        <button type="button" data-action="next">Next</button>
        <button type="button" data-action="refresh">Refresh</button>
      </div>
    `;

    bar.addEventListener("click", async (event) => {
      const button = event.target;
      if (!(button instanceof HTMLButtonElement)) return;

      const action = button.dataset.action;
      switch (action) {
        case "prev":
          log("TODO: implement prev wave");
          break;
        case "next":
          log("TODO: implement next wave");
          break;
        case "refresh":
          log("refreshing wave data");
          await inspectCurrentWave();
          break;
        default:
          break;
      }
    });

    document.body.appendChild(bar);
  }

  async function inspectCurrentWave() {
    const gate = getQueryParam("gate");
    const wave = getQueryParam("wave");
    if (!gate || !wave) {
      log("No gate/wave query params detected.");
      return;
    }

    const url = `/active_wave.php?gate=${gate}&wave=${wave}`;
    try {
      const res = await fetch(url, { credentials: "include" });
      const text = await res.text();
      log("Current wave response length:", text.length);
    } catch (err) {
      log("Wave fetch failed:", err);
    }
  }

  function getQueryParam(key) {
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
  }

  function wireKeyboardShortcuts() {
    const handler = (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.target && event.target.tagName === "INPUT") return;

      if (event.key === "n") {
        log("TODO: keyboard next");
      } else if (event.key === "p") {
        log("TODO: keyboard prev");
      } else if (event.key === "r") {
        inspectCurrentWave();
      }
    };

    document.addEventListener("keydown", handler);
  }

  function init() {
    if (document.documentElement.dataset.veyraAddonMounted) {
      return;
    }

    getEnabledFlag().then((enabled) => {
      if (!enabled) {
        log("Addon disabled via popup; skipping init.");
        return;
      }

      document.documentElement.dataset.veyraAddonMounted = "true";
      log("Content script loaded");
      patchFetchLogger();
      createToolbar();
      wireKeyboardShortcuts();
      onDomReady(surveySideDrawer);
    });
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

  init();
})();
