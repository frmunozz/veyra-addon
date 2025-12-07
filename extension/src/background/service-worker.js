/* eslint-disable no-restricted-globals */
// Load configurable polling/threshold defaults (same directory)
importScripts("constants.js");

const TAG = "[Veyra Addon]";
const WAVE_URL = "https://demonicscans.org/active_wave.php?gate=3&wave=8";
const WAVE_PAGE_URL = WAVE_URL;
const STORAGE_KEY = "veyraAddonWaveState";
const NOTIFICATION_ID = "veyra-addon-wave-spawn";
const ALARM_NAME = "veyra-addon-wave-poll";
const NOTIFICATION_ICON = "assets/notification.png";
const POLL_MINUTES = (self.VeyraAddonBgConstants && self.VeyraAddonBgConstants.POLL_INTERVALS_MINUTES) || {
  low: 60,
  mid: 30,
  high: 10,
};
const TARGET_THRESHOLD = (self.VeyraAddonBgConstants && self.VeyraAddonBgConstants.WAVE_TARGET) || 2500;
const DEFAULT_STATE = { lastProgress: null, warnedAuthOrParse: false };

const state = { ...DEFAULT_STATE, lastNotifiedAt: 0, thresholdDumped: false };
let pollInFlight = false;

const log = (...args) => console.log(TAG, ...args);
const warn = (...args) => console.warn(TAG, ...args);

function normalizeProgress(progress) {
  if (!progress || typeof progress !== "object") return null;
  const current = Number(progress.current);
  const target = Number(progress.target);
  if (Number.isNaN(current) || Number.isNaN(target) || target <= 0) return null;
  return { current, target };
}

async function loadState() {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        if (chrome.runtime?.lastError) {
          warn("state load failed", chrome.runtime.lastError);
          resolve({ ...state });
          return;
        }
        const stored = result?.[STORAGE_KEY] || {};
        state.lastProgress = normalizeProgress(stored.lastProgress);
        state.warnedAuthOrParse = Boolean(stored.warnedAuthOrParse);
        state.lastNotifiedAt = Number(stored.lastNotifiedAt || 0);
        resolve({ ...state });
      });
    } catch (err) {
      warn("state load threw", err);
      resolve({ ...state });
    }
  });
}

async function saveState(nextState) {
  const payload = {
    lastProgress: normalizeProgress(nextState.lastProgress),
    warnedAuthOrParse: Boolean(nextState.warnedAuthOrParse),
    lastNotifiedAt: Number(nextState.lastNotifiedAt || 0),
  };

  return new Promise((resolve) => {
    try {
      chrome.storage.local.set({ [STORAGE_KEY]: payload }, () => {
        if (chrome.runtime?.lastError) {
          warn("state save failed", chrome.runtime.lastError);
        }
        resolve();
      });
    } catch (err) {
      warn("state save threw", err);
      resolve();
    }
  });
}

function computeDelayMinutes(progress) {
  if (!progress) return POLL_MINUTES.low;
  const current = progress.current;
  const target = progress.target || TARGET_THRESHOLD;

  if (current < 2000) return POLL_MINUTES.low;
  if (current < 2400) return POLL_MINUTES.mid;
  if (current < target) return POLL_MINUTES.high;
  return POLL_MINUTES.high;
}

function scheduleNextPoll(progress, reason, overrideMinutes) {
  const delayInMinutes = overrideMinutes || computeDelayMinutes(progress);
  try {
    chrome.alarms.create(ALARM_NAME, { delayInMinutes });
    log(`Next wave poll in ${delayInMinutes}m`, { reason: reason || "auto", progress });
  } catch (err) {
    warn("failed to schedule poll", err);
  }
}

function parseProgress(html) {
  try {
    log("wave parse start", { hasDOMParser: typeof DOMParser !== "undefined" });
    let parsed = [];

    const parsePair = (a, b) => {
      const current = Number(String(a || "").replace(/,/g, ""));
      const target = Number(String(b || "").replace(/,/g, ""));
      if (Number.isFinite(current) && Number.isFinite(target)) {
        return { current, target };
      }
      return null;
    };

    if (typeof DOMParser !== "undefined") {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const container = doc.getElementById("waveThresholds");
      if (container) {
        if (!state.thresholdDumped) {
          log("waveThresholds innerHTML", container.innerHTML);
          state.thresholdDumped = true;
        }
        const metas = Array.from(container.querySelectorAll(".threshold-meta"));
        parsed = metas
          .map((el) => {
            const text = (el.textContent || "").trim();
            const match = text.match(/([\d,]+)\s*\/\s*([\d,]+)/);
            if (!match) return null;
            return parsePair(match[1], match[2]);
          })
          .filter((item) => item && Number.isFinite(item.current) && Number.isFinite(item.target));
        log("wave parse dom", { metas: metas.length, parsed: parsed.length });
      } else {
        log("wave parse: container missing");
      }
    }

    // Regex fallback scoped to the threshold card
    if (!parsed.length) {
      let source = "";
      const blockMatch = html.match(/<div[^>]*id=["']waveThresholds["'][^>]*>([\s\S]*?)<\/div>\s*<div[^>]*class=["']batch-loot-card/i);
      if (blockMatch && blockMatch[1]) {
        source = blockMatch[1];
      } else {
        const startIdx = html.search(/id=["']waveThresholds["']/i);
        if (startIdx >= 0) {
          source = html.slice(startIdx, startIdx + 4000);
        }
      }

      const metaMatches = Array.from(source.matchAll(/threshold-meta[^>]*>([^<]*)</gi));
      parsed = metaMatches
        .map((m) => {
          const text = (m[1] || "").trim();
          const match = text.match(/([\d,]+)\s*\/\s*([\d,]+)/);
          return match ? parsePair(match[1], match[2]) : null;
        })
        .filter((item) => item && Number.isFinite(item.current) && Number.isFinite(item.target));

      log("wave parse regex fallback", { parsed: parsed.length, hasBlock: Boolean(blockMatch) });
    }

    // Last resort: look for any threshold-meta anywhere
    if (!parsed.length) {
      const metaAnywhere = Array.from(html.matchAll(/threshold-meta[^>]*>([^<]*)</gi))
        .map((m) => {
          const text = (m[1] || "").trim();
          const match = text.match(/([\d,]+)\s*\/\s*([\d,]+)/);
          return match ? parsePair(match[1], match[2]) : null;
        })
        .filter((item) => item && Number.isFinite(item.current) && Number.isFinite(item.target));
      parsed = metaAnywhere;
      log("wave parse threshold-meta full scan", { parsed: parsed.length });
    }

    if (!parsed.length) {
      log("wave parse returned empty");
      return null;
    }
    const best = parsed.reduce((bestItem, item) => (item.current > bestItem.current ? item : bestItem), parsed[0]);
    const normalized = { current: best.current, target: TARGET_THRESHOLD || best.target };
    log("wave parse result", normalized);
    return normalized;
  } catch (err) {
    warn("wave parse failed", err);
    return null;
  }
}

async function fetchWaveProgress() {
  log("wave fetch start", { url: WAVE_URL });
  const response = await fetch(WAVE_URL, { credentials: "include", cache: "no-store", redirect: "follow" });
  log("wave fetch response", { ok: response.ok, status: response.status, redirected: response.redirected, url: response.url });
  if (!response.ok) {
    throw new Error(`wave fetch failed (${response.status})`);
  }

  const text = await response.text();
  log("wave fetch body length", text.length);
  return parseProgress(text);
}

function shouldNotify(progress, lastProgress) {
  if (!progress) return false;
  const target = TARGET_THRESHOLD || progress.target || TARGET_THRESHOLD;
  if (!Number.isFinite(target) || target <= 0) return false;

  const neverNotified = !state.lastNotifiedAt;
  if (neverNotified && progress.current >= target) {
    return true;
  }

  const lastAtOrAboveTarget = lastProgress && lastProgress.current >= (lastProgress.target || target);
  const reached = progress.current >= target && !lastAtOrAboveTarget;
  const reset = lastProgress && lastProgress.current >= (lastProgress.target || target) && progress.current < lastProgress.current;
  return reached || reset;
}

function getSpawnReason(progress, lastProgress) {
  if (!progress) return "unknown";
  const target = TARGET_THRESHOLD || progress.target || TARGET_THRESHOLD;
  if (progress.current >= target) return "reached";
  if (lastProgress && lastProgress.current >= (lastProgress.target || target) && progress.current < lastProgress.current) return "reset";
  return "unknown";
}

async function ensureNotificationPermission() {
  return new Promise((resolve) => {
    if (!chrome.notifications?.getPermissionLevel) {
      resolve(false);
      return;
    }

    chrome.notifications.getPermissionLevel((level) => {
      if (chrome.runtime?.lastError) {
        warn("notification permission check failed", chrome.runtime.lastError);
        resolve(false);
        return;
      }

      if (level === "granted") {
        resolve(true);
        return;
      }

      if (typeof Notification !== "undefined" && typeof Notification.requestPermission === "function") {
        Notification.requestPermission()
          .then((result) => resolve(result === "granted"))
          .catch(() => resolve(false));
        return;
      }

      resolve(false);
    });
  });
}

async function createSpawnNotification(reason, progress) {
  const permissionGranted = await ensureNotificationPermission();
  if (!permissionGranted) {
    warn("notifications not permitted; skipping wave alert");
    return false;
  }

  const message = "general spawned!";
  const target = (progress && progress.target) || TARGET_THRESHOLD;
  const contextMessage =
    reason === "reset"
      ? `Wave threshold reset after reaching ${target}.`
      : `Wave threshold hit ${target}/${target}.`;

  let iconUrl = chrome.runtime.getURL(NOTIFICATION_ICON);
  try {
    const res = await fetch(iconUrl);
    if (!res.ok) {
      warn("notification icon fetch failed", { status: res.status });
      iconUrl = undefined;
    }
  } catch (err) {
    warn("notification icon fetch error", err);
    iconUrl = undefined;
  }

  return new Promise((resolve) => {
    chrome.notifications.create(
      NOTIFICATION_ID,
      {
        type: "basic",
        title: "Veyra Addon",
        message,
        contextMessage,
        iconUrl,
        priority: 2,
      },
      (id) => {
        if (chrome.runtime?.lastError) {
          warn("notification failed", chrome.runtime.lastError);
          resolve(false);
          return;
        }
        state.lastNotifiedAt = Date.now();
        resolve(Boolean(id));
      }
    );
  });
}

async function handleWavePoll(trigger) {
  if (pollInFlight) {
    log("wave poll skipped; another poll in flight");
    return;
  }
  pollInFlight = true;
  log("wave poll start", { trigger, lastProgress: state.lastProgress });

  try {
    const stored = await loadState();
    const lastProgress = stored.lastProgress;
    let progress;

    try {
      progress = await fetchWaveProgress();
    } catch (err) {
      if (!state.warnedAuthOrParse) {
        state.warnedAuthOrParse = true;
        warn("wave fetch failed; backing off", err);
      }
      await saveState(state);
      scheduleNextPoll(lastProgress, "fetch-error", POLL_MINUTES.low);
      return;
    }

    if (!progress) {
      if (!state.warnedAuthOrParse) {
        state.warnedAuthOrParse = true;
        warn("wave progress missing; backing off");
      }
      await saveState(state);
      scheduleNextPoll(lastProgress, "parse-miss", POLL_MINUTES.low);
      return;
    }

    state.warnedAuthOrParse = false;
    log("wave progress parsed", progress);

    if (shouldNotify(progress, lastProgress)) {
      const reason = getSpawnReason(progress, lastProgress);
      const sent = await createSpawnNotification(reason, progress);
      if (sent) {
        state.lastNotifiedAt = Date.now();
        log("wave spawn notification sent", { reason, progress });
      } else {
        log("wave spawn notification skipped (permission or error)");
      }
    } else {
      log("wave progress no notify", { progress, lastProgress });
    }

    state.lastProgress = progress;
    await saveState(state);
    scheduleNextPoll(progress, trigger || "success");
  } finally {
  log("wave poll end");
    pollInFlight = false;
  }
}

function initializePolling(reason) {
  handleWavePoll(reason || "startup").catch((err) => warn("wave poll init failed", err));
}

chrome.runtime.onInstalled.addListener(() => initializePolling("installed"));
chrome.runtime.onStartup.addListener(() => initializePolling("startup"));

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await loadState();
      chrome.alarms.get(ALARM_NAME, (alarm) => {
        if (chrome.runtime?.lastError) {
          warn("alarm check failed", chrome.runtime.lastError);
          return;
        }
        if (alarm) return;
        const initialDelay = state.lastProgress ? computeDelayMinutes(state.lastProgress) : 1;
        scheduleNextPoll(state.lastProgress, "activate", initialDelay);
      });
    })()
  );
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm?.name !== ALARM_NAME) return;
  handleWavePoll("alarm").catch((err) => warn("wave poll error", err));
});

chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId !== NOTIFICATION_ID) return;
  chrome.notifications.clear(notificationId);
  chrome.tabs.create({ url: WAVE_PAGE_URL });
});
