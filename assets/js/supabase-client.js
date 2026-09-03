(() => {
  const c = window.SOUTAK_CONFIG || {};
  const enabled = Boolean(c.supabaseUrl && c.supabasePublishableKey && window.supabase);
  const client = enabled ? window.supabase.createClient(c.supabaseUrl, c.supabasePublishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  }) : null;
  window.SoutakDB = { enabled, client };
})();
