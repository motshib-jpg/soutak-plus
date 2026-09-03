(() => {
  const cfg = window.SOUTAK_CONFIG?.ads || {};
  const slots = document.querySelectorAll("[data-ad-slot]");
  if (!slots.length) return;

  // Keep the page editorial when display advertising is not configured.
  if (!cfg.enabled || !cfg.publisherId) {
    slots.forEach(el => el.remove());
    return;
  }

  if (cfg.provider !== "adsense") {
    slots.forEach(el => el.remove());
    return;
  }

  if (!document.querySelector('script[data-soutak-adsense]')) {
    const script = document.createElement("script");
    script.async = true;
    script.crossOrigin = "anonymous";
    script.dataset.soutakAdsense = "1";
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(cfg.publisherId)}`;
    document.head.appendChild(script);
  }

  slots.forEach(el => {
    const slotName = el.dataset.adSlot;
    const slotId = cfg.slots?.[slotName];
    if (!slotId) {
      el.remove();
      return;
    }

    el.innerHTML = `
      <ins class="adsbygoogle"
        style="display:block"
        data-ad-client="${cfg.publisherId}"
        data-ad-slot="${slotId}"
        data-ad-format="auto"
        data-full-width-responsive="true"></ins>`;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (_) {}
  });
})();

