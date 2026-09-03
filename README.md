# صوتك+ — SoutakPlus

نسخة إنتاجية أولية متعددة الصفحات لصانع محتوى عربي.

## الموجود الآن
- رئيسية احترافية RTL ومتجاوبة.
- محتوى/مقالات.
- متجر ومنتجات وصفحة منتج.
- تسجيل اهتمام شراء بدون ادعاء دفع.
- خدمات وطلبات خدمات.
- رعايات وطلبات تعاون.
- نموذج تواصل ونشرة بريدية.
- تسجيل دخول ولوحة إدارة عبر Supabase Auth.
- SQL كامل مع RLS وصلاحيات أقل امتيازًا.
- تحليلات صفحة أساسية اختيارية.
- سياسة خصوصية وشروط.
- robots.txt + sitemap.xml + security headers.

## وضع Demo
إذا بقي `assets/js/config.js` بلا مفاتيح، يعمل الموقع في وضع تجريبي.
النماذج لا تدعي أنها أرسلت بيانات فعلًا.

## الربط الحقيقي
1. أنشئ مشروع Supabase مستقلًا.
2. نفذ `database/schema.sql`.
3. أنشئ مستخدم Auth وأضفه إلى `admin_profiles`.
4. ضع Project URL وPublishable Key في `assets/js/config.js`.
5. اختبر RLS قبل النشر.
6. اختر بوابة دفع مناسبة قانونيًا لموقعك وبلدك؛ بعدها أضف Webhook خادمي لتأكيد الدفع.
7. أضف Turnstile/Rate Limiting للنماذج قبل الإطلاق العام.
8. استبدل YOUR-DOMAIN في sitemap وrobots.

## النشر
يمكن نشر الملفات كـ Static HTML على Cloudflare Pages أو Cloudflare Workers Static Assets.
لا تحتاج عملية Build لهذه النسخة.

## V3
- PWA manifest + service worker مع استثناء admin/login وSupabase من الكاش.
- أيقونة SVG.
- Canonical placeholders وSchema.org للصفحة الرئيسية.
- noindex للإدارة وتسجيل الدخول.
- CSP ورؤوس أمان إضافية.
- QA_CHECK.py للتحقق من الملفات والروابط وJavaScript.
- اختبار HTTP محلي للصفحات الأساسية.
