# قاعدة بيانات صوتك+

1. أنشئ مشروع Supabase مستقلًا للموقع.
2. نفّذ `schema.sql` مرة واحدة.
3. أنشئ مستخدم Auth للإدارة.
4. أضف UUID المستخدم إلى `admin_profiles`.
5. انسخ Project URL وPublishable Key إلى `assets/js/config.js`.

مهم:
- لا تضع Service Role Key داخل ملفات الواجهة.
- لا تجعل المتصفح ينشئ طلبات مدفوعة مؤكدة.
- تأكيد الدفع يتم من Webhook خادمي بعد اختيار بوابة دفع مناسبة.
- قبل الإطلاق العام أضف Cloudflare Turnstile أو Rate Limiting للنماذج العامة.
