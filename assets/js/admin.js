(async()=>{
 const cfg=window.SOUTAK_CONFIG||{};
 const page=document.body.dataset.page;
 const status=document.getElementById("loginStatus");
 const SUPABASE_URL=String(cfg.supabaseUrl||"").replace(/\/$/,"");
 const API_KEY=String(cfg.supabasePublishableKey||"");
 const AUTH=SUPABASE_URL+"/auth/v1";
 const REST=SUPABASE_URL+"/rest/v1";
 const STORE="soutak-admin-session-v3";

 const setStatus=(text,ok=false)=>{
   if(!status)return;
   status.className="form-status "+(ok?"ok":"err");
   status.textContent=text;
 };
 const clearStatus=()=>{if(status){status.className="form-status";status.textContent=""}};

 function decodeJwt(token){
   try{
     const p=token.split(".")[1];
     const b=p.replace(/-/g,"+").replace(/_/g,"/")+"===".slice((p.length+3)%4);
     return JSON.parse(decodeURIComponent(Array.from(atob(b)).map(c=>"%"+c.charCodeAt(0).toString(16).padStart(2,"0")).join("")));
   }catch{return {}}
 }
 function normalizeSession(raw){
   const s=raw?.session||raw||{};
   if(!s.access_token)return null;
   const claims=decodeJwt(s.access_token);
   return {
     access_token:s.access_token,
     refresh_token:s.refresh_token||"",
     expires_at:s.expires_at||Math.floor(Date.now()/1000)+(Number(s.expires_in)||3600),
     user:s.user||raw?.user||{id:claims.sub||""}
   };
 }
 function saveSession(raw){
   const s=normalizeSession(raw);
   if(!s)return null;
   sessionStorage.setItem(STORE,JSON.stringify(s));
   return s;
 }
 function getSession(){
   try{
     const s=JSON.parse(sessionStorage.getItem(STORE)||"null");
     if(!s?.access_token)return null;
     if(s.expires_at&&Date.now()/1000>=Number(s.expires_at)-30){sessionStorage.removeItem(STORE);return null}
     return s;
   }catch{return null}
 }
 function clearSession(){sessionStorage.removeItem(STORE)}
 function aalOf(s){return decodeJwt(s?.access_token||"").aal||"aal1"}

 async function fetchJson(url,opts={}){
   const res=await fetch(url,{cache:"no-store",...opts});
   const text=await res.text();
   let data=null;try{data=text?JSON.parse(text):null}catch{data=text}
   if(!res.ok){const err=new Error("request_failed");err.status=res.status;err.data=data;throw err}
   return {data,res};
 }
 function authHeaders(token){
   const h={"apikey":API_KEY,"Content-Type":"application/json"};
   if(token)h.Authorization="Bearer "+token;
   return h;
 }
 async function signIn(email,password){
   const {data}=await fetchJson(AUTH+"/token?grant_type=password",{method:"POST",headers:authHeaders(),body:JSON.stringify({email,password})});
   return saveSession(data);
 }
 async function getUser(s){
   const {data}=await fetchJson(AUTH+"/user",{headers:authHeaders(s.access_token)});
   if(data?.id){s.user=data;sessionStorage.setItem(STORE,JSON.stringify(s))}
   return data||{};
 }
 async function restGet(path,s,extraHeaders={}){
   const {data,res}=await fetchJson(REST+"/"+path,{headers:{...authHeaders(s.access_token),...extraHeaders}});
   return {data,res};
 }
 async function restWrite(path,s,method,body,extraHeaders={}){
   return await fetchJson(REST+"/"+path,{method,headers:{...authHeaders(s.access_token),Prefer:"return=minimal",...extraHeaders},body:body===undefined?undefined:JSON.stringify(body)});
 }
 async function isAdminIdentity(s){
   const uid=s?.user?.id||decodeJwt(s?.access_token||"").sub;
   if(!uid)return false;
   try{
     const q="soutak_admin_profiles?select=user_id&user_id=eq."+encodeURIComponent(uid)+"&is_active=eq.true&limit=1";
     const {data}=await restGet(q,s);
     return Array.isArray(data)&&data.length===1;
   }catch{return false}
 }
 async function confirmAdminAtAal2(s){
   if(aalOf(s)!=="aal2")return false;
   try{
     const {data}=await fetchJson(REST+"/rpc/soutak_is_admin",{method:"POST",headers:authHeaders(s.access_token),body:"{}"});
     return data===true;
   }catch{return false}
 }
 async function factorsFor(s){
   const user=await getUser(s);
   return Array.isArray(user?.factors)?user.factors:[];
 }
 async function unenrollFactor(s,id){
   await fetchJson(AUTH+"/factors/"+encodeURIComponent(id),{method:"DELETE",headers:authHeaders(s.access_token)});
 }
 async function enrollTotp(s){
   const {data}=await fetchJson(AUTH+"/factors",{method:"POST",headers:authHeaders(s.access_token),body:JSON.stringify({factor_type:"totp",friendly_name:"Soutak+ Admin"})});
   return data;
 }
 async function challengeFactor(s,factorId){
   const {data}=await fetchJson(AUTH+"/factors/"+encodeURIComponent(factorId)+"/challenge",{method:"POST",headers:authHeaders(s.access_token),body:JSON.stringify({factorId})});
   return data;
 }
 async function verifyFactor(s,factorId,challengeId,code){
   const {data}=await fetchJson(AUTH+"/factors/"+encodeURIComponent(factorId)+"/verify",{method:"POST",headers:authHeaders(s.access_token),body:JSON.stringify({challenge_id:challengeId,code})});
   return saveSession(data)||s;
 }
 async function signOut(){
   const s=getSession();clearSession();
   if(s?.access_token){try{await fetch(AUTH+"/logout?scope=local",{method:"POST",headers:authHeaders(s.access_token),cache:"no-store"})}catch{}}
 }

 async function verifyTotp(factorId,code){
   if(!/^\d{6}$/.test(code))throw new Error("invalid_code");
   let s=getSession();if(!s)throw new Error("no_session");
   const challenge=await challengeFactor(s,factorId);
   if(!challenge?.id)throw new Error("challenge_failed");
   s=await verifyFactor(s,factorId,challenge.id,code);
   if(!(await confirmAdminAtAal2(s)))throw new Error("admin_aal2_required");
 }

 function createMfaPanel(title,description){
   document.getElementById("loginForm")?.setAttribute("hidden","");
   let panel=document.getElementById("adminMfaPanel");if(panel)panel.remove();
   panel=document.createElement("section");panel.id="adminMfaPanel";panel.className="mfa-panel";
   const h=document.createElement("h2");h.textContent=title;
   const p=document.createElement("p");p.className="muted";p.textContent=description;
   panel.append(h,p);document.querySelector(".auth-card")?.insertBefore(panel,status||null);return panel;
 }
 function qrImageSource(rawValue){
   const raw=String(rawValue||"").trim();
   if(!raw)return null;
   if(/^data:image\//i.test(raw)||/^blob:/i.test(raw))return {src:raw,revoke:null};
   // Detect SVG before URL parsing: `new URL("<svg …>", base)` treats raw XML
   // as a relative path, which produces a blank image instead of the QR code.
   if(/<svg[\s>]/i.test(raw)){
     const src=URL.createObjectURL(new Blob([raw],{type:"image/svg+xml"}));
     return {src,revoke:()=>URL.revokeObjectURL(src)};
   }
   try{
     const url=new URL(raw,SUPABASE_URL||location.origin);
     if(/^https:$/.test(url.protocol)&&url.origin===new URL(SUPABASE_URL).origin)return {src:url.href,revoke:null};
   }catch{}
   return null;
 }
 function addManualTotpFallback(panel,totp,open=false){
   const secret=String(totp?.secret||"").trim();
   const uri=String(totp?.uri||"").trim();
   if(!secret&&!uri)return null;
   const details=document.createElement("details");details.className="mfa-manual";details.open=open;
   const summary=document.createElement("summary");summary.textContent="لا يمكنك مسح الرمز؟ أضف المفتاح يدويًا";
   const note=document.createElement("p");note.textContent="أدخل هذه البيانات في تطبيق المصادقة فقط. لا تشاركها مع أي شخص.";
   details.append(summary,note);
   const addValue=(label,value)=>{if(!value)return;const row=document.createElement("div");row.className="mfa-manual-value";const strong=document.createElement("strong");strong.textContent=label;const code=document.createElement("code");code.dir="ltr";code.textContent=value;row.append(strong,code);details.append(row)};
   addValue("المفتاح السري",secret);addValue("رابط otpauth",uri);
   panel.append(details);return details;
 }
 async function renderMfaChallenge(factorId){
   const panel=createMfaPanel("التحقق بخطوتين","أدخل الرمز المكوّن من 6 أرقام من تطبيق المصادقة.");
   const form=document.createElement("form");form.className="form-grid";form.autocomplete="off";
   const input=document.createElement("input");input.inputMode="numeric";input.autocomplete="one-time-code";input.placeholder="رمز المصادقة";input.maxLength=6;input.pattern="[0-9]{6}";input.required=true;
   const btn=document.createElement("button");btn.type="submit";btn.className="btn primary";btn.textContent="تحقق وافتح الإدارة";
   form.append(input,btn);panel.append(form);input.focus();
   form.addEventListener("submit",async e=>{e.preventDefault();btn.disabled=true;try{await verifyTotp(factorId,input.value.trim());setStatus("تم التحقق بنجاح.",true);location.replace("admin.html")}catch{setStatus("رمز التحقق غير صحيح أو انتهت صلاحيته.");input.select()}finally{btn.disabled=false}});
 }
 async function renderMfaEnrollment(){
   let s=getSession();if(!s)throw new Error("no_session");
   const factors=await factorsFor(s);
   for(const f of factors.filter(x=>x.factor_type==="totp"&&x.status!=="verified")){try{await unenrollFactor(s,f.id)}catch{}}
   const data=await enrollTotp(s);
   if(!data?.id||!data?.totp)throw new Error("enroll_failed");
   const panel=createMfaPanel("فعّل التحقق بخطوتين","امسح رمز QR بتطبيق Google Authenticator أو Microsoft Authenticator، ثم أدخل الرمز الظاهر.");
   const warning=document.createElement("p");warning.className="policy-note";warning.textContent="لا تشارك رمز QR مع أي شخص.";
   const source=qrImageSource(data.totp.qr_code);
   let qr=null,manual=null;
   const showManual=()=>{if(qr?.parentElement)qr.remove();source?.revoke?.();if(!manual)manual=addManualTotpFallback(panel,data.totp,true);if(manual)manual.open=true;warning.textContent="تعذر عرض رمز QR. أضف المفتاح يدويًا في تطبيق المصادقة.";};
   if(source){
     qr=document.createElement("img");qr.className="mfa-qr";qr.alt="رمز QR لإعداد المصادقة الثنائية";qr.decoding="async";qr.src=source.src;
     qr.addEventListener("error",showManual,{once:true});
     addEventListener("pagehide",()=>source.revoke?.(),{once:true});
   }
   if(!qr&&!String(data.totp.secret||"").trim()&&!String(data.totp.uri||"").trim())throw new Error("enroll_qr_unavailable");
   const form=document.createElement("form");form.className="form-grid";form.autocomplete="off";
   const input=document.createElement("input");input.inputMode="numeric";input.autocomplete="one-time-code";input.placeholder="الرمز المكوّن من 6 أرقام";input.maxLength=6;input.pattern="[0-9]{6}";input.required=true;
   const btn=document.createElement("button");btn.type="submit";btn.className="btn primary";btn.textContent="تفعيل وحماية الحساب";
   form.append(input,btn);if(qr)panel.append(qr);panel.append(warning);if(!qr)manual=addManualTotpFallback(panel,data.totp,true);else manual=addManualTotpFallback(panel,data.totp,false);panel.append(form);
   form.addEventListener("submit",async e=>{e.preventDefault();btn.disabled=true;try{await verifyTotp(data.id,input.value.trim());setStatus("تم تفعيل التحقق بخطوتين بنجاح.",true);location.replace("admin.html")}catch{setStatus("تعذر التفعيل. تحقق من الرمز وحاول مرة أخرى.");input.select()}finally{btn.disabled=false}});
 }
 async function continueAdminLogin(s){
   if(!(await isAdminIdentity(s))){await signOut();setStatus("تعذر تسجيل الدخول.");return}
   try{
     if(aalOf(s)==="aal2"&&await confirmAdminAtAal2(s)){location.replace("admin.html");return}
     const factors=await factorsFor(s);
     const verified=factors.find(f=>f.factor_type==="totp"&&f.status==="verified");
     if(verified)await renderMfaChallenge(verified.id);else await renderMfaEnrollment();
   }catch{setStatus("تعذر بدء التحقق بخطوتين. أعد المحاولة.")}
 }

 if(page==="login"){
   clearStatus();
   if(!SUPABASE_URL||!API_KEY){setStatus("إعداد الاتصال غير مكتمل.");return}
   const existing=getSession();if(existing){await continueAdminLogin(existing);return}
   document.getElementById("loginForm")?.addEventListener("submit",async e=>{
     e.preventDefault();clearStatus();const btn=e.target.querySelector('button[type="submit"]');btn.disabled=true;
     try{
       const s=await signIn(document.getElementById("loginEmail").value.trim(),document.getElementById("loginPassword").value);
       if(!s){setStatus("تعذر تسجيل الدخول.");return}
       await continueAdminLogin(s);
     }catch(err){setStatus(err?.status===400||err?.status===401?"البريد أو كلمة المرور غير صحيحة.":"تعذر الاتصال بخدمة تسجيل الدخول.")}
     finally{btn.disabled=false}
   });
   return;
 }

 if(page!=="admin")return;
 const guard=document.getElementById("adminGuard");
 if(!SUPABASE_URL||!API_KEY){guard.textContent="إعداد الاتصال غير مكتمل.";return}
 const session=getSession();
 if(!session||!(await isAdminIdentity(session))||!(await confirmAdminAtAal2(session))){await signOut();location.replace("login.html");return}
 guard.remove();

 let idleTimer;const resetIdle=()=>{clearTimeout(idleTimer);idleTimer=setTimeout(async()=>{await signOut();location.replace("login.html")},30*60*1000)};
 ["pointerdown","keydown","touchstart","scroll"].forEach(ev=>addEventListener(ev,resetIdle,{passive:true}));resetIdle();
 document.querySelectorAll("[data-admin-tab]").forEach(b=>b.onclick=()=>{document.querySelectorAll("[data-admin-tab]").forEach(x=>x.classList.remove("active"));b.classList.add("active");document.querySelectorAll(".admin-tab").forEach(x=>x.classList.remove("active"));document.getElementById("tab-"+b.dataset.adminTab).classList.add("active")});
 document.getElementById("logoutBtn").onclick=async()=>{await signOut();location.replace("login.html")};

 async function select(table,query=""){
   return (await restGet(table+(query?"?"+query:""),session)).data||[];
 }
 async function count(table){
   try{
     const {res}=await restGet(table+"?select=id&limit=1",session,{Prefer:"count=exact",Range:"0-0"});
     const cr=res.headers.get("content-range")||"";const m=cr.match(/\/(\d+)$/);return m?Number(m[1]):0;
   }catch{return 0}
 }
 async function refresh(){
   const [productsCount,postsCount,subsCount,sponsorCount]=await Promise.all([count("soutak_products"),count("soutak_posts"),count("soutak_subscribers"),count("soutak_sponsor_requests")]);
   document.getElementById("adminKpis").innerHTML=[["المواد",productsCount],["المحتوى",postsCount],["المشتركون",subsCount],["طلبات التعاون",sponsorCount]].map(x=>`<div class="kpi"><span>${x[0]}</span><b>${x[1]}</b></div>`).join("");
   const products=await select("soutak_products","select=id,name,slug,reward_ads_required,status&order=created_at.asc");
   document.getElementById("adminProductsList").innerHTML=products.map(x=>`<div class="admin-item"><b>${esc(x.name)}</b> — ${esc(x.reward_ads_required)} إعلانات — ${esc(x.status)}</div>`).join("");
   const posts=await select("soutak_posts","select=id,title,status,published_at&order=created_at.desc&limit=20");
   document.getElementById("adminPostsList").innerHTML=posts.map(x=>`<div class="admin-item"><b>${esc(x.title)}</b> — ${esc(x.status)}</div>`).join("");
   const reqs=[];
   for(const [table,label] of [["soutak_sponsor_requests","تعاون"],["soutak_service_requests","خدمة"],["soutak_contact_messages","تواصل"]]){
     try{(await select(table,"select=*&order=created_at.desc&limit=10")).forEach(x=>reqs.push({label,...x}))}catch{}
   }
   reqs.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
   document.getElementById("adminRequests").innerHTML=reqs.slice(0,30).map(x=>`<div class="admin-item"><b>${esc(x.label)}</b> — ${esc(x.company||x.name||x.email||"")}<br><small>${esc(x.email||"")} • ${esc((x.created_at||"").slice(0,16).replace("T"," "))}</small>${x.message?`<p>${esc(x.message)}</p>`:""}</div>`).join("")||"<p>لا توجد طلبات حاليًا.</p>";
 }
 document.getElementById("adminPostForm")?.addEventListener("submit",async e=>{
   e.preventDefault();const f=new FormData(e.target);const title=String(f.get("title")||"").trim().slice(0,180);const slug=String(f.get("slug")||"").trim();const excerpt=String(f.get("excerpt")||"").trim().slice(0,500);const body=String(f.get("body")||"").trim().slice(0,30000);
   if(!/^[a-z0-9-]{3,100}$/.test(slug)||title.length<3||excerpt.length<10||body.length<50){alert("تحقق من العنوان والرابط والملخص والمحتوى.");return}
   try{await restWrite("soutak_posts",session,"POST",{title,slug,excerpt,body,status:"published",published_at:new Date().toISOString()});e.target.reset();await refresh()}catch{alert("تعذر الحفظ.")}
 });
 function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
 await refresh();
})();

