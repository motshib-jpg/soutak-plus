# صوتك+ — SoutakPlus

موقع عربي RTL لصانع محتوى/علامة شخصية، يعمل كنقطة مركزية للمحتوى والمواد الرقمية والتواصل والرعايات.

## نموذج الفتح المعتمد
لا توجد اشتراكات مدفوعة ولا Checkout ولا دفع نقدي لفتح المواد الرقمية.

المواد الثلاث المعتمدة تفتح حصريًا عبر Rewarded Ads:
- دليل البداية لصانع المحتوى: 5 إعلانات مكافأة مكتملة.
- قوالب صناعة المحتوى: 5 إعلانات مكافأة مكتملة.
- من الفكرة إلى أول جمهور: 10 إعلانات مكافأة مكتملة.

لا يُحتسب الإعلان إلا عند Reward Granted من مزود الإعلان. النقر على الإعلان وحده لا يُحتسب، وإغلاق الإعلان قبل منح المكافأة لا يُحتسب.

## الموجود الآن
- واجهة عربية RTL متجاوبة.
- صفحات المحتوى والمواد الرقمية وصفحة المادة.
- خدمات وتواصل ورعايات ونشرة بريدية.
- تسجيل دخول ولوحة إدارة عبر Supabase Auth عند ربط المشروع.
- Supabase schema + RLS.
- PWA manifest + Service Worker.
- Security headers + CSP.
- Sitemap + robots.txt.
- QA آلي وGitHub Actions للنشر إلى GitHub Pages.
- نظام Rewarded Ads عبر Google Publisher Tag / Google Ad Manager.

## الوضع الحالي للإعلانات
الكود جاهز، لكن عرض الإعلانات الحقيقية يحتاج بيانات Google Ad Manager الرسمية في `assets/js/config.js`:

```js
ads: {
  rewarded: {
    enabled: true,
    provider: "google_ad_manager",
    adUnitPath: "/YOUR_NETWORK_ID/YOUR_REWARDED_UNIT"
  }
}
```

لا تضع بيانات وهمية في الإنتاج. إذا لم يكن المسار مفعّلًا يبقى التقدم معطلًا بدل منح فتح وهمي.

## Supabase
إذا بقي `supabaseUrl` و`supabasePublishableKey` فارغين يعمل الموقع بالمحتوى التجريبي المحلي، بينما النماذج التي تحتاج قاعدة بيانات توضح أنها غير متصلة.

## النشر
الفرع `main` ينشر مباشرة إلى GitHub Pages عبر `.github/workflows/import-site.yml` بعد نجاح فحوصات QA وسياسة 5/5/10.

الرابط المستهدف:
`https://motshib-jpg.github.io/soutak-plus/`
