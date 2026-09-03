(() => {
  const page = document.body.dataset.page || "";
  const links = [
    ["home","index.html","الرئيسية"],["content","content.html","المحتوى"],["products","products.html","المتجر"],
    ["services","services.html","الخدمات"],["sponsors","sponsors.html","الرعايات"],["about","about.html","عن المشروع"]
  ];
  const header = document.getElementById("siteHeader");
  if (header) header.innerHTML = `<header class="site-header" id="header"><div class="container nav">
    <a class="brand" href="index.html"><span class="mark">+</span><span>صوتك+</span></a>
    <nav class="menu" id="menu">${links.map(([id,url,label])=>`<a class="${page===id?"active":""}" href="${url}">${label}</a>`).join("")}<a href="contact.html">تواصل</a></nav>
    <div class="nav-actions"><a class="btn primary" href="index.html#newsletterForm">انضم الآن</a><button class="mobile-btn" id="mobileBtn" aria-label="فتح القائمة">☰</button></div>
  </div></header>`;
  const footer = document.getElementById("siteFooter");
  if (footer) footer.innerHTML = `<footer class="site-footer"><div class="container footer">
    <div><a class="brand" href="index.html"><span class="mark">+</span><span>صوتك+</span></a><p>حوّل صوتك إلى جمهور، وجمهورك إلى فرص.</p></div>
    <div><h4>الموقع</h4><a href="content.html">المحتوى</a><a href="products.html">المتجر</a><a href="services.html">الخدمات</a></div>
    <div><h4>التعاون</h4><a href="sponsors.html">الرعايات</a><a href="contact.html">تواصل</a><a href="login.html">الإدارة</a></div>
    <div><h4>قانوني</h4><a href="privacy.html">الخصوصية</a><a href="terms.html">الشروط</a></div>
  </div><div class="container copyright"><span>© ${new Date().getFullYear()} صوتك+</span><span>بدون وعود زائفة بالشهرة أو الدخل.</span></div></footer>`;
  const menu = document.getElementById("menu"), btn = document.getElementById("mobileBtn");
  btn?.addEventListener("click",()=>menu.classList.toggle("open"));
  window.addEventListener("scroll",()=> {document.getElementById("header")?.classList.toggle("scrolled", scrollY>20);document.getElementById("toTop")?.classList.toggle("show", scrollY>600);},{passive:true});
  document.getElementById("toTop")?.addEventListener("click",()=>scrollTo({top:0,behavior:"smooth"}));
  const obs = "IntersectionObserver" in window ? new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("show");obs.unobserve(e.target)}}),{threshold:.1}) : null;
  document.querySelectorAll(".reveal").forEach(el=>obs?obs.observe(el):el.classList.add("show"));
  if (window.SOUTAK_CONFIG?.analyticsEnabled && window.SoutakDB?.enabled && navigator.doNotTrack !== "1") {
    const key="soutak_session"; let sid=localStorage.getItem(key);
    if(!sid){sid=crypto.randomUUID?.() || String(Date.now());localStorage.setItem(key,sid)}
    window.SoutakDB.client.rpc("soutak_track_event_public",{p_event_name:"page_view",p_path:location.pathname,p_referrer:document.referrer||null,p_session_id:sid,p_metadata:{page}}).then(()=>{}).catch(()=>{});
  }
})();
