(() => {
  const fallback = window.SOUTAK_CONFIG || {};
  window.SOUTAK_RUNTIME_CONFIG = window.SOUTAK_RUNTIME_CONFIG || {};

  const supabaseUrl = fallback.supabaseUrl || "";
  const supabasePublishableKey = fallback.supabasePublishableKey || "";
  const enabled = Boolean(supabaseUrl && supabasePublishableKey && window.supabase);
  const sensitivePage = ["admin","login"].includes(document.body?.dataset?.page || "");
  const authStorage = sensitivePage ? window.sessionStorage : window.localStorage;
  const client = enabled ? window.supabase.createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: authStorage,
      storageKey: sensitivePage ? "soutak-admin-auth" : "soutak-user-auth"
    }
  }) : null;
  window.SoutakDB = { enabled, client };

  window.SOUTAK_RUNTIME_READY = fetch("/api/runtime-config", {
    cache: "no-store",
    credentials: "same-origin",
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
