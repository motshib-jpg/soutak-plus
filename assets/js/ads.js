(() => {
  const cfg = window.SOUTAK_CONFIG?.ads || {};
  const slots = document.querySelectorAll("[data-ad-slot]");
  if (!slots.length) return;

  function placeholder(el, label) {
    el.innerHTML = `
      <div class="ad-placeholder">
        <span>إعلان</span>
        <small>${label}</small>
      </div>`;
  }

  // When not configured, clearly show demo placeholders.
  if (!cfg.enabled || !cfg.publisherId) {
    slots.forEach(el => placeholder(el, "مساحة إعلانية تجريبية"));
    return;
  }

  if (cfg.provider !== "adsense") {
    slots.forEach(el => placeholder(el, "مزود الإعلانات غير مهيأ"));
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
      placeholder(el, "لم يتم تعيين رقم هذه المساحة");
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
