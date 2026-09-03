(async()=>{
 const script=document.createElement("script");script.src="assets/js/demo-data.js";await new Promise(r=>{script.onload=r;document.head.appendChild(script)});
 let list=window.SOUTAK_DEMO.services;
 if(window.SoutakDB?.enabled){const {data,error}=await window.SoutakDB.client.from("services").select("id,name,description,price_text").eq("is_active",true).order("sort_order");if(!error)list=data||[]}
 document.getElementById("servicesGrid").innerHTML=list.map(x=>`<article class="service-card"><div class="card-body"><span class="tag">خدمة</span><h3>${esc(x.name)}</h3><p>${esc(x.description)}</p><div class="card-foot"><b>${esc(x.price_text||"حسب النطاق")}</b><a class="btn ghost small" href="#serviceForm">اطلبها</a></div></div></article>`).join("");
 function esc(s){return String(s??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]))}
})();
