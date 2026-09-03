(async()=>{
 const db=window.SoutakDB;
 async function posts(){
   if(!db?.enabled) return [];
   const {data,error}=await db.client.from("soutak_posts").select("slug,title,excerpt,body,published_at").eq("status","published").order("published_at",{ascending:false});
   if(error){console.error(error);return []}
   return data||[];
 }
 const list=await posts();
 if(document.body.dataset.page==="content"){
   document.getElementById("postsGrid").innerHTML=list.map(p=>`<article class="post-card"><div class="card-body"><span class="tag">محتوى</span><h3>${e(p.title)}</h3><p>${e(p.excerpt)}</p><div class="card-foot"><small>${e((p.published_at||"").slice(0,10))}</small><a class="btn ghost small" href="post.html?slug=${encodeURIComponent(p.slug)}">اقرأ</a></div></div></article>`).join("")||"<p>لا يوجد محتوى منشور حاليًا.</p>";
 }
 if(document.body.dataset.page==="post"){
   const slug=new URLSearchParams(location.search).get("slug"),p=list.find(x=>x.slug===slug),v=document.getElementById("postView");
   if(!p){v.innerHTML="<h2>المقال غير موجود</h2>";return}
   v.innerHTML=`<span class="tag">مقال</span><h1 style="font-size:46px;margin:12px 0">${e(p.title)}</h1><div class="article-meta">${e((p.published_at||"").slice(0,10))}</div><p>${e(p.body).replace(/\n/g,"<br>")}</p>`;
 }
 function e(s){return String(s??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]))}
})();
