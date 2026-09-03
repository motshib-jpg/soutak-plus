(() => {
  const fallback = window.SOUTAK_CONFIG || {};
  let runtime = {};
  try {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "/api/runtime-config", false);
    xhr.setRequestHeader("Cache-Control", "no-cache");
    xhr.send(null);
    if (xhr.status >= 200 && xhr.status < 300) runtime = JSON.parse(xhr.responseText || "{}");
  } catch (_) {}
  window.SOUTAK_RUNTIME_CONFIG = runtime;

  const supabaseUrl = runtime.supabaseUrl || fallback.supabaseUrl || "";
  const supabasePublishableKey = runtime.supabasePublishableKey || fallback.supabasePublishableKey || "";
  const enabled = Boolean(supabaseUrl && supabasePublishableKey && window.supabase);
  const client = enabled ? window.supabase.createClient(supabaseUrl, supabasePublishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  }) : null;
  window.SoutakDB = { enabled, client };
})();
