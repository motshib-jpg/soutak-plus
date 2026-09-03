(async()=>{
  if(document.body.dataset.page!=="products") return;
  await loadScript("assets/js/demo-data.js");
  const db=window.SoutakDB;
  const rewardPolicy={
    "creator-starter-guide":5,
    "content-templates":5,
    "first-audience":10
  };
  let list=[];

  if(db?.enabled){
    const {data,error}=await db.client
      .from("products")
      .select("id,slug,name,short_description,description,type,reward_ads_required,status")
      .eq("status","published")
      .order("created_at",{ascending:false});
    if(!error && data?.length) list=data;
  }

  if(!list.length) list=window.SOUTAK_DEMO.products||[];
  list=list.filter(p=>Object.prototype.hasOwnProperty.call(rewardPolicy,p.slug));

  const banner=document.getElementById("modeBanner");
  banner.className="mode-banner";
  banner.textContent="المواد تفتح فقط بإعلانات المكافأة المكتملة: 5 + 5 + 10. لا اشتراكات مدفوعة ولا دفع نقدي.";

  document.getElementById("productsGrid").innerHTML=list.map((p,i)=>{
    const required=rewardPolicy[p.slug];
    return `<article class="product-card">
      <div class="cover">${["📘","🧰","🎓"][i%3]}</div>
      <div class="card-body">
        <span class="free-badge">مجاني بالنظام الإعلاني</span>
        <h3>${esc(p.name)}</h3>
        <p>${esc(p.short_description||"")}</p>
        <div class="reward-cost">🎬 ${required} إعلانات مكافأة</div>
        <div class="card-foot">
          <b class="free-price">بدون دفع نقدي</b>
          <a class="btn primary small" href="product.html?slug=${encodeURIComponent(p.slug)}">فتح المادة</a>
        </div>
      </div>
    </article>`;
  }).join("");

  function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
  function loadScript(src){return new Promise((resolve,reject)=>{if(document.querySelector(`script[src="${src}"]`))return resolve();const s=document.createElement("script");s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)})}
})();
