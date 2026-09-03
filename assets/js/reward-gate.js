(async () => {
  if (document.body.dataset.page !== "product") return;

  const files = {
    "creator-starter-guide": "downloads/creator-starter-guide.md",
    "content-templates": "downloads/content-templates.md",
    "first-audience": "downloads/first-audience-roadmap.md"
  };

  await loadScript("assets/js/demo-data.js");
  await loadScript("assets/js/rewarded-ads.js");

  const db = window.SoutakDB;
  const slug = new URLSearchParams(location.search).get("slug");
  let products = [];

  if (db?.enabled) {
    const { data, error } = await db.client
      .from("products")
      .select("id,slug,name,short_description,description,type,reward_ads_required,status")
      .eq("status", "published")
      .order("created_at", { ascending:false });
    if (!error && data?.length) products = data;
  }

  if (!products.length) products = window.SOUTAK_DEMO.products || [];

  const product = products.find(p => p.slug === slug);
  const view = document.getElementById("productView");
  if (!view || !product) {
    if (view) view.innerHTML = "<div class='form-card'><h2>المادة غير موجودة</h2></div>";
    return;
  }

  const required = Math.max(1, Number(product.reward_ads_required || 5));
  const progressKey = `soutak_reward_progress:${slug}:v1`;
  const unlockKey = `soutak_reward_unlocked:${slug}:v1`;

  let progress = Math.min(required, Number(localStorage.getItem(progressKey) || 0));
  let unlocked = localStorage.getItem(unlockKey) === "1";

  view.innerHTML = `
    <div class="product-view">
      <div class="product-hero-cover">🎁</div>
      <div>
        <span class="free-badge">بدون دفع مالي</span>
        <h1 style="font-size:42px;margin:12px 0">${esc(product.name)}</h1>
        <p class="muted">${esc(product.description || product.short_description || "")}</p>

        <div class="reward-box" id="rewardBox">
          <div class="reward-head">
            <div>
              <span class="eyebrow">طريقة الفتح</span>
              <h3>شاهد ${required} إعلانات مكافأة لفتح هذه المادة</h3>
            </div>
            <b id="rewardCount">${progress}/${required}</b>
          </div>

          <div class="reward-progress">
            <i id="rewardProgressBar" style="width:${Math.round((progress/required)*100)}%"></i>
          </div>

          <p class="muted reward-policy">
            كل إعلان مكتمل = خطوة واحدة. يمكنك رفض أو إغلاق الإعلان، ولن تُحسب الخطوة عند عدم اكتمال المكافأة.
            لا حاجة للنقر على الإعلان.
          </p>

          <div class="reward-actions">
            <button class="btn primary" id="watchRewardAd" ${unlocked ? "disabled" : ""}>
              ${unlocked ? "المادة مفتوحة" : "مشاهدة إعلان مكافأة"}
            </button>
            <a class="btn ghost" href="products.html">ليس الآن</a>
          </div>

          <div class="form-status" id="rewardStatus"></div>
        </div>

        <div class="resource-reader ${unlocked ? "" : "locked"}" id="resourceReader">
          ${unlocked ? "<p>جارٍ تحميل المادة...</p>" : "<div class='locked-message'>🔒 أكمل إعلانات المكافأة لفتح المحتوى في هذا المتصفح.</div>"}
        </div>
      </div>
    </div>`;

  const btn = document.getElementById("watchRewardAd");
  const status = document.getElementById("rewardStatus");

  if (unlocked) {
    await showResource();
    return;
  }

  if (!window.SoutakRewardedAds?.configured) {
    status.className = "form-status err";
    status.textContent = "إعلانات المكافأة غير مربوطة بعد بمزود إعلاني حقيقي؛ التقدم معطل في النسخة التجريبية.";
    btn.disabled = true;
    return;
  }

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    status.className = "form-status";
    status.textContent = `سيُعرض إعلان مكافأة واحد. عند منحه المكافأة سيصبح تقدمك ${Math.min(progress + 1, required)}/${required}.`;

    try {
      const result = await window.SoutakRewardedAds.showOneRewardedAd();

      if (result?.granted) {
        progress = Math.min(required, progress + 1);
        localStorage.setItem(progressKey, String(progress));
        updateProgress();

        if (progress >= required) {
          unlocked = true;
          localStorage.setItem(unlockKey, "1");
          status.className = "form-status ok";
          status.textContent = "تم فتح المادة بنجاح.";
          btn.textContent = "المادة مفتوحة";
          await showResource();
          return;
        }

        status.className = "form-status ok";
        status.textContent = `تم احتساب الإعلان. بقي ${required - progress}.`;
      }
    } catch (err) {
      status.className = "form-status err";
      const map = {
        rewarded_not_configured: "إعلانات المكافأة غير مفعلة.",
        rewarded_unsupported: "هذا الجهاز أو الصفحة لا يدعم صيغة الإعلان المكافئ حاليًا.",
        rewarded_no_fill: "لا يوجد إعلان متاح الآن. حاول لاحقًا.",
        reward_not_completed: "لم تكتمل المكافأة، لذلك لم نحتسب هذا الإعلان.",
        rewarded_show_failed: "تعذر عرض الإعلان."
      };
      status.textContent = map[err.message] || "تعذر إكمال إعلان المكافأة. حاول لاحقًا.";
    } finally {
      if (!unlocked) btn.disabled = false;
    }
  });

  function updateProgress() {
    document.getElementById("rewardCount").textContent = `${progress}/${required}`;
    document.getElementById("rewardProgressBar").style.width = `${Math.round((progress/required)*100)}%`;
  }

  async function showResource() {
    const reader = document.getElementById("resourceReader");
    reader.classList.remove("locked");
    const file = files[slug];

    if (!file) {
      reader.innerHTML = "<p>المحتوى الحقيقي لهذه المادة لم يُربط بعد.</p>";
      return;
    }

    try {
      const res = await fetch(file, { cache:"no-store" });
      const md = await res.text();
      reader.innerHTML = `<article class="free-resource">${renderMarkdown(md)}</article>`;
    } catch (_) {
      reader.innerHTML = "<p>تعذر تحميل المادة. شغّل الموقع عبر START_SOUTAK_PLUS.bat بدل فتح الملف مباشرة.</p>";
    }
  }

  function renderMarkdown(md) {
    return esc(md)
      .replace(/^### (.+)$/gm, "<h3>$1</h3>")
      .replace(/^## (.+)$/gm, "<h2>$1</h2>")
      .replace(/^# (.+)$/gm, "<h1>$1</h1>")
      .replace(/^- (.+)$/gm, "<li>$1</li>")
      .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
      .replace(/\n{2,}/g, "</p><p>")
      .replace(/\n/g, "<br>");
  }

  function esc(s) {
    return String(s ?? "").replace(/[&<>"]/g, m => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;"
    }[m]));
  }

  function loadScript(src) {
    return new Promise(resolve => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve();
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      document.head.appendChild(s);
    });
  }
})();
