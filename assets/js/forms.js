(()=>{
 const msg=(id,text,ok)=>{const el=document.getElementById(id);if(el){el.className="form-status "+(ok?"ok":"err");el.textContent=text}};
 const busy=(form,on)=>{const b=form?.querySelector('button[type="submit"]');if(b){b.disabled=on;b.dataset.label=b.dataset.label||b.textContent;b.textContent=on?"جارٍ الإرسال...":b.dataset.label}};

 document.querySelectorAll('form[id$="Form"]').forEach(form=>{
   if(form.querySelector('[name="website"]'))return;
   const trap=document.createElement('input');
   trap.type='text';trap.name='website';trap.tabIndex=-1;trap.autocomplete='off';trap.setAttribute('aria-hidden','true');
   trap.style.position='absolute';trap.style.left='-10000px';trap.style.width='1px';trap.style.height='1px';trap.style.opacity='0';
   form.appendChild(trap);
 });

 document.getElementById("newsletterForm")?.addEventListener("submit",async e=>{
   e.preventDefault(); const form=e.target; const f=new FormData(form); const email=String(f.get("email")||document.getElementById("newsletterEmail")?.value||"").trim();
   busy(form,true);
   try{
     await send("newsletter",{email,website:f.get("website")||""});
     msg("newsletterStatus","تم الاشتراك بنجاح.",true);form.reset();
   }catch(err){msg("newsletterStatus",friendly(err),false)}
   finally{busy(form,false)}
 });

 bind("sponsorForm","sponsorStatus","sponsor",f=>({company:f.get("company"),name:f.get("name"),email:f.get("email"),budget:f.get("budget")||null,type:f.get("type"),message:f.get("message"),website:f.get("website")||""}));
 bind("serviceForm","serviceStatus","service",f=>({name:f.get("name"),email:f.get("email"),service:f.get("service"),budget:f.get("budget")||null,message:f.get("message"),website:f.get("website")||""}));
 bind("contactForm","contactStatus","contact",f=>({name:f.get("name"),email:f.get("email"),subject:f.get("subject"),message:f.get("message"),website:f.get("website")||""}));

 function bind(formId,statusId,action,map){document.getElementById(formId)?.addEventListener("submit",async e=>{
   e.preventDefault(); const form=e.target;busy(form,true);
   try{await send(action,map(new FormData(form)));msg(statusId,"تم الإرسال بنجاح. سنراجع طلبك قريبًا.",true);form.reset()}
   catch(err){msg(statusId,friendly(err),false)}finally{busy(form,false)}
 })}

 async function send(action,payload){
   await window.SOUTAK_RUNTIME_READY?.catch(()=>({}));
   const runtime=window.SOUTAK_RUNTIME_CONFIG||{};const fallback=window.SOUTAK_CONFIG||{};
   const base=(runtime.supabaseUrl||fallback.supabaseUrl||"").replace(/\/$/,"");
   if(!base)throw new Error("service_unavailable");
   const res=await fetch(`${base}/functions/v1/soutak-public-submit`,{
     method:"POST",cache:"no-store",credentials:"omit",referrerPolicy:"no-referrer",
     headers:{"Content-Type":"application/json","X-Client-Info":"soutak-web/1"},
     body:JSON.stringify({action,...payload})
   });
   const data=await res.json().catch(()=>({}));
   if(!res.ok)throw new Error(data.error||"service_unavailable");
   return data;
 }
 function friendly(err){
   if(err?.message==="too_many_requests")return "تم استلام محاولات كثيرة خلال فترة قصيرة. حاول بعد عدة دقائق.";
   if(err?.message==="invalid_input")return "تحقق من البيانات المدخلة ثم حاول مرة أخرى.";
   return "تعذر الإرسال الآن. حاول لاحقًا.";
 }
})();
