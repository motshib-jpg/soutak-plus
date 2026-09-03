(async()=>{
  if(document.body.dataset.page!=="products") return;
  await loadScript("assets/js/demo-data.js");
  const db=window.SoutakDB;
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

  const banner=document.getElementById("modeBanner");
  banner.className="mode-banner";
  banner.textContent="لا يوجد دفع مالي: كل مادة تُفتح بعد عدد واضح من إعلانات المكافأة المكتملة.";

  document.getElementById("productsGrid").innerHTML=list.map((p,i)=>{
    const required=Math.max(1,Number(p.reward_ads_required||5));
    return `<article class="product-card">
      <div class="cover">${["📘","🧰","🎓","💡"][i%4]}</div>
      <div class="card-body">
        <span class="free-badge">0 ريال</span>
        <h3>${esc(p.name)}</h3>
        <p>${esc(p.short_description||"")}</p>
        <div class="reward-cost">🎬 ${required} إعلانات مكافأة</div>
        <div class="card-foot">
          <b class="free-price">بدون نقود</b>
          <a class="btn primary small" href="product.html?slug=${encodeURIComponent(p.slug)}">فتح المادة</a>
        </div>
      </div>
    </article>`;
  }).join("");

  function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
  function loadScript(src){return new Promise(r=>{const s=document.createElement("script");s.src=src;s.onload=r;document.head.appendChild(s)})}
})();
