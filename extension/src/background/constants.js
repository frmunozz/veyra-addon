(() => {
  const defaults = {
    POLL_INTERVALS_MINUTES: { low: 30, mid: 10, high: 1 },
    WAVE_TARGET: 2400,
  };

  self.VeyraAddonBgConstants = Object.freeze(defaults);
})();
