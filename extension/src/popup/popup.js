(() => {
  const TAG = "[Veyra Addon]";
  const STORAGE_KEY = "addonEnabled";

  try {
    const manifest = chrome.runtime?.getManifest?.();
    const note = document.getElementById("version-note");
    if (manifest?.version && note) {
      note.textContent = `Popup loaded — extension v${manifest.version}.`;
    }
    console.log(TAG, "popup opened", manifest?.version ?? "unknown version");
  } catch (err) {
    console.log(TAG, "popup init failed", err);
  }

  const links = document.querySelectorAll("a[href]");
  links.forEach((link) => {
    link.addEventListener("click", () => {
      console.log(TAG, "popup link clicked", link.href);
    });
  });

  const toggle = document.getElementById("addon-toggle");
  const statusLabel = document.getElementById("status-label");
  const reloadCard = document.getElementById("reload-card");
  const reloadBtn = document.getElementById("reload-btn");

  function setStatus(enabled) {
    if (!statusLabel) return;
    statusLabel.textContent = enabled ? "Enabled" : "Disabled";
    statusLabel.style.color = enabled ? "#7ed07e" : "#f28c8c";
  }

  function showReloadPrompt() {
    if (reloadCard) {
      reloadCard.classList.add("is-visible");
    }
  }

  function reloadActiveTab() {
    if (!chrome?.tabs?.query || !chrome?.tabs?.reload) {
      console.log(TAG, "tabs API unavailable; please refresh manually");
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const [tab] = tabs;
      if (chrome.runtime?.lastError) {
        console.log(TAG, "tab query failed", chrome.runtime.lastError);
        return;
      }
      if (!tab?.id) {
        console.log(TAG, "no active tab to reload");
        return;
      }
      chrome.tabs.reload(tab.id, {}, () => {
        if (chrome.runtime?.lastError) {
          console.log(TAG, "tab reload failed", chrome.runtime.lastError);
        } else {
          console.log(TAG, "tab reloaded for addon state change");
          window.close();
        }
      });
    });
  }

  function readFlag() {
    return new Promise((resolve) => {
      if (!chrome?.storage?.local) {
        resolve(true);
        return;
      }

      chrome.storage.local.get([STORAGE_KEY], (result) => {
        if (chrome.runtime?.lastError) {
          console.log(TAG, "storage read failed", chrome.runtime.lastError);
          resolve(true);
          return;
        }
        resolve(result?.[STORAGE_KEY] !== false);
      });
    });
  }

  function writeFlag(enabled) {
    if (!chrome?.storage?.local) return;
    chrome.storage.local.set({ [STORAGE_KEY]: enabled }, () => {
      if (chrome.runtime?.lastError) {
        console.log(TAG, "storage write failed", chrome.runtime.lastError);
      } else {
        console.log(TAG, "addon flag updated", enabled);
      }
    });
  }

  readFlag().then((enabled) => {
    if (toggle) toggle.checked = enabled;
    if (statusLabel) setStatus(enabled);
  });

  toggle?.addEventListener("change", (event) => {
    const enabled = event.target.checked;
    setStatus(enabled);
    writeFlag(enabled);
    showReloadPrompt();
  });

  reloadBtn?.addEventListener("click", reloadActiveTab);
})();
