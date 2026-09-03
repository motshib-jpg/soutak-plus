(()=>{
 const db=()=>window.SoutakDB;
 const msg=(id,text,ok)=>{const el=document.getElementById(id);if(el){el.className="form-status "+(ok?"ok":"err");el.textContent=text}};
 document.getElementById("newsletterForm")?.addEventListener("submit",async e=>{e.preventDefault();const email=document.getElementById("newsletterEmail").value.trim();if(!db()?.enabled){msg("newsletterStatus","وضع تجريبي: لم يتم حفظ البريد على الإنترنت.",false);return}const {error}=await db().client.rpc("subscribe_public",{p_email:email,p_source:"website"});msg("newsletterStatus",error?"تعذر الاشتراك.":"تم الاشتراك بنجاح.",!error);if(!error)e.target.reset()});
 bind("sponsorForm","sponsorStatus","submit_sponsor_request_public",f=>({p_company:f.get("company"),p_name:f.get("name"),p_email:f.get("email"),p_budget:f.get("budget")||null,p_type:f.get("type"),p_message:f.get("message")}));
 bind("serviceForm","serviceStatus","submit_service_request_public",f=>({p_name:f.get("name"),p_email:f.get("email"),p_service:f.get("service"),p_budget:f.get("budget")||null,p_message:f.get("message")}));
 bind("contactForm","contactStatus","submit_contact_public",f=>({p_name:f.get("name"),p_email:f.get("email"),p_subject:f.get("subject"),p_message:f.get("message")}));
 function bind(formId,statusId,rpc,map){document.getElementById(formId)?.addEventListener("submit",async e=>{e.preventDefault();if(!db()?.enabled){msg(statusId,"وضع تجريبي: لم تُرسل البيانات إلى الإنترنت.",false);return}const {error}=await db().client.rpc(rpc,map(new FormData(e.target)));msg(statusId,error?"تعذر الإرسال. حاول لاحقًا.":"تم الإرسال بنجاح.",!error);if(!error)e.target.reset()})}
})();
