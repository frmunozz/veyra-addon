(() => {
  const defaults = {
    POLL_INTERVALS_MINUTES: { low: 30, mid: 15, high: 5 },
    WAVE_TARGET: 2490,
  };

  self.VeyraAddonBgConstants = Object.freeze(defaults);
})();
