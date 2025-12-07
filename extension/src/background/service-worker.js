self.addEventListener("install", () => {
  console.log("[Veyra Addon] service worker installed");
});

self.addEventListener("activate", () => {
  console.log("[Veyra Addon] service worker active");
});

// Placeholder: use this file once you need cross-tab state, caching, or rules.
