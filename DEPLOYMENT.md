# نشر صوتك+

الإنتاج الحالي يعمل على Vercel:

`https://soutak-plus.vercel.app/`

## المصدر
- المستودع: `motshib-jpg/soutak-plus`
- الفرع: `main`
- الموقع Static HTML/CSS/JS ولا يحتاج Build.
- GitHub Actions يشغّل فحوص الجودة والأمان، وVercel ينشر تغييرات `main` تلقائيًا.

## متغيرات الإنتاج
يستخدم Vercel متغيرات Supabase المطلوبة للخدمات الخادمية. لا تضع Service Role Key في ملفات الواجهة أو GitHub.

## بعد أي تعديل
1. تأكد أن `Validate SoutakPlus` = Success.
2. تأكد أن آخر Vercel Production deployment = READY.
3. افحص Runtime Errors.
4. إذا تغيرت صفحات قابلة للفهرسة، حدّث `sitemap.xml` و`lastmod` ثم راقب Search Console.

## صفحات القراءة
المقالات والمكتبة والرئيسية يجب أن تبقى قابلة للعرض دون Supabase SDK. النماذج العامة تستخدم Edge Function عبر `fetch`، والإدارة تستخدم مسار Auth/REST المباشر المحمي بـMFA/AAL2.

## التشغيل المحلي
يمكن استخدام `START_SOUTAK_PLUS.bat` أو خادم HTTP محلي. لا تختبر Service Worker من `file://`.
