// Example only. Never put service-role keys or other secrets in browser code.
// The Supabase publishable key is designed for client-side use and is protected by RLS.
window.SOUTAK_CONFIG = {
  supabaseUrl: "https://YOUR_PROJECT.supabase.co",
  supabasePublishableKey: "sb_publishable_YOUR_PUBLIC_KEY",
  siteUrl: "https://soutak-plus.vercel.app",
  analyticsEnabled: true,
  ads: {
    enabled: false,
    provider: "adsense",
    publisherId: "",
    slots: { header: "", inline: "", footer: "" },
    rewarded: {
      enabled: false,
      provider: "google_ad_manager",
      adUnitPath: ""
    }
  }
};
