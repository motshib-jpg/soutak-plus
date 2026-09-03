(async()=>{
 const db=window.SoutakDB;
 const page=document.body.dataset.page;
 if(page==="login"){
  const status=document.getElementById("loginStatus");
  document.getElementById("loginForm")?.addEventListener("submit",async e=>{
    e.preventDefault();
    if(!db?.enabled){status.className="form-status err";status.textContent="تعذر الاتصال بخدمة تسجيل الدخول.";return}
    const {error}=await db.client.auth.signInWithPassword({email:document.getElementById("loginEmail").value.trim(),password:document.getElementById("loginPassword").value});
    if(error){status.className="form-status err";status.textContent="بيانات الدخول غير صحيحة أو الحساب غير مفعّل.";return}
    const {data,error:roleError}=await db.client.rpc("soutak_is_admin");
    if(roleError||!data){await db.client.auth.signOut();status.className="form-status err";status.textContent="الحساب لا يملك صلاحية إدارة صوتك+.";return}
    location.href="admin.html";
  });
  return;
 }
 if(page!=="admin")return;
 const guard=document.getElementById("adminGuard");
 if(!db?.enabled){guard.textContent="تعذر الاتصال بخدمة الإدارة.";guard.className="mode-banner";return}
 const {data:{session}}=await db.client.auth.getSession();
 if(!session){location.href="login.html";return}
 const {data:isAdmin,error:adminError}=await db.client.rpc("soutak_is_admin");
 if(adminError||!isAdmin){await db.client.auth.signOut();location.href="login.html";return}
 guard.remove();
 document.querySelectorAll("[data-admin-tab]").forEach(b=>b.onclick=()=>{document.querySelectorAll("[data-admin-tab]").forEach(x=>x.classList.remove("active"));b.classList.add("active");document.querySelectorAll(".admin-tab").forEach(x=>x.classList.remove("active"));document.getElementById("tab-"+b.dataset.adminTab).classList.add("active")});
 document.getElementById("logoutBtn").onclick=async()=>{await db.client.auth.signOut();location.href="login.html"};
 await refresh();
 document.getElementById("adminPostForm")?.addEventListener("submit",async e=>{
   e.preventDefault();const f=new FormData(e.target);const payload={title:f.get("title"),slug:f.get("slug"),excerpt:f.get("excerpt"),body:f.get("body"),status:"published",published_at:new Date().toISOString()};
   const {error}=await db.client.from("soutak_posts").insert(payload);
   if(!error){e.target.reset();await refresh()}else alert("تعذر الحفظ: "+error.message);
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
  for(const [table,label] of [["soutak_sponsor_requests","تعاون"],["soutak_service_requests","خدمة"],["soutak_contact_messages","تواصل"]]){const {data}=await db.client.from(table).select("*").order("created_at",{ascending:false}).limit(10);(data||[]).forEach(x=>reqs.push({label,...x}))}
  reqs.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  document.getElementById("adminRequests").innerHTML=reqs.slice(0,30).map(x=>`<div class="admin-item"><b>${esc(x.label)}</b> — ${esc(x.company||x.name||x.email||"")}<br><small>${esc(x.email||"")} • ${esc((x.created_at||"").slice(0,16).replace("T"," "))}</small>${x.message?`<p>${esc(x.message)}</p>`:""}</div>`).join("")||"<p>لا توجد طلبات حاليًا.</p>";
 }
 function esc(s){return String(s??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]))}
})();
