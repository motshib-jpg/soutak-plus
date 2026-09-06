(async()=>{
  if(document.body.dataset.page!=="products") return;
  const db=window.SoutakDB;
  const rewardPolicy={"creator-starter-guide":5,"content-templates":5,"first-audience":10};
  let list=[];
  let loadError=false;
  if(db?.enabled){
    const {data,error}=await db.client.from("soutak_products").select("id,slug,name,short_description,description,type,reward_ads_required,status").eq("status","published").order("created_at",{ascending:true});
    if(!error&&data?.length) list=data; else if(error){console.error(error);loadError=true}
  } else loadError=true;
  list=list.filter(p=>Object.prototype.hasOwnProperty.call(rewardPolicy,p.slug));
  const banner=document.getElementById("modeBanner");
  if(banner){banner.className="mode-banner";banner.textContent="المواد تفتح فقط بإعلانات المكافأة المكتملة: 5 + 5 + 10. لا اشتراكات مدفوعة ولا دفع نقدي."}
  const grid=document.getElementById("productsGrid");
  if(!grid)return;
  if(!list.length){
    if(loadError) return;
    grid.innerHTML="<div class='info-box'><h2>لا توجد مواد منشورة حاليًا</h2><p>يمكنك العودة إلى قسم المحتوى المفتوح.</p></div>";
    return;
  }
  grid.innerHTML=list.map((p,i)=>{
    const required=rewardPolicy[p.slug];
    return `<article class="product-card"><div class="cover">${["📘","🧰","🎓"][i%3]}</div><div class="card-body"><span class="free-badge">مادة رقمية</span><h3>${esc(p.name)}</h3><p>${esc(p.description||p.short_description||"")}</p><div class="reward-cost">🎬 ${required} إعلانات مكافأة اختيارية</div><div class="card-foot"><b class="free-price">0$</b><a class="btn primary small" href="product.html?slug=${encodeURIComponent(p.slug)}">عرض التفاصيل</a></div></div></article>`;
  }).join("");
  grid.removeAttribute("data-fallback");
  function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
})();
