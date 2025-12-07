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
  const STATE = { asideBailed: false };

  const log = (...args) => console.log(TAG, ...args);
  const warn = (...args) => console.warn(TAG, ...args);

  function extractNavItems(container) {
    const anchors = Array.from(container.querySelectorAll("a[href]"));
    const seen = new Set();

    return anchors
      .map((anchor) => {
        const label = (anchor.textContent || "").replace(/\s+/g, " ").trim();
        const href = anchor.getAttribute("href");
        if (!label || !href) return null;
        const target = anchor.getAttribute("target") || "";
        return { label, href, target };
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

  function buildAddonAside(navItems, startCollapsed = true, backdrop) {
    const aside = document.createElement("aside");
    aside.id = ASIDE_ID;
    aside.className = "veyra-addon-aside";

    const header = document.createElement("div");
    header.className = "veyra-addon-aside__header";

    const title = document.createElement("span");
    title.className = "veyra-addon-aside__title";
    title.textContent = "Veyra Addon Menu";

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.id = ASIDE_TOGGLE_ID;
    toggle.className = "veyra-addon-aside__toggle";
    toggle.setAttribute("aria-expanded", startCollapsed ? "false" : "true");
    toggle.textContent = startCollapsed ? "Open" : "Hide";

    const nav = document.createElement("nav");
    nav.className = "veyra-addon-aside__nav";

    const list = document.createElement("ul");
    list.className = "veyra-addon-aside__list";

    navItems.forEach((item) => {
      const li = document.createElement("li");
      li.className = "veyra-addon-aside__item";

      const link = document.createElement("a");
      link.className = "veyra-addon-aside__link";
      link.href = item.href;
      link.textContent = item.label;
      if (item.target) {
        link.target = item.target;
      }

      li.appendChild(link);
      list.appendChild(li);
    });

    nav.appendChild(list);
    header.appendChild(title);
    header.appendChild(toggle);
    aside.appendChild(header);
    aside.appendChild(nav);

    toggle.addEventListener("click", () => toggleAsideCollapsed(aside, toggle, backdrop));
    setAsideCollapsed(aside, startCollapsed, toggle, backdrop);

    return aside;
  }

  function hideNativeDrawer(nativeDrawer) {
    nativeDrawer.dataset.veyraAddonHidden = "true";
    nativeDrawer.setAttribute("aria-hidden", "true");
    nativeDrawer.style.display = "none";
    nativeDrawer.style.visibility = "hidden";
    nativeDrawer.style.pointerEvents = "none";
  }

  function wireNavFabToggle(aside, backdrop) {
    const navFab = document.getElementById(NAV_FAB_ID);
    if (!navFab) return null;
    const headerToggle = aside.querySelector(`#${ASIDE_TOGGLE_ID}`);

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

  function initAddonAside() {
    if (document.getElementById(ASIDE_ID)) {
      return true;
    }

    const nativeDrawer = document.getElementById(NATIVE_DRAWER_ID);
    if (!nativeDrawer) {
      if (!STATE.asideBailed) {
        STATE.asideBailed = true;
        warn("Native side drawer not found; addon aside disabled and page menu left intact.");
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

      const backdrop = ensureAddonBackdrop();
      const navFab = document.getElementById(NAV_FAB_ID);
      backdrop.addEventListener("click", () => {
        const asideEl = document.getElementById(ASIDE_ID);
        if (!asideEl) return;
        const headerToggle = asideEl.querySelector(`#${ASIDE_TOGGLE_ID}`);
        setAsideCollapsed(asideEl, true, headerToggle, backdrop);
        if (navFab) {
          navFab.setAttribute("aria-pressed", "false");
          navFab.setAttribute("aria-expanded", "false");
        }
      });

      const aside = buildAddonAside(navItems, Boolean(navFab), backdrop);
      document.body.appendChild(aside);
      const boundFab = wireNavFabToggle(aside, backdrop);
      if (!boundFab) {
        warn("nav_fab button not found; using header toggle instead.");
      }
      hideNativeDrawer(nativeDrawer);
      return true;
    } catch (err) {
      if (!STATE.asideBailed) {
        STATE.asideBailed = true;
        warn("Addon aside failed to mount; leaving native drawer untouched.", err);
      }
      return false;
    }
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
      initAddonAside();
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
