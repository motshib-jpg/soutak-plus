(()=>{
  const qs=(s)=>document.querySelector(s);
  qs('#clarityCalc')?.addEventListener('click',()=>{
    const checks=[...document.querySelectorAll('[data-clarity]')];
    const score=checks.filter(x=>x.checked).length*20;
    const text=score>=80?'ممتاز: الفكرة واضحة بما يكفي للانتقال إلى خطة تنفيذ.':score>=60?'جيد: وضّح النقاط غير المحددة قبل توسيع الإنتاج.':score>=40?'متوسط: ما زال المجال واسعًا أو الوعد غير واضح.':'ضعيف: لا تبدأ بالإنتاج الكبير قبل تحديد الجمهور والمشكلة والفائدة.';
    qs('#clarityResult').textContent=`${score}/100 — ${text}`;
  });
  qs('#headlineCheck')?.addEventListener('click',()=>{
    const v=(qs('#headlineInput')?.value||'').trim();
    if(!v){qs('#headlineResult').textContent='اكتب عنوانًا أولًا.';return}
    let score=0, notes=[];
    if(v.length>=28&&v.length<=72)score+=35;else notes.push('اجعل الطول أوضح؛ غالبًا 28–72 حرفًا مناسب كنقطة بداية.');
    if(/[؟?]/.test(v)||/كيف|لماذا|دليل|خطوات|قالب|طريقة|مقارنة/.test(v))score+=25;else notes.push('أظهر نوع الفائدة أو السؤال بوضوح.');
    if(/محتوى|يوتيوب|جمهور|SEO|عنوان|فيديو|خدمة|بورتفوليو|مقال/.test(v))score+=20;else notes.push('أضف كلمة تصف الموضوع بوضوح.');
    if(!/مذهل|خرافي|لن تصدق|سر خطير|صدمة/.test(v))score+=20;else notes.push('تجنب المبالغة التي لا يمكن الوفاء بها.');
    qs('#headlineResult').textContent=`${score}/100 — ${notes.length?notes.join(' '):'عنوان واضح ومحدد دون مبالغة ظاهرة.'}`;
  });
  qs('#briefBuild')?.addEventListener('click',()=>{
    const a=(qs('#briefAudience')?.value||'غير محدد').trim();
    const p=(qs('#briefProblem')?.value||'غير محددة').trim();
    const o=(qs('#briefOutcome')?.value||'غير محددة').trim();
    const e=(qs('#briefEvidence')?.value||'يجب إضافة مثال أو مصدر أو دليل أصلي قبل النشر').trim();
    qs('#briefOutput').value=`الجمهور: ${a}\nالمشكلة/السؤال: ${p}\nالنتيجة الموعودة: ${o}\nالدليل أو الإضافة الأصلية: ${e}\n\nشرط النشر: يجب أن يفي العنوان والمقدمة بالنتيجة الموعودة، وأن يحتوي المحتوى على مثال أو دليل يمكن للقارئ استخدامه أو التحقق منه.`;
  });
  qs('#briefCopy')?.addEventListener('click',async()=>{
    const out=qs('#briefOutput'); if(!out?.value)return;
    try{await navigator.clipboard.writeText(out.value);qs('#briefCopy').textContent='تم النسخ ✓';setTimeout(()=>qs('#briefCopy').textContent='نسخ الموجز',1600)}catch(_){out.select();document.execCommand('copy')}
  });
})();