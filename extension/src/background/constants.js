(() => {
  const defaults = {
    POLL_INTERVALS_MINUTES: { low: 30, mid: 5, high: 1 },
    WAVE_TARGET: 2480,
  };

  self.VeyraAddonBgConstants = Object.freeze(defaults);
})();
