(() => {
  const cfg = window.SOUTAK_CONFIG?.ads?.rewarded || {};
  const state = {
    readyEvent: null,
    slot: null,
    loading: false,
    resolved: false
  };

  function loadGPT() {
    return new Promise((resolve, reject) => {
      if (window.googletag?.apiReady) return resolve();

      window.googletag = window.googletag || { cmd: [] };

      if (!document.querySelector('script[data-soutak-gpt]')) {
        const s = document.createElement("script");
        s.async = true;
        s.src = "https://securepubads.g.doubleclick.net/tag/js/gpt.js";
        s.dataset.soutakGpt = "1";
        s.onload = resolve;
        s.onerror = () => reject(new Error("gpt_load_failed"));
        document.head.appendChild(s);
      } else {
        const timer = setInterval(() => {
          if (window.googletag?.apiReady) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
        setTimeout(() => {
          clearInterval(timer);
          if (!window.googletag?.apiReady) reject(new Error("gpt_timeout"));
        }, 8000);
      }
    });
  }

  async function showOneRewardedAd() {
    if (!cfg.enabled || cfg.provider !== "google_ad_manager" || !cfg.adUnitPath) {
      throw new Error("rewarded_not_configured");
    }

    if (state.loading) throw new Error("rewarded_busy");
    state.loading = true;
    state.resolved = false;
    state.readyEvent = null;
    state.slot = null;

    try {
      await loadGPT();

      return await new Promise((resolve, reject) => {
        let settled = false;
        const finish = (ok, reason) => {
          if (settled) return;
          settled = true;
          state.loading = false;
          if (ok) resolve({ granted: true });
          else reject(new Error(reason || "reward_not_granted"));
        };

        googletag.cmd.push(() => {
          const pubads = googletag.pubads();

          const slot = googletag.defineOutOfPageSlot(
            cfg.adUnitPath,
            googletag.enums.OutOfPageFormat.REWARDED
          );

          if (!slot) {
            state.loading = false;
            reject(new Error("rewarded_unsupported"));
            return;
          }

          state.slot = slot;
          slot.addService(pubads);

          const onReady = (event) => {
            if (event.slot !== slot) return;
            state.readyEvent = event;
            // User has already clicked an explicit "watch" button before this function.
            const shown = event.makeRewardedVisible();
            if (!shown) finish(false, "rewarded_show_failed");
          };

          const onGranted = (event) => {
            if (event.slot !== slot) return;
            state.resolved = true;
            finish(true);
          };

          const onClosed = (event) => {
            if (event.slot !== slot) return;
            if (!state.resolved) finish(false, "reward_not_completed");
            try { googletag.destroySlots([slot]); } catch (_) {}
          };

          pubads.addEventListener("rewardedSlotReady", onReady);
          pubads.addEventListener("rewardedSlotGranted", onGranted);
          pubads.addEventListener("rewardedSlotClosed", onClosed);

          googletag.enableServices();
          googletag.display(slot);

          setTimeout(() => {
            if (!settled && !state.readyEvent) {
              try { googletag.destroySlots([slot]); } catch (_) {}
              finish(false, "rewarded_no_fill");
            }
          }, 12000);
        });
      });
    } catch (err) {
      state.loading = false;
      throw err;
    }
  }

  window.SoutakRewardedAds = {
    configured: Boolean(
      cfg.enabled &&
      cfg.provider === "google_ad_manager" &&
      cfg.adUnitPath
    ),
    showOneRewardedAd
  };
})();
