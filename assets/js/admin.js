(async()=>{
 const db=window.SoutakDB;
 const page=document.body.dataset.page;
 if(page==="login"){
  const status=document.getElementById("loginStatus");
  if(!db?.enabled){status.className="form-status err";status.textContent="يلزم ربط مشروع Supabase مستقل أولًا."}
  document.getElementById("loginForm")?.addEventListener("submit",async e=>{e.preventDefault();if(!db?.enabled)return;const {error}=await db.client.auth.signInWithPassword({email:document.getElementById("loginEmail").value,password:document.getElementById("loginPassword").value});if(error){status.className="form-status err";status.textContent="بيانات الدخول غير صحيحة أو الحساب غير مفعّل.";return}const {data}=await db.client.rpc("is_admin");if(!data){await db.client.auth.signOut();status.className="form-status err";status.textContent="الحساب ليس إداريًا.";return}location.href="admin.html"})
  return;
 }
 if(page!=="admin")return;
 const guard=document.getElementById("adminGuard");
 if(!db?.enabled){guard.textContent="لوحة الإدارة معطلة حتى ربط Supabase.";guard.className="mode-banner";return}
 const {data:{session}}=await db.client.auth.getSession();
 if(!session){location.href="login.html";return}
 const {data:isAdmin,error:adminError}=await db.client.rpc("is_admin");
 if(adminError||!isAdmin){await db.client.auth.signOut();location.href="login.html";return}
 guard.remove();
 document.querySelectorAll("[data-admin-tab]").forEach(b=>b.onclick=()=>{document.querySelectorAll("[data-admin-tab]").forEach(x=>x.classList.remove("active"));b.classList.add("active");document.querySelectorAll(".admin-tab").forEach(x=>x.classList.remove("active"));document.getElementById("tab-"+b.dataset.adminTab).classList.add("active")});
 document.getElementById("logoutBtn").onclick=async()=>{await db.client.auth.signOut();location.href="login.html"};
 await refresh();
 document.getElementById("adminProductForm").onsubmit=async e=>{e.preventDefault();let f=new FormData(e.target);const payload={name:f.get("name"),slug:f.get("slug"),description:f.get("description"),short_description:f.get("description").slice(0,140),type:"مادة مجانية",reward_ads_required:Number(f.get("reward_ads_required")||5),status:"published"};const {error}=await db.client.from("products").insert(payload);if(!error){e.target.reset();await refresh()}else alert("تعذر الحفظ: "+error.message)};
 document.getElementById("adminPostForm").onsubmit=async e=>{e.preventDefault();let f=new FormData(e.target);const payload={title:f.get("title"),slug:f.get("slug"),excerpt:f.get("excerpt"),body:f.get("body"),status:"published",published_at:new Date().toISOString()};const {error}=await db.client.from("posts").insert(payload);if(!error){e.target.reset();await refresh()}else alert("تعذر الحفظ: "+error.message)};
 async function refresh(){
  const tables=["products","posts","subscribers","sponsor_requests"];const counts={};
  for(const t of tables){const {count}=await db.client.from(t).select("*",{count:"exact",head:true});counts[t]=count||0}
  document.getElementById("adminKpis").innerHTML=[["المنتجات",counts.products],["المحتوى",counts.posts],["المشتركون",counts.subscribers],["طلبات الرعاية",counts.sponsor_requests]].map(x=>`<div class="kpi"><span>${x[0]}</span><b>${x[1]}</b></div>`).join("");
  const {data:products}=await db.client.from("products").select("id,name,status").order("created_at",{ascending:false}).limit(20);
  document.getElementById("adminProductsList").innerHTML=(products||[]).map(x=>`<div class="admin-item"><b>${esc(x.name)}</b> — ${esc(x.status)}</div>`).join("");
  const {data:posts}=await db.client.from("posts").select("id,title,status,published_at").order("created_at",{ascending:false}).limit(20);
  document.getElementById("adminPostsList").innerHTML=(posts||[]).map(x=>`<div class="admin-item"><b>${esc(x.title)}</b> — ${esc(x.status)}</div>`).join("");
  const reqs=[];
  for(const [table,label] of [["sponsor_requests","رعاية"],["service_requests","خدمة"],["contact_messages","تواصل"]]){const {data}=await db.client.from(table).select("*").order("created_at",{ascending:false}).limit(8);(data||[]).forEach(x=>reqs.push({label,...x}))}
  reqs.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  document.getElementById("adminRequests").innerHTML=reqs.slice(0,25).map(x=>`<div class="admin-item"><b>${esc(x.label)}</b> — ${esc(x.name||x.company||x.email||"")}</div>`).join("");
 }
 function esc(s){return String(s??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]))}
})();
