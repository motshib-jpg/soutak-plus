(() => {
  const fallback = window.SOUTAK_CONFIG || {};
  window.SOUTAK_RUNTIME_CONFIG = window.SOUTAK_RUNTIME_CONFIG || {};

  // Start immediately from the public fallback config so page rendering never waits
  // on a synchronous network request. Runtime values can override optional settings.
  const supabaseUrl = fallback.supabaseUrl || "";
  const supabasePublishableKey = fallback.supabasePublishableKey || "";
  const enabled = Boolean(supabaseUrl && supabasePublishableKey && window.supabase);
  const client = enabled ? window.supabase.createClient(supabaseUrl, supabasePublishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  }) : null;
  window.SoutakDB = { enabled, client };

  window.SOUTAK_RUNTIME_READY = fetch("/api/runtime-config", {
    cache: "no-store",
    headers: { "Accept": "application/json" }
  })
    .then(res => res.ok ? res.json() : {})
    .then(runtime => {
      window.SOUTAK_RUNTIME_CONFIG = runtime && typeof runtime === "object" ? runtime : {};
      return window.SOUTAK_RUNTIME_CONFIG;
    })
    .catch(() => {
      window.SOUTAK_RUNTIME_CONFIG = {};
      return {};
    });
})();
