(async()=>{
  const db=window.SoutakDB;
  let list=[];
  let loadError=false;
  if(db?.enabled){
    const {data,error}=await db.client.from("soutak_services").select("id,name,description,price_text").eq("is_active",true).order("sort_order");
    if(!error) list=data||[]; else {console.error(error);loadError=true}
  } else loadError=true;
  const grid=document.getElementById("servicesGrid");
  if(!grid) return;
  if(!list.length){if(loadError)return;grid.innerHTML="<div class='info-box'><h2>لا توجد خدمات منشورة حاليًا</h2><p>يمكنك التواصل إذا كان لديك سؤال عام.</p></div>";return}
  grid.innerHTML=list.map(x=>`<article class="service-card"><div class="card-body"><span class="tag">خدمة</span><h3>${esc(x.name)}</h3><p>${esc(x.description)}</p><div class="card-foot"><b>${esc(x.price_text||"حسب النطاق")}</b><a class="btn ghost small" href="#serviceForm" data-service="${esc(x.name)}">اطلبها</a></div></div></article>`).join("");
  grid.removeAttribute("data-fallback");
  grid.querySelectorAll("[data-service]").forEach(a=>a.addEventListener("click",()=>{const select=document.querySelector('#serviceForm [name="service"]');if(select){const value=a.getAttribute("data-service");if([...select.options].some(o=>o.value===value||o.text===value))select.value=value}}));
  function esc(s){return String(s??"").replace(/[&<>\"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;"}[m]))}
})();
