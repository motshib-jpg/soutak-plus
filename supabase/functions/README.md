# Edge Functions

## public-form
خيار إنتاجي أقوى للنماذج العامة:
- يتحقق من Cloudflare Turnstile على الخادم.
- يستخدم Service Role داخل Edge Function فقط.
- لا يكشف المفتاح السري للمتصفح.

عند نشره:
- `TURNSTILE_SECRET_KEY` يجب أن يكون Secret على الخادم.
- ضع Site Key العام في الواجهة فقط.
- غيّر CORS من `*` إلى الدومين الفعلي عند الإطلاق.

## payment-webhook
هيكل آمن متعمد لا يؤكد أي دفعة حتى اختيار مزود دفع حقيقي.
يجب التحقق من توقيع Webhook رسميًا قبل تغيير `orders.status` إلى `paid`.
