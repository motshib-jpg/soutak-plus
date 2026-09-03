window.SOUTAK_CONFIG = {
  supabaseUrl: "https://YOUR_PROJECT.supabase.co",
  supabasePublishableKey: "sb_publishable_YOUR_KEY",
  siteUrl: "https://YOUR-DOMAIN.example",
  analyticsEnabled: true,

  publicFormEndpoint: "https://YOUR_PROJECT.supabase.co/functions/v1/public-form",
  turnstileSiteKey: "YOUR_TURNSTILE_SITE_KEY",

  ads: {
    enabled: true,
    provider: "adsense",
    publisherId: "ca-pub-XXXXXXXXXXXXXXXX",
    slots: {
      header: "1234567890",
      inline: "2345678901",
      footer: "3456789012"
    },

    rewarded: {
      enabled: true,
      provider: "google_ad_manager",
      adUnitPath: "/YOUR_NETWORK_CODE/YOUR_REWARDED_AD_UNIT"
    }
  }
};
