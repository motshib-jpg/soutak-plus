(()=>{
 const db=()=>window.SoutakDB;
 const msg=(id,text,ok)=>{const el=document.getElementById(id);if(el){el.className="form-status "+(ok?"ok":"err");el.textContent=text}};
 const busy=(form,on)=>{const b=form?.querySelector('button[type="submit"]');if(b){b.disabled=on;b.dataset.label=b.dataset.label||b.textContent;b.textContent=on?"جارٍ الإرسال...":b.dataset.label}};
 document.getElementById("newsletterForm")?.addEventListener("submit",async e=>{
   e.preventDefault(); const form=e.target; const email=document.getElementById("newsletterEmail").value.trim();
   if(!db()?.enabled){msg("newsletterStatus","تعذر الاتصال بالخدمة الآن. حاول لاحقًا.",false);return}
   busy(form,true);
   const {error}=await db().client.rpc("soutak_subscribe_public",{p_email:email,p_source:"website"});
   msg("newsletterStatus",error?"تعذر الاشتراك. تحقق من البريد وحاول مرة أخرى.":"تم الاشتراك بنجاح.",!error);
   if(!error)form.reset(); busy(form,false);
 });
 bind("sponsorForm","sponsorStatus","soutak_submit_sponsor_request_public",f=>({p_company:f.get("company"),p_name:f.get("name"),p_email:f.get("email"),p_budget:f.get("budget")||null,p_type:f.get("type"),p_message:f.get("message")}));
 bind("serviceForm","serviceStatus","soutak_submit_service_request_public",f=>({p_name:f.get("name"),p_email:f.get("email"),p_service:f.get("service"),p_budget:f.get("budget")||null,p_message:f.get("message")}));
 bind("contactForm","contactStatus","soutak_submit_contact_public",f=>({p_name:f.get("name"),p_email:f.get("email"),p_subject:f.get("subject"),p_message:f.get("message")}));
 function bind(formId,statusId,rpc,map){document.getElementById(formId)?.addEventListener("submit",async e=>{
   e.preventDefault(); const form=e.target;
   if(!db()?.enabled){msg(statusId,"تعذر الاتصال بالخدمة الآن. حاول لاحقًا.",false);return}
   busy(form,true);
   try{
     const {error}=await db().client.rpc(rpc,map(new FormData(form)));
     msg(statusId,error?"تعذر الإرسال. تحقق من البيانات وحاول لاحقًا.":"تم الإرسال بنجاح. سنراجع طلبك قريبًا.",!error);
     if(!error)form.reset();
   }catch(_){msg(statusId,"تعذر الإرسال بسبب مشكلة اتصال. حاول لاحقًا.",false)}
   finally{busy(form,false)}
 })}
})();
