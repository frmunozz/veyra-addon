(() => {
  const constants = {
    TAG: "[Veyra Addon]",
    STORAGE_KEY: "addonEnabled",
    NATIVE_DRAWER_ID: "sideDrawer",
    ASIDE_ID: "veyra-addon-aside",
    ASIDE_TOGGLE_ID: "veyra-addon-aside-toggle",
    NAV_FAB_ID: "nav_fab",
    ASIDE_BACKDROP_ID: "veyra-addon-aside-backdrop",
    MENU_MOUNT_FLAG: "veyraAddonMenuMounted",
    POLL_INTERVALS_MINUTES: { low: 60, mid: 30, high: 10 },
    WAVE_TARGET: 2500,
  };

  window.VeyraAddonConstants = Object.freeze(constants);
})();
