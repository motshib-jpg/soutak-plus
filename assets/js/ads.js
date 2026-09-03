(() => {
  const cfg = window.SOUTAK_CONFIG?.ads || {};
  const slots = document.querySelectorAll("[data-ad-slot]");
  if (!slots.length) return;

  // Keep the page editorial when display advertising is not configured.  A blank
  // container is intentionally removed rather than being presented as a demo ad.
  if (!cfg.enabled || !cfg.publisherId) {
    slots.forEach(el => el.remove());
    return;
  }

  if (cfg.provider !== "adsense") {
    slots.forEach(el => el.remove());
    return;
  }

  if (!document.querySelector('script[data-soutak-adsense]')) {
    const script = document.createElement("script");
    script.async = true;
    script.crossOrigin = "anonymous";
    script.dataset.soutakAdsense = "1";
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(cfg.publisherId)}`;
    document.head.appendChild(script);
  }

  slots.forEach(el => {
    const slotName = el.dataset.adSlot;
    const slotId = cfg.slots?.[slotName];
    if (!slotId) {
      el.remove();
      return;
    }

    el.innerHTML = `
      <ins class="adsbygoogle"
        style="display:block"
        data-ad-client="${cfg.publisherId}"
        data-ad-slot="${slotId}"
        data-ad-format="auto"
        data-full-width-responsive="true"></ins>`;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (_) {}
  });
})();

---FILE---
from pathlib import Path
import re, sys, subprocess, shutil

root = Path(__file__).resolve().parent
errors = []
htmls = list(root.glob("*.html"))
if not htmls:
    errors.append("No HTML files found.")

for hp in htmls:
    txt = hp.read_text(encoding="utf-8")
    if "<title>" not in txt:
        errors.append(f"{hp.name}: missing title")
    if 'name="description"' not in txt:
        errors.append(f"{hp.name}: missing meta description")
    if "YOUR-DOMAIN.example" in txt or "motshib-jpg.github.io/soutak-plus" in txt:
        errors.append(f"{hp.name}: production URL placeholder found")
    if "وضع تجريبي" in txt or "نسخة تجريبية" in txt:
        errors.append(f"{hp.name}: demo text found")
    if hp.name not in {"admin.html", "login.html", "account.html", "404.html"} and 'rel="canonical" href="https://soutak-plus.vercel.app/' not in txt:
        errors.append(f"{hp.name}: missing production canonical")
    for ref in re.findall(r'(?:src|href)="([^"#?]+)', txt):
        if ref.startswith(("http:", "https:", "mailto:", "tel:", "javascript:", "/api/")):
            continue
        target = ref.lstrip("/")
        if not (root / target).exists():
            errors.append(f"{hp.name}: missing local reference {ref}")

node = shutil.which("node")
if node:
    for js in (root / "assets/js").glob("*.js"):
        p = subprocess.run([node, "--check", str(js)], capture_output=True, text=True)
        if p.returncode:
            errors.append(f"{js.name}: JS syntax error: {p.stderr.strip()}")

store = (root / "assets/js/store.js").read_text(encoding="utf-8")
gate = (root / "assets/js/reward-gate.js").read_text(encoding="utf-8")
ads = (root / "assets/js/rewarded-ads.js").read_text(encoding="utf-8")
display_ads = (root / "assets/js/ads.js").read_text(encoding="utf-8")
for marker in ['"creator-starter-guide":5','"content-templates":5','"first-audience":10']:
    if marker not in store.replace(" ", "") or marker not in gate.replace(" ", ""):
        errors.append(f"Reward policy missing or inconsistent: {marker}")
if "rewardedSlotGranted" not in ads:
    errors.append("Rewarded ads must grant progress only from rewardedSlotGranted")
if "localStorage" in gate:
    errors.append("reward-gate.js must not trust localStorage for entitlement")
if "functions/v1/soutak-reward" not in gate:
    errors.append("reward-gate.js must use the server-side reward function")
if "مساحة إعلانية تجريبية" in display_ads or "مزود الإعلانات غير مهيأ" in display_ads:
    errors.append("Display ad code must not render demo or configuration placeholders")

for forbidden_resource in ["downloads/creator-starter-guide.md", "downloads/content-templates.md", "downloads/first-audience-roadmap.md"]:
    if (root / forbidden_resource).exists():
        errors.append(f"Protected resource must not be public: {forbidden_resource}")

for forbidden in ["checkout.html", "payment.html", "subscription.html"]:
    if (root / forbidden).exists():
        errors.append(f"Forbidden paid-access file present: {forbidden}")

if not (root / "vercel.json").exists():
    errors.append("vercel.json is required for production hosting")
if not (root / "account.html").exists() or not (root / "assets/js/account.js").exists():
    errors.append("User account flow is required for server-bound reward entitlement")

if errors:
    print("QA FAILED")
    for e in errors:
        print("-", e)
    sys.exit(1)
print(f"QA PASSED: {len(htmls)} HTML pages checked; server-side reward entitlement + 5/5/10 verified.")

---FILE---
<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="theme-color" content="#070a12">
<link rel="manifest" href="manifest.webmanifest"><link rel="icon" href="assets/images/icon.svg" type="image/svg+xml"><meta property="og:type" content="website"><meta property="og:site_name" content="صوتك+"><link rel="stylesheet" href="assets/css/style.css">
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script><script src="assets/js/config.js"></script><script src="assets/js/supabase-client.js" defer></script><script src="assets/js/app.js" defer></script>
<title>الشروط | صوتك+</title><meta name="description" content="شروط استخدام منصة صوتك+ ونظام إعلانات المكافأة."><link rel="canonical" href="https://soutak-plus.vercel.app/terms.html">
</head>
<body data-page="terms"><div class="ambient a1"></div><div class="ambient a2"></div><div id="siteHeader"></div>
<main><section class="page-hero compact"><div class="container"><span class="eyebrow">قانوني</span><h1>الشروط والأحكام</h1></div></section><section class="section pt0"><div class="container article-wrap">
<p><strong>آخر تحديث: 3 سبتمبر 2026.</strong> باستخدامك موقع صوتك+ فإنك توافق على هذه الشروط. إذا لم توافق عليها، يرجى عدم استخدام الموقع أو إرسال النماذج المتاحة فيه.</p>
<h2>طبيعة الموقع</h2><p>صوتك+ منصة عربية تنشر محتوى ومراجع عملية حول صناعة المحتوى وبناء الجمهور، وتعرض خدمات ومواد رقمية، وتستقبل الاستفسارات وطلبات التعاون. المحتوى تعليمي ومعلوماتي عام؛ لا يمثل استشارة قانونية أو مالية أو ضمانًا لنتائج تجارية أو نمو أو دخل.</p>
<h2>الحسابات والوصول</h2><p>قد تحتاج إلى إنشاء حساب للوصول إلى مواد رقمية مرتبطة باستحقاقك. أنت مسؤول عن صحة البيانات التي تقدمها وعن الحفاظ على سرية بيانات الدخول الخاصة بك. لا يجوز استخدام حساب شخص آخر أو محاولة تجاوز نظام الوصول أو مشاركة أي مادة محمية خارج ما تسمح به الحقوق المعروضة معها.</p>
<h2>إعلانات المكافأة</h2><p>المواد الثلاث الحالية تُفتح بعد إكمال العدد المعلن من إعلانات المكافأة: 5 إعلانات لدليل البداية، و5 لقوالب صناعة المحتوى، و10 لمسار من الفكرة إلى أول جمهور. رفض الإعلان أو إغلاقه لا يُحتسب ولا يمنع استخدام بقية الموقع.</p>
<h2>لا دفع نقدي</h2><p>لا توجد اشتراكات مدفوعة أو دفع نقدي لفتح المواد الثلاث الحالية، ولا يطلب الموقع بطاقة دفع لذلك. قد تكون الخدمات أو أي تعاون تجاري مستقبلي موضوع اتفاق مستقل ومكتوب بين الأطراف؛ ولا ينشأ أي التزام مالي بمجرد زيارة الموقع أو إرسال نموذج.</p>
<h2>المحتوى والملكية</h2><p>النصوص والهوية والتصميم والمواد الرقمية في صوتك+ محمية بالحقوق المعمول بها. يجوز مشاركة روابط الصفحات العامة مع ذكر المصدر، لكن لا يجوز نسخ المحتوى كاملًا أو إعادة بيعه أو إعادة نشر المواد المحمية أو استخدامها لإيهام الآخرين بأنها من إنتاجك دون إذن مكتوب.</p>
<h2>الخدمات والتعاون</h2><p>إرسال طلب تعاون أو خدمة لا يعني قبوله ولا ينشئ علاقة تعاقدية تلقائية. نراجع الطلبات بحسب ملاءمتها، وقد نطلب معلومات إضافية. لا يبدأ أي عمل أو تسليم أو استخدام تجاري للمحتوى إلا بعد اتفاق منفصل يحدد النطاق والمواعيد والمقابل وحقوق الاستخدام عند الاقتضاء.</p>
<h2>الاستخدام المقبول</h2><p>يُمنع إساءة استخدام النماذج، إرسال محتوى غير قانوني أو مضلل أو مسيء، محاولة الوصول إلى بيانات أو مواد لا تملك صلاحية لها، تعطيل الموقع، أو التحايل على ضوابط إعلانات المكافأة. قد نقيّد الوصول أو نلغي الاستحقاق عند وجود إساءة استخدام أو ضرر أمني، بالقدر الذي يسمح به القانون.</p>
<h2>الروابط والخدمات الخارجية</h2><p>قد يحتوي الموقع على روابط لخدمات خارجية. هذه الخدمات تخضع لشروطها وسياساتها الخاصة، ولا نتحكم في محتواها أو استمرار توفرها. استخدامك لها يكون وفقًا لشروط مزودها.</p>
<h2>الخصوصية والتحديثات</h2><p>تشرح <a href="privacy.html">سياسة الخصوصية</a> طريقة التعامل مع البيانات والكوكيز والإعلانات عند تفعيلها، وهي جزء من هذه الشروط. قد نحدّث الشروط عند تغير الخدمة أو المتطلبات القانونية، ويظهر تاريخ التحديث في أعلى الصفحة. استمرار الاستخدام بعد نشر نسخة محدثة يعني قبولها ضمن الحدود القانونية المطبقة.</p>
<h2>التواصل</h2><p>للاستفسار عن هذه الشروط أو طلب حذف بياناتك أو الإبلاغ عن مشكلة، استخدم <a href="contact.html">صفحة التواصل</a>.</p>
</div></section></main><div id="siteFooter"></div><button class="to-top" id="toTop" aria-label="العودة للأعلى">↑</button><script src="assets/js/pwa.js" defer></script>
</body></html>

