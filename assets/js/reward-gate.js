(async () => {
  if (document.body.dataset.page !== "product") return;

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

  if (!db?.enabled) {
    view.innerHTML = "<div class='form-card'><h2>تعذر الاتصال بالخدمة</h2><p>حاول تحديث الصفحة بعد قليل.</p></div>";
    return;
  }

  const { data: productData, error: productError } = await db.client
    .from("soutak_products")
    .select("id,slug,name,short_description,description,type,status")
    .eq("slug", slug).eq("status", "published").maybeSingle();

  if (productError || !productData) {
    view.innerHTML = "<div class='form-card'><h2>تعذر تحميل المادة حاليًا</h2><p>حاول تحديث الصفحة بعد قليل.</p></div>";
    return;
  }

  const { data: { session } } = await db.client.auth.getSession();
  const required = rewardPolicy[slug];
  let progress = 0;
  let unlocked = false;
  let protectedFile = null;

  view.innerHTML = `
    <div class="product-view">
      <div class="product-hero-cover">🎁</div>
      <div>
        <span class="free-badge">بدون دفع مالي</span>
        <h1 style="font-size:42px;margin:12px 0">${esc(productData.name)}</h1>
        <p class="muted">${esc(productData.description || productData.short_description || "")}</p>
        <div class="reward-box" id="rewardBox">
          <div class="reward-head"><div><span class="eyebrow">طريقة الفتح</span><h3>شاهد ${required} إعلانات مكافأة لفتح هذه المادة</h3></div><b id="rewardCount">0/${required}</b></div>
          <div class="reward-progress"><i id="rewardProgressBar" style="width:0%"></i></div>
          <p class="muted reward-policy">الاستحقاق محفوظ في الخادم لحسابك. تعديل بيانات المتصفح لا يفتح المحتوى. الإعلان لا يُحتسب إلا بعد حدث منح المكافأة.</p>
          <div class="reward-actions" id="rewardActions"></div>
          <div class="form-status" id="rewardStatus"></div>
        </div>
        <div class="resource-reader locked" id="resourceReader"><div class='locked-message'>🔒 أكمل إعلانات المكافأة لفتح المحتوى.</div></div>
      </div>
    </div>`;

  const actions = document.getElementById("rewardActions");
  const status = document.getElementById("rewardStatus");
  const reader = document.getElementById("resourceReader");

  if (!session) {
    const returnTo = `product.html?slug=${encodeURIComponent(slug)}`;
    actions.innerHTML = `<a class="btn primary" href="account.html?return=${encodeURIComponent(returnTo)}">تسجيل الدخول للمتابعة</a><a class="btn ghost" href="products.html">ليس الآن</a>`;
    status.className = "form-status";
    status.textContent = "يلزم تسجيل الدخول لحفظ الاستحقاق بشكل آمن وربطه بحسابك.";
    return;
  }

  actions.innerHTML = `<button class="btn primary" id="watchRewardAd">مشاهدة إعلان مكافأة</button><a class="btn ghost" href="products.html">ليس الآن</a>`;
  const btn = document.getElementById("watchRewardAd");

  try {
    const current = await rewardApi("status");
    progress = Number(current.progress || 0);
    unlocked = Boolean(current.unlocked);
    updateProgress();
  } catch (_) {
    status.className = "form-status err";
    status.textContent = "تعذر التحقق من الاستحقاق. حاول تحديث الصفحة.";
    btn.disabled = true;
    return;
  }

  if (unlocked) {
    btn.disabled = true;
    btn.textContent = "المادة مفتوحة";
    await showResource();
    return;
  }

  if (!window.SoutakRewardedAds?.configured) {
    status.className = "form-status err";
    status.textContent = "إعلانات المكافأة غير متاحة مؤقتًا. لن يتم احتساب أي تقدم دون إعلان حقيقي مكتمل.";
    btn.disabled = true;
    return;
  }

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    status.className = "form-status";
    status.textContent = `سيُعرض إعلان مكافأة واحد. التقدم الحالي ${progress}/${required}.`;
    let challengeId = null;
    try {
      const challenge = await rewardApi("start");
      challengeId = challenge.challengeId;
      if (!challengeId) throw new Error("challenge_create_failed");

      const result = await window.SoutakRewardedAds.showOneRewardedAd();
      if (!result?.granted) throw new Error("reward_not_completed");

      const grant = await rewardApi("grant", {
        challengeId,
        rewardType: result.rewardType ?? null,
        rewardAmount: result.rewardAmount ?? null
      });
      progress = Number(grant.progress || 0);
      unlocked = Boolean(grant.unlocked);
      updateProgress();

      if (unlocked) {
        status.className = "form-status ok";
        status.textContent = "تم فتح المادة بنجاح وحفظ الاستحقاق في حسابك.";
        btn.textContent = "المادة مفتوحة";
        await showResource();
        return;
      }

      status.className = "form-status ok";
      status.textContent = `تم احتساب الإعلان في الخادم. بقي ${required - progress}.`;
    } catch (err) {
      status.className = "form-status err";
      const map = {
        rewarded_not_configured:"إعلانات المكافأة غير متاحة حاليًا.",
        rewarded_unsupported:"هذا الجهاز لا يدعم الإعلان المكافئ حاليًا.",
        rewarded_no_fill:"لا يوجد إعلان متاح الآن. حاول لاحقًا.",
        reward_not_completed:"لم تكتمل المكافأة، لذلك لم يُحتسب الإعلان.",
        rewarded_show_failed:"تعذر عرض الإعلان.",
        challenge_too_early:"تعذر اعتماد المكافأة بشكل آمن. حاول مرة أخرى.",
        challenge_expired:"انتهت محاولة الإعلان قبل اعتماد المكافأة. حاول مرة أخرى."
      };
      status.textContent = map[err.message] || "تعذر اعتماد إعلان المكافأة. لم يتم احتساب أي تقدم.";
    } finally {
      if (!unlocked) btn.disabled = false;
    }
  });

  async function rewardApi(action, extra = {}) {
    const { data: { session: currentSession } } = await db.client.auth.getSession();
    if (!currentSession?.access_token) throw new Error("auth_required");
    const runtime = window.SOUTAK_RUNTIME_CONFIG || {};
    const fallback = window.SOUTAK_CONFIG || {};
    const supabaseUrl = runtime.supabaseUrl || fallback.supabaseUrl || "";
    const publishableKey = runtime.supabasePublishableKey || fallback.supabasePublishableKey || "";
    if (!supabaseUrl || !publishableKey) throw new Error("service_unavailable");

    const res = await fetch(`${supabaseUrl}/functions/v1/soutak-reward`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${currentSession.access_token}`,
        "apikey": publishableKey
      },
      body: JSON.stringify({ action, slug, ...extra })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "reward_api_failed");
    return data;
  }

  function updateProgress() {
    document.getElementById("rewardCount").textContent = `${progress}/${required}`;
    document.getElementById("rewardProgressBar").style.width = `${Math.round((progress / required) * 100)}%`;
  }

  async function showResource() {
    reader.classList.remove("locked");
    reader.innerHTML = "<p>جارٍ تحميل المادة المحمية...</p>";
    try {
      protectedFile = await rewardApi("content");
      reader.innerHTML = `<article class="free-resource">${renderMarkdown(protectedFile.content || "")}</article><div class="reward-actions top-gap"><button class="btn primary" id="downloadProtectedFile">تنزيل الملف</button></div>`;
      document.getElementById("downloadProtectedFile")?.addEventListener("click", () => {
        const blob = new Blob([protectedFile.content || ""], { type: protectedFile.mimeType || "text/markdown;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = protectedFile.filename || `${slug}.md`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      });
    } catch (_) {
      reader.classList.add("locked");
      reader.innerHTML = "<div class='locked-message'>🔒 لا يوجد استحقاق صالح لهذا الحساب.</div>";
    }
  }

  function renderMarkdown(md) {
    return esc(md).replace(/^### (.+)$/gm,"<h3>$1</h3>").replace(/^## (.+)$/gm,"<h2>$1</h2>").replace(/^# (.+)$/gm,"<h1>$1</h1>").replace(/^- (.+)$/gm,"<li>$1</li>").replace(/^\d+\. (.+)$/gm,"<li>$1</li>").replace(/\n{2,}/g,"</p><p>").replace(/\n/g,"<br>");
  }
  function esc(s) { return String(s ?? "").replace(/[&<>\"]/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;"}[m])); }
  function loadScript(src) { return new Promise((resolve,reject) => { if (document.querySelector(`script[src="${src}"]`)) return resolve(); const s=document.createElement("script"); s.src=src; s.onload=resolve; s.onerror=reject; document.head.appendChild(s); }); }
})();
