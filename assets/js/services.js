(async()=>{
 const db=window.SoutakDB;
 let list=[];
 if(db?.enabled){const {data,error}=await db.client.from("soutak_services").select("id,name,description,price_text").eq("is_active",true).order("sort_order");if(!error)list=data||[];else console.error(error)}
 const grid=document.getElementById("servicesGrid");
 if(grid) grid.innerHTML=list.map(x=>`<article class="service-card"><div class="card-body"><span class="tag">خدمة</span><h3>${esc(x.name)}</h3><p>${esc(x.description)}</p><div class="card-foot"><b>${esc(x.price_text||"حسب النطاق")}</b><a class="btn ghost small" href="#serviceForm">اطلبها</a></div></div></article>`).join("")||"<p>لا توجد خدمات منشورة حاليًا.</p>";
 function esc(s){return String(s??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]))}
})();
