import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const ALLOWED_ORIGINS = new Set([
  "https://soutak-plus.vercel.app",
  "https://soutak-plus-al-shaibani.vercel.app",
  "https://soutak-plus-git-main-al-shaibani.vercel.app"
]);
const ALLOWED_SLUGS = new Set(["creator-starter-guide", "content-templates", "first-audience"]);

function cors(origin: string) {
  const h: Record<string,string> = {
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
    "Cache-Control": "no-store, max-age=0",
    "Pragma": "no-cache",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'"
  };
  if (ALLOWED_ORIGINS.has(origin)) h["Access-Control-Allow-Origin"] = origin;
  return h;
}

function json(origin: string, data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors(origin), "Content-Type": "application/json; charset=utf-8" }
  });
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin") || "";
  if (!ALLOWED_ORIGINS.has(origin)) return json(origin, { error: "forbidden_origin" }, 403);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
  if (req.method !== "POST") return json(origin, { error: "method_not_allowed" }, 405);

  const contentLength = Number(req.headers.get("content-length") || 0);
  if (contentLength > 8192) return json(origin, { error: "payload_too_large" }, 413);

  const authHeader = req.headers.get("authorization") || "";
  const jwt = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!jwt) return json(origin, { error: "auth_required" }, 401);

  const { data: userData, error: userError } = await admin.auth.getUser(jwt);
  const user = userData?.user;
  if (userError || !user) return json(origin, { error: "invalid_session" }, 401);

  let body: Record<string,unknown>;
  try { body = await req.json(); }
  catch { return json(origin, { error: "invalid_json" }, 400); }

  const action = String(body?.action || "").slice(0, 20);
  const slug = String(body?.slug || "").slice(0, 100);
  if (!ALLOWED_SLUGS.has(slug)) return json(origin, { error: "unknown_resource" }, 404);

  const { data: resource, error: resourceError } = await admin
    .from("soutak_protected_resources")
    .select("slug,filename,mime_type,required_ads")
    .eq("slug", slug)
    .single();
  if (resourceError || !resource) return json(origin, { error: "resource_unavailable" }, 404);
  const requiredAds = Number(resource.required_ads || 0);
  if (!Number.isInteger(requiredAds) || requiredAds < 1 || requiredAds > 20) {
    return json(origin, { error: "resource_unavailable" }, 404);
  }

  if (action === "status") {
    const { data: entitlement } = await admin
      .from("soutak_reward_entitlements")
      .select("granted_count,unlocked_at")
      .eq("user_id", user.id)
      .eq("slug", slug)
      .maybeSingle();
    const progress = Math.min(requiredAds, Number(entitlement?.granted_count || 0));
    return json(origin, { slug, progress, required: requiredAds, unlocked: Boolean(entitlement?.unlocked_at) });
  }

  if (action === "start") {
    const { data: entitlement } = await admin
      .from("soutak_reward_entitlements")
      .select("unlocked_at")
      .eq("user_id", user.id)
      .eq("slug", slug)
      .maybeSingle();
    if (entitlement?.unlocked_at) return json(origin, { error: "already_unlocked" }, 409);

    const now = new Date().toISOString();
    const { data: existing } = await admin
      .from("soutak_reward_challenges")
      .select("id,expires_at")
      .eq("user_id", user.id)
      .eq("slug", slug)
      .is("consumed_at", null)
      .gt("expires_at", now)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing?.id) return json(origin, { challengeId: existing.id, expiresAt: existing.expires_at, reused: true });

    await admin.from("soutak_reward_challenges")
      .delete()
      .eq("user_id", user.id)
      .eq("slug", slug)
      .is("consumed_at", null)
      .lte("expires_at", now);

    const { data: challenge, error } = await admin
      .from("soutak_reward_challenges")
      .insert({ user_id: user.id, slug })
      .select("id,expires_at")
      .single();

    if (error || !challenge) {
      const { data: raced } = await admin
        .from("soutak_reward_challenges")
        .select("id,expires_at")
        .eq("user_id", user.id)
        .eq("slug", slug)
        .is("consumed_at", null)
        .gt("expires_at", new Date().toISOString())
        .limit(1)
        .maybeSingle();
      if (raced?.id) return json(origin, { challengeId: raced.id, expiresAt: raced.expires_at, reused: true });
      return json(origin, { error: "challenge_create_failed" }, 500);
    }
    return json(origin, { challengeId: challenge.id, expiresAt: challenge.expires_at });
  }

  if (action === "grant") {
    const challengeId = String(body?.challengeId || "");
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(challengeId)) {
      return json(origin, { error: "invalid_challenge" }, 400);
    }
    const rewardType = body?.rewardType == null ? null : String(body.rewardType).slice(0, 80);
    const n = body?.rewardAmount == null ? null : Number(body.rewardAmount);
    const rewardAmount = n != null && Number.isFinite(n) && n >= 0 && n <= 1000 ? n : null;

    const { data, error } = await admin.rpc("soutak_consume_reward_challenge", {
      p_user_id: user.id,
      p_challenge_id: challengeId,
      p_slug: slug,
      p_reward_type: rewardType,
      p_reward_amount: rewardAmount
    });
    if (error) {
      const m = String(error.message || "");
      const known = [
        "challenge_not_found", "challenge_already_used", "challenge_expired",
        "challenge_too_early", "reward_rate_limited", "unknown_resource", "invalid_request"
      ].find(x => m.includes(x));
      const code = known === "reward_rate_limited" ? 429 : known === "challenge_too_early" ? 409 : 400;
      return json(origin, { error: known || "reward_rejected" }, code);
    }
    const row = data?.[0];
    return json(origin, {
      progress: Number(row?.granted_count || 0),
      required: Number(row?.required_ads || requiredAds),
      unlocked: Boolean(row?.unlocked)
    });
  }

  if (action === "content") {
    const { data: entitlement } = await admin
      .from("soutak_reward_entitlements")
      .select("granted_count,unlocked_at")
      .eq("user_id", user.id)
      .eq("slug", slug)
      .maybeSingle();
    if (!entitlement?.unlocked_at || Number(entitlement.granted_count || 0) < requiredAds) {
      return json(origin, { error: "not_entitled" }, 403);
    }

    const { data: protectedResource, error } = await admin
      .from("soutak_protected_resources")
      .select("filename,mime_type,content")
      .eq("slug", slug)
      .single();
    if (error || !protectedResource) return json(origin, { error: "resource_unavailable" }, 404);

    return json(origin, {
      filename: protectedResource.filename,
      mimeType: protectedResource.mime_type,
      content: protectedResource.content
    });
  }

  return json(origin, { error: "unknown_action" }, 400);
});