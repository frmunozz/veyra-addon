(() => {
  const defaults = {
    POLL_INTERVALS_MINUTES: { low: 3, mid: 2, high: 1 },
    WAVE_TARGET: 2400,
  };

  self.VeyraAddonBgConstants = Object.freeze(defaults);
})();
