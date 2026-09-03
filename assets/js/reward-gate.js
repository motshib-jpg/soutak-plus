(async () => {
  if (document.body.dataset.page !== "product") return;
  const files = {
    "creator-starter-guide": "downloads/creator-starter-guide.md",
    "content-templates": "downloads/content-templates.md",
    "first-audience": "downloads/first-audience-roadmap.md"
  };
  const rewardPolicy = {
    "creator-starter-guide": 5,
    "content-templates": 5,
    "first-audience": 10
  };
  await loadScript("assets/js/rewarded-ads.js");
  const db = window.SoutakDB;
  const slug = new URLSearchParams(location.search).get("slug");
  const view = document.getElementById("productView");
  if (!view || !slug || !rewardPolicy[slug]) {
    if (view) view.innerHTML = "<div class='form-card'><h2>المادة غير موجودة</h2></div>";
    return;
  }
  let product = null;
  if (db?.enabled) {
    const { data, error } = await db.client.from("soutak_products").select("id,slug,name,short_description,description,type,status").eq("slug", slug).eq("status", "published").maybeSingle();
    if (!error) product = data;
  }
  if (!product) {
    view.innerHTML = "<div class='form-card'><h2>تعذر تحميل المادة حاليًا</h2><p>حاول تحديث الصفحة بعد قليل.</p></div>";
    return;
  }
  const required = rewardPolicy[slug];
  const progressKey = `soutak_reward_progress:${slug}:v2`;
  const unlockKey = `soutak_reward_unlocked:${slug}:v2`;
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
          <div class="reward-head"><div><span class="eyebrow">طريقة الفتح</span><h3>شاهد ${required} إعلانات مكافأة لفتح هذه المادة</h3></div><b id="rewardCount">${progress}/${required}</b></div>
          <div class="reward-progress"><i id="rewardProgressBar" style="width:${Math.round((progress/required)*100)}%"></i></div>
          <p class="muted reward-policy">كل إعلان مكتمل = خطوة واحدة. لا تُحسب الخطوة إلا عند منح مكافأة الإعلان فعليًا.</p>
          <div class="reward-actions"><button class="btn primary" id="watchRewardAd" ${unlocked ? "disabled" : ""}>${unlocked ? "المادة مفتوحة" : "مشاهدة إعلان مكافأة"}</button><a class="btn ghost" href="products.html">ليس الآن</a></div>
          <div class="form-status" id="rewardStatus"></div>
        </div>
        <div class="resource-reader ${unlocked ? "" : "locked"}" id="resourceReader">${unlocked ? "<p>جارٍ تحميل المادة...</p>" : "<div class='locked-message'>🔒 أكمل إعلانات المكافأة لفتح المحتوى.</div>"}</div>
      </div>
    </div>`;
  const btn = document.getElementById("watchRewardAd");
  const status = document.getElementById("rewardStatus");
  if (unlocked) { await showResource(); return; }
  if (!window.SoutakRewardedAds?.configured) {
    status.className = "form-status err";
    status.textContent = "إعلانات المكافأة غير متاحة مؤقتًا. حاول لاحقًا.";
    btn.disabled = true;
    return;
  }
  btn.addEventListener("click", async () => {
    btn.disabled = true;
    status.className = "form-status";
    status.textContent = `سيُعرض إعلان مكافأة واحد. التقدم الحالي ${progress}/${required}.`;
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
      const map = {rewarded_not_configured:"إعلانات المكافأة غير متاحة حاليًا.",rewarded_unsupported:"هذا الجهاز لا يدعم الإعلان المكافئ حاليًا.",rewarded_no_fill:"لا يوجد إعلان متاح الآن. حاول لاحقًا.",reward_not_completed:"لم تكتمل المكافأة، لذلك لم يُحتسب الإعلان.",rewarded_show_failed:"تعذر عرض الإعلان."};
      status.textContent = map[err.message] || "تعذر إكمال إعلان المكافأة. حاول لاحقًا.";
    } finally { if (!unlocked) btn.disabled = false; }
  });
  function updateProgress() { document.getElementById("rewardCount").textContent = `${progress}/${required}`; document.getElementById("rewardProgressBar").style.width = `${Math.round((progress/required)*100)}%`; }
  async function showResource() {
    const reader = document.getElementById("resourceReader"); reader.classList.remove("locked"); const file = files[slug];
    try { const res = await fetch(file, { cache:"no-store" }); if(!res.ok) throw new Error("load_failed"); const md = await res.text(); reader.innerHTML = `<article class="free-resource">${renderMarkdown(md)}</article>`; }
    catch (_) { reader.innerHTML = "<p>تعذر تحميل المادة الآن. حاول تحديث الصفحة.</p>"; }
  }
  function renderMarkdown(md) { return esc(md).replace(/^### (.+)$/gm,"<h3>$1</h3>").replace(/^## (.+)$/gm,"<h2>$1</h2>").replace(/^# (.+)$/gm,"<h1>$1</h1>").replace(/^- (.+)$/gm,"<li>$1</li>").replace(/^\d+\. (.+)$/gm,"<li>$1</li>").replace(/\n{2,}/g,"</p><p>").replace(/\n/g,"<br>"); }
  function esc(s) { return String(s ?? "").replace(/[&<>"]/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m])); }
  function loadScript(src) { return new Promise((resolve,reject) => { if (document.querySelector(`script[src="${src}"]`)) return resolve(); const s=document.createElement("script"); s.src=src; s.onload=resolve; s.onerror=reject; document.head.appendChild(s); }); }
})();
