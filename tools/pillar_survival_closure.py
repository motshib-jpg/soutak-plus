from pathlib import Path
import re, html

root = Path(__file__).resolve().parents[1]
articles_dir = root / 'articles'

# Make authorship visible in raw HTML.
for p in sorted(articles_dir.glob('*.html')):
    s = p.read_text('utf-8')
    if 'article-byline' not in s:
        m = re.search(r'(<div class="article-meta-row">.*?</div>)', s, flags=re.S)
        if m:
            byline = '<p class="article-byline">إعداد: <a href="../editorial.html">فريق تحرير صوتك+</a> — مسؤولية تحريرية ومراجعة موضحة في سياسة الموقع.</p>'
            s = s[:m.end()] + byline + s[m.end():]
            p.write_text(s, 'utf-8')

additions = {
'seo-for-arabic-content-beginners.html': r'''
<section class="evidence-block" data-original-evidence="true">
<h2>دراسة حالة من صوتك+: ماذا حدث عند إطلاق 29 رابطًا جديدًا؟</h2>
<p>هذه لقطة إطلاق موثقة بتاريخ <strong>7 سبتمبر 2026</strong> وليست رقمًا دائمًا: كان متعقب Search Console يتابع 29 رابطًا، وكانت الصفحة الرئيسية وحدها مفهرسة وقت القياس بينما بقية الروابط ما زالت في مرحلة الاكتشاف. في الوقت نفسه اجتازت الصفحات العامة تدقيق On‑Page تقنيًا من دون مشكلات عنوان أو canonical أو indexability. الدرس العملي: صحة الـSEO التقني شرط ضروري، لكنها لا تعني فهرسة فورية.</p>
<div class="evidence-flow" aria-label="تسلسل الاكتشاف والفهرسة"><span>صفحة مفيدة</span><b>←</b><span>رابط داخلي + Sitemap</span><b>←</b><span>زحف Google</span><b>←</b><span>تقييم الجودة</span><b>←</b><span>فهرسة محتملة</span></div>
<p>لهذا لا نكرر طلب الفهرسة عشرات المرات. Google توضح أن طلب إعادة الزحف لا يضمن الظهور الفوري، وأن الأنظمة تعطي الأولوية للمحتوى عالي الجودة والمفيد. نستخدم URL Inspection للتشخيص، ثم نعود لتحسين قيمة الصفحة وربطها واكتشافها.</p>
<h3>قائمة فحص نستخدمها فعليًا قبل لوم الفهرسة</h3><ul><li>HTTP 200 حقيقي.</li><li>لا يوجد noindex على الصفحة العامة.</li><li>canonical ذاتي وصحيح.</li><li>رابط داخلي من مكتبة المحتوى ومن صفحات مرتبطة.</li><li>وجود الصفحة في sitemap.xml.</li><li>المحتوى نفسه يضيف إجابة أو مثالًا أو أداة لا مجرد إعادة صياغة.</li></ul>
<div class="source-list"><h3>مصادر رسمية استخدمناها في هذه الصفحة</h3><ul><li><a href="https://developers.google.com/search/docs/fundamentals/creating-helpful-content" target="_blank" rel="noopener noreferrer">Google Search Central — إنشاء محتوى مفيد وموثوق وموجّه للناس</a>.</li><li><a href="https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl" target="_blank" rel="noopener noreferrer">Google Search Central — طلب إعادة زحف Google إلى الروابط</a>.</li><li><a href="https://developers.google.com/search/docs/essentials/technical" target="_blank" rel="noopener noreferrer">Google Search Central — المتطلبات التقنية لبحث Google</a>.</li></ul></div>
<p class="evidence-cta">جرّب أيضًا <a href="../content.html#contentLab">مختبر صوتك+</a> قبل كتابة الصفحة التالية: اختبر وضوح الفكرة ثم ابنِ موجزًا يفرض إضافة دليل أو مثال أصلي.</p>
</section>
''',
'youtube-channel-without-showing-face.html': r'''
<section class="evidence-block" data-original-evidence="true">
<h2>قالب إنتاج من صفحة واحدة لقناة بدون ظهور</h2><p>بدل البدء بالمونتاج، استخدم هذا التسلسل كاختبار قبل كل فيديو. إذا لم تستطع ملء خانة، فالمشكلة في الفكرة أو الدليل قبل أن تكون في البرنامج.</p>
<div class="decision-grid"><div><b>1. السؤال</b><span>ما السؤال الذي سيغادر المشاهد وهو يعرف إجابته؟</span></div><div><b>2. الوعد</b><span>ما النتيجة الدقيقة في العنوان والمقدمة؟</span></div><div><b>3. الدليل</b><span>ما المثال أو المصدر أو التسجيل الذي يثبت الشرح؟</span></div><div><b>4. الصوت</b><span>هل يمكن فهم الفكرة من الهاتف دون رفع الصوت؟</span></div><div><b>5. المرئيات</b><span>هل كل لقطة تشرح شيئًا بدل أن تكون خلفية فقط؟</span></div><div><b>6. الانتقال</b><span>ما الفيديو المنطقي التالي بعد هذه الحلقة؟</span></div></div>
<h3>ما الذي نقيسه بعد النشر؟</h3><p>لا نحكم على الفيديو من المشاهدات وحدها. راقب هل العنوان والصورة يجذبان النقر من الجمهور المناسب، ثم راقب الاحتفاظ بالمشاهد لمعرفة أين فقد الفيديو اهتمام الناس. هذه مقاييس داخل أدوات YouTube نفسها، وليست نسبًا سحرية ثابتة.</p>
<div class="source-list"><h3>مصادر YouTube الرسمية</h3><ul><li><a href="https://support.google.com/youtube/answer/12340300" target="_blank" rel="noopener noreferrer">YouTube Help — نصائح العنوان والصورة المصغرة</a>.</li><li><a href="https://support.google.com/youtube/answer/9313698" target="_blank" rel="noopener noreferrer">YouTube Help — فهم التفاعل ومدة المشاهدة والاحتفاظ</a>.</li><li><a href="https://support.google.com/youtube/answer/9002587" target="_blank" rel="noopener noreferrer">YouTube Help — البدء باستخدام YouTube Analytics</a>.</li></ul></div>
<p class="evidence-cta">قبل تسجيل الفيديو، استخدم <a href="../content.html#contentLab">مولّد موجز المحتوى</a> في مختبر صوتك+ وحدد الجمهور والمشكلة والنتيجة والدليل المطلوب.</p>
</section>
''',
'youtube-video-script-template.html': r'''
<section class="evidence-block" data-original-evidence="true">
<h2>قالب سكربت قابل للنسخ والتطبيق</h2><p>هذا قالب عملي من صوتك+، وليس قاعدة إلزامية. احذف أي جزء لا يخدم الفكرة بدل ملء الزمن.</p>
<pre class="script-template" aria-label="قالب سكربت فيديو">العنوان: [وعد واضح ودقيق]
الجمهور: [من يحتاج هذه الإجابة؟]

0) الخطاف: المشكلة أو السؤال في جملة واحدة.
1) الوعد: ماذا سيفهم المشاهد بنهاية الفيديو؟
2) السياق الضروري فقط.
3) النقطة الأولى + مثال أو دليل.
4) النقطة الثانية + مثال أو مقارنة.
5) النقطة الثالثة + خطأ شائع أو قيد مهم.
6) الخلاصة: اربط النقاط بالنتيجة الموعودة.
7) الخطوة التالية: فيديو أو تطبيق منطقي.

بوابة الجودة قبل التسجيل:
[ ] كل ادعاء متغير له مصدر أو تحقق.
[ ] كل مرئية تشرح معنى.
[ ] أول 20 ثانية تدخل في الموضوع.
[ ] العنوان لا يعد بما لا يقدمه النص.</pre>
<h3>كيف نراجع السكربت بعد النشر؟</h3><p>إذا كان العنوان يجلب نقرات لكن الناس يغادرون مبكرًا، راجع التطابق بين الوعد والمقدمة وسرعة الدخول في الموضوع. وإذا كان الاحتفاظ جيدًا لكن النقر ضعيفًا، راجع التغليف بدل إعادة كتابة الفيديو كله.</p>
<div class="source-list"><h3>مصادر رسمية للمراجعة</h3><ul><li><a href="https://support.google.com/youtube/answer/12340300" target="_blank" rel="noopener noreferrer">YouTube Help — دقة العنوان والصورة المصغرة وقياس CTR</a>.</li><li><a href="https://support.google.com/youtube/answer/9314415" target="_blank" rel="noopener noreferrer">YouTube Help — اللحظات الرئيسية للاحتفاظ بالجمهور</a>.</li><li><a href="https://support.google.com/youtube/answer/9313698" target="_blank" rel="noopener noreferrer">YouTube Help — تقارير التفاعل ومدة المشاهدة</a>.</li></ul></div>
<p class="evidence-cta">يمكنك اختبار عنوان السكربت فورًا عبر <a href="../content.html#contentLab">فاحص العنوان في مختبر صوتك+</a>.</p>
</section>
''',
'content-ideas-system.html': r'''
<section class="evidence-block" data-original-evidence="true">
<h2>مصفوفة صوتك+ لإنتاج 30 زاوية من موضوع واحد</h2><p>اختر موضوعًا واحدًا ثم مرره على الصفوف الستة والأعمدة الخمسة. الهدف ليس نشر الثلاثين، بل اكتشاف الزوايا التي تملك لها دليلًا أو خبرة حقيقية.</p>
<div class="matrix-wrap"><table class="idea-matrix"><thead><tr><th>الزاوية</th><th>مبتدئ</th><th>متوسط</th><th>خطأ شائع</th><th>مقارنة</th><th>تجربة</th></tr></thead><tbody><tr><th>كيف؟</th><td>كيف تبدأ؟</td><td>كيف تحسن؟</td><td>كيف تصلح الخطأ؟</td><td>كيف تختار بين طريقتين؟</td><td>كيف طبقناها؟</td></tr><tr><th>لماذا؟</th><td>لماذا يهم؟</td><td>لماذا يتوقف التقدم؟</td><td>لماذا يفشل هذا الأسلوب؟</td><td>لماذا قد يناسب A أكثر من B؟</td><td>لماذا تغير قرارنا بعد التجربة؟</td></tr><tr><th>قائمة</th><td>5 أساسيات</td><td>5 تحسينات</td><td>5 أخطاء</td><td>5 فروق</td><td>5 ملاحظات من التنفيذ</td></tr><tr><th>قالب</th><td>قالب بداية</td><td>قالب مراجعة</td><td>قالب كشف خطأ</td><td>جدول مقارنة</td><td>سجل تجربة</td></tr><tr><th>حالة</th><td>مثال بسيط</td><td>حالة أعمق</td><td>حالة فشل</td><td>حالتان متقابلتان</td><td>قبل/بعد</td></tr><tr><th>قياس</th><td>ماذا تقيس أولًا؟</td><td>ما المؤشر التالي؟</td><td>كيف تعرف أن الخلل موجود؟</td><td>كيف تقارن النتيجتين؟</td><td>ماذا تعلمنا من الرقم؟</td></tr></tbody></table></div>
<p>بعد ملء المصفوفة، احذف أي فكرة لا تستطيع إضافة مثال أو مصدر أو نتيجة لها. هذه الخطوة تمنع تحويل بنك الأفكار إلى مصنع صفحات متشابهة.</p>
<div class="source-list"><h3>مصادر تساعد على اختبار الطلب بدل التخمين</h3><ul><li><a href="https://support.google.com/trends/answer/6248105" target="_blank" rel="noopener noreferrer">Google Trends Help — البدء باستخدام Google Trends</a>.</li><li><a href="https://support.google.com/trends/answer/4359550" target="_blank" rel="noopener noreferrer">Google Trends Help — مقارنة عبارات البحث</a>.</li><li><a href="https://support.google.com/youtube/answer/9002587" target="_blank" rel="noopener noreferrer">YouTube Help — Analytics وTrends لاكتشاف فجوات المحتوى</a>.</li></ul></div>
<p class="evidence-cta">إذا خرجت لك عشرات الأفكار، مرر أفضل ثلاث منها على <a href="../content.html#contentLab">اختبار وضوح فكرة المحتوى</a> قبل البدء بالإنتاج.</p>
</section>
''',
'how-to-choose-content-niche.html': r'''
<section class="evidence-block" data-original-evidence="true">
<h2>بطاقة قرار من صوتك+: هل المجال يستحق 90 يومًا من العمل؟</h2><p>قيّم كل بند من 0 إلى 2. لا تبحث عن نتيجة مثالية؛ استخدم الدرجة لكشف أين تحتاج دليلًا قبل الالتزام.</p>
<div class="scorecard"><div><b>طلب حقيقي</b><span>0 لا دليل — 1 إشارات — 2 أسئلة/بحث واضح</span></div><div><b>قدرة على الاستمرار</b><span>0 فكرة أو اثنتان — 1 نحو 10 — 2 عشرات الأسئلة</span></div><div><b>خبرة أو تعلم قابل للإثبات</b><span>0 إعادة نقل — 1 تعلم منظم — 2 تجربة/نتائج/أمثلة أصلية</span></div><div><b>تميّز الزاوية</b><span>0 نسخة من الموجود — 1 صياغة أفضل — 2 أداة/منهج/حالة لا تتكرر بسهولة</span></div><div><b>طريق إلى جمهور</b><span>0 لا قناة توزيع — 1 قناة محتملة — 2 قناة يمكن استخدامها الآن</span></div></div>
<p><strong>0–4:</strong> لا تبنِ مكتبة كبيرة بعد. <strong>5–7:</strong> اختبر بثلاث قطع محتوى. <strong>8–10:</strong> لديك أساس معقول لتجربة 90 يومًا ثم إعادة التقييم بالأرقام.</p>
<h3>اختبر اللغة والسوق، لا تعتمد على شعورك فقط</h3><p>Google Trends يسمح بمقارنة عبارات وموضوعات والاهتمام النسبي عبر الزمن والمناطق، بينما YouTube Analytics يساعد القناة القائمة على فهم الجمهور الفعلي. لا تستخدم أي أداة كحكم نهائي؛ اجمع الإشارة الكمية مع قدرتك الحقيقية على تقديم قيمة.</p>
<div class="source-list"><h3>مصادر رسمية للاختبار</h3><ul><li><a href="https://support.google.com/trends/answer/4359550" target="_blank" rel="noopener noreferrer">Google Trends Help — مقارنة عبارات البحث</a>.</li><li><a href="https://support.google.com/trends/answer/4365533" target="_blank" rel="noopener noreferrer">Google Trends Help — كيف تُجمع وتُطبّع بيانات Trends</a>.</li><li><a href="https://support.google.com/youtube/answer/9314416" target="_blank" rel="noopener noreferrer">YouTube Help — فهم جمهور القناة</a>.</li></ul></div>
<p class="evidence-cta">بعد اختيار مجال مبدئي، استخدم <a href="../content.html#contentLab">اختبار الوضوح</a> في مختبر صوتك+ قبل إنتاج سلسلة كاملة.</p>
</section>
'''
}

for name, block in additions.items():
    p = articles_dir / name
    s = p.read_text('utf-8')
    if 'data-original-evidence="true"' not in s:
        marker = '<div class="article-related">'
        s = s.replace(marker, block + marker, 1) if marker in s else s.replace('</article>', block + '</article>', 1)
        p.write_text(s, 'utf-8')

# Editorial first-party evidence.
ep = root / 'editorial.html'
es = ep.read_text('utf-8')
if 'id="firstPartyEvidence"' not in es:
    section = '''<h2 id="firstPartyEvidence">كيف نثبت الخبرة بدل الاكتفاء بالصياغة؟</h2><p>عندما نستطيع، نربط الشرح بما نفذناه فعليًا داخل صوتك+: إعداد Search Console، بناء Sitemap وروابط canonical، فصل قراءة المقالات عن قاعدة البيانات، تشغيل اختبارات CI، ومراقبة الفهرسة والأخطاء. وفي الموضوعات التي لا نملك فيها تجربة مباشرة كافية، نفضّل ربط المصدر الرسمي وإعطاء قالب عملي يمكن للقارئ اختباره بدل اختراع نتيجة.</p><div class="policy-note">مثال: صفحة SEO تحتوي لقطة إطلاق مؤرخة من حالة فهرسة صوتك+ وتشرح الفرق بين صحة الإعداد التقني وقرار Google في الزحف والفهرسة. هذه اللقطة معروضة كتجربة محددة بتاريخها، لا كقاعدة عامة.</div><p>كما أن <a href="content.html#contentLab">مختبر صوتك+</a> يقدم أدوات محلية من تصميم الموقع لاختبار وضوح الفكرة والعنوان وبناء موجز يفرض إضافة دليل أو مثال قبل النشر.</p>'''
    es = es.replace('<h2>الاستقلال الرقمي</h2>', section + '<h2>الاستقلال الرقمي</h2>', 1)
    ep.write_text(es, 'utf-8')

# RSS discovery link.
root_public = ['index.html','content.html','services.html','sponsors.html','about.html','editorial.html','contact.html','privacy.html','terms.html']
for name in root_public:
    p = root / name
    s = p.read_text('utf-8')
    if 'application/rss+xml' not in s:
        p.write_text(s.replace('</head>', '<link rel="alternate" type="application/rss+xml" title="صوتك+ RSS" href="feed.xml"></head>', 1), 'utf-8')
for p in articles_dir.glob('*.html'):
    s = p.read_text('utf-8')
    if 'application/rss+xml' not in s:
        p.write_text(s.replace('</head>', '<link rel="alternate" type="application/rss+xml" title="صوتك+ RSS" href="../feed.xml"></head>', 1), 'utf-8')

# Build RSS feed.
items = []
for p in sorted(articles_dir.glob('*.html')):
    s = p.read_text('utf-8')
    mt = re.search(r'<title>(.*?)</title>', s, re.S)
    mc = re.search(r'<link rel="canonical" href="([^"]+)"', s)
    md = re.search(r'<meta name="description" content="([^"]*)"', s)
    if not (mt and mc):
        continue
    title = re.sub(r'\s*\|\s*صوتك\+\s*$', '', html.unescape(mt.group(1).strip()))
    desc = html.unescape(md.group(1).strip()) if md else ''
    items.append((title, mc.group(1), desc))
rss_items = [f'<item><title>{html.escape(t)}</title><link>{html.escape(u)}</link><guid isPermaLink="true">{html.escape(u)}</guid><description>{html.escape(d)}</description></item>' for t,u,d in items]
rss = '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>صوتك+ — المقالات والأدلة</title><link>https://soutak-plus.vercel.app/</link><description>محتوى عربي عملي لصنّاع المحتوى حول يوتيوب وSEO وبناء الجمهور والحضور الرقمي.</description><language>ar</language>' + ''.join(rss_items) + '</channel></rss>\n'
(root / 'feed.xml').write_text(rss, 'utf-8')

# Evidence styling.
cssp = root / 'assets/css/polish.css'
css = cssp.read_text('utf-8') if cssp.exists() else ''
if '/* survival-evidence-v1 */' not in css:
    css += '''\n/* survival-evidence-v1 */\n.evidence-block{margin:2.25rem 0;padding:1.35rem;border:1px solid rgba(255,255,255,.12);border-radius:22px;background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.025))}.evidence-block h2{margin-top:.15rem}.evidence-block h3{margin-top:1.35rem}.evidence-flow{display:flex;flex-wrap:wrap;gap:.55rem;align-items:center;margin:1rem 0}.evidence-flow span{padding:.55rem .75rem;border:1px solid rgba(255,255,255,.13);border-radius:12px;background:rgba(255,255,255,.04)}.decision-grid,.scorecard{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:.75rem;margin:1rem 0}.decision-grid>div,.scorecard>div{padding:1rem;border-radius:16px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.1)}.decision-grid b,.scorecard b{display:block;margin-bottom:.35rem}.decision-grid span,.scorecard span{display:block;opacity:.82;line-height:1.75}.script-template{white-space:pre-wrap;direction:rtl;text-align:right;line-height:1.9;padding:1rem;border-radius:16px;overflow:auto;background:#0b101c;border:1px solid rgba(255,255,255,.12);font:inherit}.matrix-wrap{overflow:auto}.idea-matrix{width:100%;border-collapse:collapse;min-width:760px;margin:1rem 0}.idea-matrix th,.idea-matrix td{padding:.7rem;border:1px solid rgba(255,255,255,.12);vertical-align:top}.idea-matrix th{background:rgba(255,255,255,.06)}.source-list{margin-top:1.25rem;padding:1rem;border-inline-start:4px solid rgba(101,194,255,.65);background:rgba(101,194,255,.06);border-radius:14px}.source-list ul{margin-bottom:0}.source-list a{text-decoration:underline;text-underline-offset:3px}.evidence-cta{margin-top:1rem;padding:.85rem 1rem;border-radius:14px;background:rgba(255,255,255,.04)}.article-byline{margin:.65rem 0 1.2rem;font-size:.94rem;opacity:.82}.article-byline a{text-decoration:underline;text-underline-offset:3px}\n'''
    cssp.write_text(css, 'utf-8')

# Vercel RSS headers.
vp = root / 'vercel.json'
vs = vp.read_text('utf-8')
if '"source": "/feed.xml"' not in vs:
    needle = '    {\n      "source": "/manifest.webmanifest",'
    rule = '    {\n      "source": "/feed.xml",\n      "headers": [{"key":"Content-Type","value":"application/rss+xml; charset=utf-8"},{"key":"Cache-Control","value":"public, max-age=0, s-maxage=300, must-revalidate"}]\n    },\n'
    if needle in vs:
        vp.write_text(vs.replace(needle, rule + needle, 1), 'utf-8')

# Permanent QA survival invariants.
qp = root / 'QA_CHECK.py'
q = qp.read_text('utf-8')
if '# Survival baseline invariants.' not in q:
    insert = r'''

# Survival baseline invariants.
for required in ["RISK_REGISTER.md", "SURVIVAL_POLICY.md", "feed.xml", ".github/workflows/survival-monitor.yml"]:
    if not (root / required).exists():
        errors.append(f"Missing survival control: {required}")

for article in article_pages:
    if f'articles/{article.name}' not in content_html:
        errors.append(f"{article.name}: missing link from content.html")

pillars = ["seo-for-arabic-content-beginners.html","youtube-channel-without-showing-face.html","youtube-video-script-template.html","content-ideas-system.html","how-to-choose-content-niche.html"]
for name in pillars:
    txt = (root / "articles" / name).read_text(encoding="utf-8")
    for marker in ['data-original-evidence="true"', 'class="source-list"', 'target="_blank" rel="noopener noreferrer"']:
        if marker not in txt:
            errors.append(f"{name}: missing pillar survival marker {marker}")
    if txt.count('href="https://') < 2:
        errors.append(f"{name}: pillar page needs multiple durable source links")

feed = (root / "feed.xml").read_text(encoding="utf-8")
for article in article_pages:
    txt = article.read_text(encoding="utf-8")
    m = re.search(r'<link rel="canonical" href="([^"]+)"', txt)
    if not m or m.group(1) not in feed:
        errors.append(f"{article.name}: missing from RSS feed")

risk_text = (root / "RISK_REGISTER.md").read_text(encoding="utf-8")
for marker in ["R01", "R07", "R19", "R20", "Irreducible external risks"]:
    if marker not in risk_text:
        errors.append(f"Risk register baseline missing: {marker}")
'''
    qp.write_text(q.replace('\nif errors:\n', insert + '\nif errors:\n', 1), 'utf-8')

print('pillar survival closure applied')
