(async()=>{
  const db=window.SoutakDB;
  async function posts(){
    if(!db?.enabled) return [];
    const {data,error}=await db.client.from("soutak_posts").select("slug,title,excerpt,body,published_at,updated_at").eq("status","published").order("published_at",{ascending:false});
    if(error){console.error(error);return []}
    return data||[];
  }

  const list=await posts();

  if(document.body.dataset.page==="content"){
    const grid=document.getElementById("postsGrid");
    if(grid && list.length){
      grid.innerHTML=list.map(p=>`<article class="post-card"><div class="card-body"><span class="tag">مقال</span><h3>${e(p.title)}</h3><p>${e(p.excerpt)}</p><div class="card-foot"><small>${formatDate(p.published_at)}</small><a class="btn ghost small" href="post.html?slug=${encodeURIComponent(p.slug)}">اقرأ المقال</a></div></div></article>`).join("");
      grid.removeAttribute("data-fallback");
    }
  }

  if(document.body.dataset.page==="post"){
    const slug=new URLSearchParams(location.search).get("slug");
    const p=list.find(x=>x.slug===slug);
    const v=document.getElementById("postView");
    if(!v) return;
    if(!p){
      v.innerHTML="<div class='info-box'><h2>المقال غير موجود أو تعذر تحميله</h2><p>يمكنك العودة إلى مكتبة المحتوى واختيار مقال آخر.</p><div class='actions'><a class='btn ghost' href='content.html'>العودة للمحتوى</a></div></div>";
      return;
    }

    setMeta(p);
    const readingMinutes=Math.max(2,Math.round(String(p.body||"").split(/\s+/).length/180));
    v.innerHTML=`<span class="tag">مقال من صوتك+</span><h1>${e(p.title)}</h1><p class="article-lead">${e(p.excerpt)}</p><div class="article-meta-row"><span>نشر: ${formatDate(p.published_at)}</span><span>•</span><span>قراءة تقريبية: ${readingMinutes} دقائق</span>${p.updated_at?`<span>•</span><span>آخر تحديث: ${formatDate(p.updated_at)}</span>`:""}</div><article class="article-body">${renderArticle(p.body||"")}</article>${related(p.slug)}`;
  }

  function related(currentSlug){
    const items=list.filter(x=>x.slug!==currentSlug).slice(0,3);
    if(!items.length) return "";
    return `<section class="article-related"><span class="section-kicker">اقرأ أيضًا</span><h2>مقالات قد تساعدك في الخطوة التالية</h2><div class="grid3">${items.map(x=>`<article class="post-card"><div class="card-body"><h3>${e(x.title)}</h3><p>${e(x.excerpt)}</p><div class="card-foot"><a class="btn ghost small" href="post.html?slug=${encodeURIComponent(x.slug)}">اقرأ</a></div></div></article>`).join("")}</div></section>`;
  }

  function setMeta(p){
    document.title=`${p.title} | صوتك+`;
    const desc=document.querySelector('meta[name="description"]')||document.head.appendChild(Object.assign(document.createElement("meta"),{name:"description"}));
    desc.setAttribute("content",p.excerpt||"");
    const canonical=document.querySelector('link[rel="canonical"]')||document.head.appendChild(Object.assign(document.createElement("link"),{rel:"canonical"}));
    const url=`https://soutak-plus.vercel.app/post.html?slug=${encodeURIComponent(p.slug)}`;
    canonical.setAttribute("href",url);
    setOg("og:title",p.title); setOg("og:description",p.excerpt||""); setOg("og:url",url); setOg("og:type","article");
    const schema=document.createElement("script");
    schema.type="application/ld+json";
    schema.textContent=JSON.stringify({"@context":"https://schema.org","@type":"Article","headline":p.title,"description":p.excerpt||"","datePublished":p.published_at||undefined,"dateModified":p.updated_at||p.published_at||undefined,"inLanguage":"ar","mainEntityOfPage":url,"publisher":{"@type":"Organization","name":"صوتك+","url":"https://soutak-plus.vercel.app/"}});
    document.head.appendChild(schema);
  }

  function setOg(property,content){
    let m=document.querySelector(`meta[property="${property}"]`);
    if(!m){m=document.createElement("meta");m.setAttribute("property",property);document.head.appendChild(m)}
    m.setAttribute("content",content||"");
  }

  function renderArticle(raw){
    const text=String(raw||"").replace(/\\n/g,"\n").replace(/\r/g,"");
    const lines=text.split("\n");
    let html="", listType=null;
    const closeList=()=>{if(listType){html+=`</${listType}>`;listType=null}};
    for(const original of lines){
      const line=original.trim();
      if(!line){closeList();continue}
      if(line.startsWith("### ")){closeList();html+=`<h3>${e(line.slice(4))}</h3>`;continue}
      if(line.startsWith("## ")){closeList();html+=`<h2>${e(line.slice(3))}</h2>`;continue}
      if(line.startsWith("# ")){closeList();html+=`<h2>${e(line.slice(2))}</h2>`;continue}
      if(line.startsWith("> ")){closeList();html+=`<blockquote>${e(line.slice(2))}</blockquote>`;continue}
      if(/^[-•] /.test(line)){
        if(listType!=="ul"){closeList();listType="ul";html+="<ul>"}
        html+=`<li>${e(line.replace(/^[-•] /,""))}</li>`;continue
      }
      if(/^\d+[.)] /.test(line)){
        if(listType!=="ol"){closeList();listType="ol";html+="<ol>"}
        html+=`<li>${e(line.replace(/^\d+[.)] /,""))}</li>`;continue
      }
      closeList();html+=`<p>${e(line)}</p>`;
    }
    closeList();
    return html;
  }

  function formatDate(v){
    if(!v) return "";
    try{return new Intl.DateTimeFormat("ar",{year:"numeric",month:"short",day:"numeric"}).format(new Date(v))}catch(_){return String(v).slice(0,10)}
  }
  function e(s){return String(s??"").replace(/[&<>\"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;"}[m]))}
})();
