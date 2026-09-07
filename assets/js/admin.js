(async()=>{
 const db=window.SoutakDB;
 const page=document.body.dataset.page;
 const status=document.getElementById("loginStatus");

 const setStatus=(text,ok=false)=>{
   if(!status)return;
   status.className="form-status "+(ok?"ok":"err");
   status.textContent=text;
 };

 // This self-only lookup is intentionally usable at AAL1 so a legitimate admin can enroll MFA.
 // All privileged data and writes remain protected by soutak_is_admin(), which requires AAL2.
 const isAdminIdentity=async(session)=>{
   if(!session?.user?.id)return false;
   const {data,error}=await db.client
     .from("soutak_admin_profiles")
     .select("user_id,is_active")
     .eq("user_id",session.user.id)
     .eq("is_active",true)
     .maybeSingle();
   return !error&&Boolean(data?.user_id);
 };

 const currentAal=async()=>{
   const {data,error}=await db.client.auth.mfa.getAuthenticatorAssuranceLevel();
   if(error)throw error;
   return data;
 };

 const confirmAdminAtAal2=async()=>{
   const aal=await currentAal();
   if(aal?.currentLevel!=="aal2")return false;
   const {data,error}=await db.client.rpc("soutak_is_admin");
   return !error&&data===true;
 };

 async function verifyTotp(factorId,code){
   if(!/^\d{6}$/.test(code))throw new Error("invalid_code");
   const {data:challenge,error:challengeError}=await db.client.auth.mfa.challenge({factorId});
   if(challengeError||!challenge?.id)throw new Error("challenge_failed");
   const {error:verifyError}=await db.client.auth.mfa.verify({factorId,challengeId:challenge.id,code});
   if(verifyError)throw new Error("verify_failed");
   await db.client.auth.refreshSession();
   if(!(await confirmAdminAtAal2()))throw new Error("admin_aal2_required");
 }

 function createMfaPanel(title,description){
   document.getElementById("loginForm")?.setAttribute("hidden","");
   let panel=document.getElementById("adminMfaPanel");
   if(panel)panel.remove();
   panel=document.createElement("section");
   panel.id="adminMfaPanel";
   panel.className="mfa-panel";
   const h=document.createElement("h2");h.textContent=title;
   const p=document.createElement("p");p.className="muted";p.textContent=description;
   panel.append(h,p);
   document.querySelector(".auth-card")?.insertBefore(panel,status||null);
   return panel;
 }

 async function renderMfaChallenge(factorId){
   const panel=createMfaPanel("التحقق بخطوتين","أدخل الرمز المكوّن من 6 أرقام من تطبيق المصادقة. لا يمكن فتح لوحة الإدارة بكلمة المرور وحدها.");
   const form=document.createElement("form");form.className="form-grid";form.autocomplete="off";
   const input=document.createElement("input");input.inputMode="numeric";input.autocomplete="one-time-code";input.placeholder="رمز المصادقة";input.maxLength=6;input.pattern="[0-9]{6}";input.required=true;
   const btn=document.createElement("button");btn.type="submit";btn.className="btn primary";btn.textContent="تحقق وافتح الإدارة";
   form.append(input,btn);panel.append(form);input.focus();
   form.addEventListener("submit",async e=>{
     e.preventDefault();btn.disabled=true;
     try{await verifyTotp(factorId,input.value.trim());setStatus("تم التحقق بنجاح.",true);location.replace("admin.html")}
     catch{setStatus("رمز التحقق غير صحيح أو انتهت صلاحيته.");input.select()}
     finally{btn.disabled=false}
   });
 }

 async function renderMfaEnrollment(){
   const {data:list}=await db.client.auth.mfa.listFactors();
   for(const f of (list?.totp||[]).filter(x=>x.status!=="verified")){
     try{await db.client.auth.mfa.unenroll({factorId:f.id})}catch(_){}
   }
   const {data,error}=await db.client.auth.mfa.enroll({factorType:"totp",friendlyName:"Soutak+ Admin"});
   if(error||!data?.id||!data?.totp?.qr_code)throw new Error("enroll_failed");
   const panel=createMfaPanel("فعّل التحقق بخطوتين","هذه الخطوة مطلوبة مرة واحدة لحماية لوحة الإدارة. امسح رمز QR بتطبيق مصادقة مثل Google Authenticator أو Microsoft Authenticator، ثم أدخل الرمز الظاهر في التطبيق.");
   const qr=document.createElement("img");qr.className="mfa-qr";qr.alt="رمز QR لإعداد المصادقة الثنائية";qr.src=data.totp.qr_code;
   const warning=document.createElement("p");warning.className="policy-note";warning.textContent="لا تشارك رمز QR مع أي شخص. بعد تفعيله لن تسمح قاعدة البيانات بعمليات الإدارة إلا بجلسة تحقق ثنائي AAL2.";
   const form=document.createElement("form");form.className="form-grid";form.autocomplete="off";
   const input=document.createElement("input");input.inputMode="numeric";input.autocomplete="one-time-code";input.placeholder="الرمز المكوّن من 6 أرقام";input.maxLength=6;input.pattern="[0-9]{6}";input.required=true;
   const btn=document.createElement("button");btn.type="submit";btn.className="btn primary";btn.textContent="تفعيل وحماية الحساب";
   form.append(input,btn);panel.append(qr,warning,form);
   form.addEventListener("submit",async e=>{
     e.preventDefault();btn.disabled=true;
     try{await verifyTotp(data.id,input.value.trim());setStatus("تم تفعيل التحقق بخطوتين بنجاح.",true);location.replace("admin.html")}
     catch{setStatus("تعذر التفعيل. تحقق من الرمز وحاول مرة أخرى.");input.select()}
     finally{btn.disabled=false}
   });
 }

 async function continueAdminLogin(session){
   if(!(await isAdminIdentity(session))){await db.client.auth.signOut();setStatus("تعذر تسجيل الدخول.");return}
   try{
     const aal=await currentAal();
     if(aal?.currentLevel==="aal2"){
       if(await confirmAdminAtAal2()){location.replace("admin.html");return}
       await db.client.auth.signOut();setStatus("تعذر تسجيل الدخول.");return;
     }
     const {data:factors,error}=await db.client.auth.mfa.listFactors();
     if(error)throw error;
     const verified=(factors?.totp||[]).find(f=>f.status==="verified");
     if(verified){await renderMfaChallenge(verified.id)}else{await renderMfaEnrollment()}
   }catch{
     setStatus("تعذر بدء التحقق بخطوتين. أعد تحميل الصفحة وحاول مرة أخرى.");
   }
 }

 if(page==="login"){
   status?.setAttribute("role","status");status?.setAttribute("aria-live","polite");
   if(!db?.enabled){setStatus("تعذر الاتصال بخدمة تسجيل الدخول.");return}

   const {data:{session:existing}}=await db.client.auth.getSession();
   if(existing){await continueAdminLogin(existing);return}

   document.getElementById("loginForm")?.addEventListener("submit",async e=>{
     e.preventDefault();
     const form=e.target;const button=form.querySelector('button[type="submit"]');button.disabled=true;
     try{
       const {data,error}=await db.client.auth.signInWithPassword({
         email:document.getElementById("loginEmail").value.trim(),
         password:document.getElementById("loginPassword").value
       });
       if(error||!data?.session){setStatus("تعذر تسجيل الدخول.");return}
       await continueAdminLogin(data.session);
     }finally{button.disabled=false}
   });
   return;
 }

 if(page!=="admin")return;
 const guard=document.getElementById("adminGuard");
 if(!db?.enabled){guard.textContent="تعذر الاتصال بخدمة الإدارة.";guard.className="mode-banner";return}
 const {data:{session}}=await db.client.auth.getSession();
 if(!session){location.replace("login.html");return}
 if(!(await isAdminIdentity(session))){await db.client.auth.signOut();location.replace("login.html");return}
 try{
   if(!(await confirmAdminAtAal2())){await db.client.auth.signOut();location.replace("login.html");return}
 }catch{await db.client.auth.signOut();location.replace("login.html");return}
 guard.remove();

 let idleTimer;
 const resetIdle=()=>{clearTimeout(idleTimer);idleTimer=setTimeout(async()=>{try{await db.client.auth.signOut()}finally{location.replace("login.html")}},30*60*1000)};
 ["pointerdown","keydown","touchstart","scroll"].forEach(ev=>addEventListener(ev,resetIdle,{passive:true}));
 resetIdle();

 document.querySelectorAll("[data-admin-tab]").forEach(b=>b.onclick=()=>{
   document.querySelectorAll("[data-admin-tab]").forEach(x=>x.classList.remove("active"));b.classList.add("active");
   document.querySelectorAll(".admin-tab").forEach(x=>x.classList.remove("active"));
   document.getElementById("tab-"+b.dataset.adminTab).classList.add("active")
 });
 document.getElementById("logoutBtn").onclick=async()=>{await db.client.auth.signOut();location.replace("login.html")};
 await refresh();

 document.getElementById("adminPostForm")?.addEventListener("submit",async e=>{
   e.preventDefault();const f=new FormData(e.target);
   const title=String(f.get("title")||"").trim().slice(0,180);
   const slug=String(f.get("slug")||"").trim();
   const excerpt=String(f.get("excerpt")||"").trim().slice(0,500);
   const body=String(f.get("body")||"").trim().slice(0,30000);
   if(!/^[a-z0-9-]{3,100}$/.test(slug)||title.length<3||excerpt.length<10||body.length<50){alert("تحقق من العنوان والرابط والملخص والمحتوى.");return}
   const payload={title,slug,excerpt,body,status:"published",published_at:new Date().toISOString()};
   const {error}=await db.client.from("soutak_posts").insert(payload);
   if(!error){e.target.reset();await refresh()}else alert("تعذر الحفظ.");
 });

 async function refresh(){
   const tables=["soutak_products","soutak_posts","soutak_subscribers","soutak_sponsor_requests"];const counts={};
   for(const t of tables){const {count}=await db.client.from(t).select("*",{count:"exact",head:true});counts[t]=count||0}
   document.getElementById("adminKpis").innerHTML=[["المواد",counts.soutak_products],["المحتوى",counts.soutak_posts],["المشتركون",counts.soutak_subscribers],["طلبات التعاون",counts.soutak_sponsor_requests]].map(x=>`<div class="kpi"><span>${x[0]}</span><b>${x[1]}</b></div>`).join("");
   const {data:products}=await db.client.from("soutak_products").select("id,name,slug,reward_ads_required,status").order("created_at",{ascending:true});
   document.getElementById("adminProductsList").innerHTML=(products||[]).map(x=>`<div class="admin-item"><b>${esc(x.name)}</b> — ${esc(x.reward_ads_required)} إعلانات — ${esc(x.status)}</div>`).join("");
   const {data:posts}=await db.client.from("soutak_posts").select("id,title,status,published_at").order("created_at",{ascending:false}).limit(20);
   document.getElementById("adminPostsList").innerHTML=(posts||[]).map(x=>`<div class="admin-item"><b>${esc(x.title)}</b> — ${esc(x.status)}</div>`).join("");
   const reqs=[];
   for(const [table,label] of [["soutak_sponsor_requests","تعاون"],["soutak_service_requests","خدمة"],["soutak_contact_messages","تواصل"]]){
     const {data}=await db.client.from(table).select("*").order("created_at",{ascending:false}).limit(10);
     (data||[]).forEach(x=>reqs.push({label,...x}))
   }
   reqs.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
   document.getElementById("adminRequests").innerHTML=reqs.slice(0,30).map(x=>`<div class="admin-item"><b>${esc(x.label)}</b> — ${esc(x.company||x.name||x.email||"")}<br><small>${esc(x.email||"")} • ${esc((x.created_at||"").slice(0,16).replace("T"," "))}</small>${x.message?`<p>${esc(x.message)}</p>`:""}</div>`).join("")||"<p>لا توجد طلبات حاليًا.</p>";
 }
 function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
})();
