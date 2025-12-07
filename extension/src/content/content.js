(() => {
  const TAG = "[Veyra Addon]";
  const ROOT_ID = "veyra-addon-toolbar";
  const STORAGE_KEY = "addonEnabled";
  const STATE = { fetchPatched: false };

  const log = (...args) => console.log(TAG, ...args);

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
