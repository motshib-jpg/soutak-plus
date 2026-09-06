(() => {
  const page = document.body.dataset.page || "";

  if (!document.querySelector('link[href="assets/css/polish.css"]')) {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "assets/css/polish.css";
    document.head.appendChild(css);
  }

  if (!document.querySelector(".skip-link")) {
    const skip = document.createElement("a");
    skip.className = "skip-link";
    skip.href = "#mainContent";
    skip.textContent = "تجاوز إلى المحتوى";
    document.body.prepend(skip);
  }
  const main = document.querySelector("main");
  if (main && !main.id) main.id = "mainContent";

  const links = [
    ["home","index.html","الرئيسية"],
    ["content","content.html","المحتوى"],
    ["products","products.html","المواد الرقمية"],
    ["services","services.html","الخدمات"],
    ["sponsors","sponsors.html","التعاون"],
    ["about","about.html","عن صوتك+"]
  ];

  const header = document.getElementById("siteHeader");
  if (header) header.innerHTML = `<header class="site-header" id="header"><div class="container nav">
    <a class="brand" href="index.html" aria-label="صوتك+ الرئيسية"><span class="mark">+</span><span>صوتك+</span></a>
    <nav class="menu" id="menu" aria-label="التنقل الرئيسي">${links.map(([id,url,label])=>`<a class="${page===id?"active":""}" href="${url}">${label}</a>`).join("")}<a class="${page==="contact"?"active":""}" href="contact.html">تواصل</a></nav>
    <div class="nav-actions"><a class="btn primary" href="content.html">ابدأ القراءة</a><button class="mobile-btn" id="mobileBtn" aria-label="فتح القائمة" aria-expanded="false" aria-controls="menu">☰</button></div>
  </div></header>`;

  const footer = document.getElementById("siteFooter");
  if (footer) footer.innerHTML = `<footer class="site-footer"><div class="container footer">
    <div><a class="brand" href="index.html"><span class="mark">+</span><span>صوتك+</span></a><p>محتوى عربي عملي يساعد صانع المحتوى على بناء حضور رقمي أكثر وضوحًا واستقلالًا.</p></div>
    <div><h4>استكشف</h4><a href="content.html">المقالات والأدلة</a><a href="products.html">المواد الرقمية</a><a href="services.html">الخدمات</a></div>
    <div><h4>عن الموقع</h4><a href="about.html">عن صوتك+</a><a href="editorial.html">السياسة التحريرية</a><a href="sponsors.html">التعاون والرعاية</a><a href="contact.html">تواصل معنا</a></div>
    <div><h4>الخصوصية والشفافية</h4><a href="privacy.html">سياسة الخصوصية</a><a href="terms.html">الشروط والأحكام</a><a href="editorial.html#ads">الإعلانات والشفافية</a></div>
  </div><div class="container copyright"><span>© ${new Date().getFullYear()} صوتك+ — جميع الحقوق محفوظة.</span><span>لا نقدم وعودًا مضمونة بالشهرة أو الدخل أو النتائج التجارية.</span></div></footer>`;

  const menu = document.getElementById("menu"), btn = document.getElementById("mobileBtn");
  btn?.addEventListener("click",()=>{
    const open = menu.classList.toggle("open");
    btn.setAttribute("aria-expanded", String(open));
  });
  menu?.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{
    menu.classList.remove("open");
    btn?.setAttribute("aria-expanded","false");
  }));

  window.addEventListener("scroll",()=> {
    document.getElementById("header")?.classList.toggle("scrolled", scrollY>20);
    document.getElementById("toTop")?.classList.toggle("show", scrollY>600);
  },{passive:true});
  document.getElementById("toTop")?.addEventListener("click",()=>scrollTo({top:0,behavior:"smooth"}));

  const obs = "IntersectionObserver" in window ? new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("show");obs.unobserve(e.target)}}),{threshold:.1}) : null;
  document.querySelectorAll(".reveal").forEach(el=>obs?obs.observe(el):el.classList.add("show"));

  if (window.SOUTAK_CONFIG?.analyticsEnabled && window.SoutakDB?.enabled && navigator.doNotTrack !== "1") {
    const key="soutak_session"; let sid=localStorage.getItem(key);
    if(!sid){sid=crypto.randomUUID?.() || String(Date.now());localStorage.setItem(key,sid)}
    window.SoutakDB.client.rpc("soutak_track_event_public",{p_event_name:"page_view",p_path:location.pathname,p_referrer:document.referrer||null,p_session_id:sid,p_metadata:{page}}).then(()=>{}).catch(()=>{});
  }
})();
