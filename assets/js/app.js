(() => {
  const page = document.body.dataset.page || "";
  const root = "/";

  if (!document.querySelector('link[href="/assets/css/polish.css"]') && !document.querySelector('link[href="assets/css/polish.css"]') && !document.querySelector('link[href="../assets/css/polish.css"]')) {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "/assets/css/polish.css";
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
    ["home",`${root}index.html`,"الرئيسية"],
    ["content",`${root}content.html`,"المحتوى"],
    ["products",`${root}products.html`,"المواد الرقمية"],
    ["services",`${root}services.html`,"الخدمات"],
    ["sponsors",`${root}sponsors.html`,"التعاون"],
    ["about",`${root}about.html`,"عن صوتك+"]
  ];

  const header = document.getElementById("siteHeader");
  if (header) header.innerHTML = `<header class="site-header" id="header"><div class="container nav">
    <a class="brand" href="${root}index.html" aria-label="صوتك+ الرئيسية"><span class="mark">+</span><span>صوتك+</span></a>
    <nav class="menu" id="menu" aria-label="التنقل الرئيسي">${links.map(([id,url,label])=>`<a class="${page===id?"active":""}" ${page===id?'aria-current="page"':''} href="${url}">${label}</a>`).join("")}<a class="${page==="contact"?"active":""}" ${page==="contact"?'aria-current="page"':''} href="${root}contact.html">تواصل</a></nav>
    <div class="nav-actions"><a class="btn primary" href="${root}content.html">ابدأ القراءة</a><button class="mobile-btn" id="mobileBtn" aria-label="فتح القائمة" aria-expanded="false" aria-controls="menu">☰</button></div>
  </div></header>`;

  const footer = document.getElementById("siteFooter");
  if (footer) footer.innerHTML = `<footer class="site-footer"><div class="container footer">
    <div><a class="brand" href="${root}index.html"><span class="mark">+</span><span>صوتك+</span></a><p>محتوى عربي عملي يساعد صانع المحتوى على بناء حضور رقمي أكثر وضوحًا واستقلالًا.</p></div>
    <div><h4>استكشف</h4><a href="${root}content.html">المقالات والأدلة</a><a href="${root}products.html">المواد الرقمية</a><a href="${root}services.html">الخدمات</a></div>
    <div><h4>عن الموقع</h4><a href="${root}about.html">عن صوتك+</a><a href="${root}editorial.html">السياسة التحريرية</a><a href="${root}sponsors.html">التعاون والرعاية</a><a href="${root}contact.html">تواصل معنا</a></div>
    <div><h4>الخصوصية والشفافية</h4><a href="${root}privacy.html">سياسة الخصوصية</a><a href="${root}terms.html">الشروط والأحكام</a><a href="${root}editorial.html#ads">الإعلانات والشفافية</a></div>
  </div><div class="container copyright"><span>© ${new Date().getFullYear()} صوتك+ — جميع الحقوق محفوظة.</span><span>لا نقدم وعودًا مضمونة بالشهرة أو الدخل أو النتائج التجارية.</span></div></footer>`;

  document.querySelectorAll('a[href*="post.html?slug="]').forEach(a=>{
    try {
      const u=new URL(a.getAttribute("href"), location.href);
      const slug=u.searchParams.get("slug");
      if(slug) a.href=`${root}articles/${encodeURIComponent(slug)}.html`;
    } catch(_) {}
  });

  if (location.pathname.startsWith("/articles/")) {
    const article = document.querySelector("article.article-wrap");
    const meta = article?.querySelector(".article-meta-row");
    if (article && meta && !article.querySelector(".article-byline")) {
      const byline = document.createElement("div");
      byline.className = "article-byline";
      byline.innerHTML = `<span class="byline-mark">ص+</span><span><b>إعداد فريق تحرير صوتك+</b><small>محتوى عملي يُراجع من حيث الوضوح والفائدة والشفافية.</small></span><a href="${root}editorial.html">منهج التحرير</a>`;
      meta.insertAdjacentElement("afterend", byline);
    }
    document.querySelectorAll('script[type="application/ld+json"]').forEach(script=>{
      try {
        const data=JSON.parse(script.textContent||"{}");
        if(data['@type']==='Article' && !data.author){
          data.author={"@type":"Organization","name":"فريق تحرير صوتك+","url":"https://soutak-plus.vercel.app/editorial.html"};
          script.textContent=JSON.stringify(data);
        }
      } catch(_) {}
    });
  }

  // Privacy notices belong only to public submission forms and are not duplicated when the page already explains them.
  if (!["admin","login","account","product"].includes(page)) {
    document.querySelectorAll('form[id$="Form"]').forEach(form=>{
      const card=form.closest('.form-card,.newsletter') || form.parentElement;
      const alreadyExplained = card?.querySelector('.form-privacy, .fallback-note a[href*="privacy"]');
      if(card && !alreadyExplained){
        const note=document.createElement('p');
        note.className='form-privacy';
        note.innerHTML=`بإرسال هذا النموذج، ستتم معالجة البيانات للغرض الموضح فقط وفق <a href="${root}privacy.html">سياسة الخصوصية</a>.`;
        form.insertAdjacentElement('afterend',note);
      }
    });
  }
  document.querySelectorAll('.form-status').forEach(el=>{
    el.setAttribute('role','status');
    el.setAttribute('aria-live','polite');
  });
  document.querySelectorAll('a[target="_blank"]').forEach(a=>{
    const rel=new Set((a.getAttribute('rel')||'').split(/\s+/).filter(Boolean));
    rel.add('noopener'); rel.add('noreferrer');
    a.setAttribute('rel',[...rel].join(' '));
  });

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
})();
