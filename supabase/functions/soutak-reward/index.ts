import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

function cors(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowed = origin === "https://soutak-plus.vercel.app" || /^https:\/\/soutak-plus-[a-z0-9-]+-al-shaibani\.vercel\.app$/.test(origin) || /^https:\/\/soutak-plus-git-[a-z0-9-]+-al-shaibani\.vercel\.app$/.test(origin);
  return {
    "Access-Control-Allow-Origin": allowed ? origin : "https://soutak-plus.vercel.app",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  };
}

function json(req: Request, data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...cors(req), "Content-Type": "application/json; charset=utf-8" } });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });
  if (req.method !== "POST") return json(req, { error: "method_not_allowed" }, 405);

  const authHeader = req.headers.get("authorization") || "";
  const jwt = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!jwt) return json(req, { error: "auth_required" }, 401);

  const { data: userData, error: userError } = await admin.auth.getUser(jwt);
  const user = userData?.user;
  if (userError || !user) return json(req, { error: "invalid_session" }, 401);

  let body: any;
  try { body = await req.json(); } catch { return json(req, { error: "invalid_json" }, 400); }
  const action = String(body?.action || "");
  const slug = String(body?.slug || "");
  const allowedSlugs = new Set(["creator-starter-guide", "content-templates", "first-audience"]);
  if (!allowedSlugs.has(slug)) return json(req, { error: "unknown_resource" }, 404);

  const { data: resource, error: resourceError } = await admin.from("soutak_protected_resources").select("slug,filename,mime_type,required_ads").eq("slug", slug).single();
  if (resourceError || !resource) return json(req, { error: "resource_unavailable" }, 404);

  if (action === "status") {
    const { data: entitlement } = await admin.from("soutak_reward_entitlements").select("granted_count,unlocked_at").eq("user_id", user.id).eq("slug", slug).maybeSingle();
    const progress = Math.min(resource.required_ads, Number(entitlement?.granted_count || 0));
    return json(req, { slug, progress, required: resource.required_ads, unlocked: Boolean(entitlement?.unlocked_at) });
  }

  if (action === "start") {
    const { data: entitlement } = await admin.from("soutak_reward_entitlements").select("granted_count,unlocked_at").eq("user_id", user.id).eq("slug", slug).maybeSingle();
    if (entitlement?.unlocked_at) return json(req, { error: "already_unlocked" }, 409);
    await admin.from("soutak_reward_challenges").delete().eq("user_id", user.id).eq("slug", slug).is("consumed_at", null).lt("expires_at", new Date().toISOString());
    const { data: challenge, error } = await admin.from("soutak_reward_challenges").insert({ user_id: user.id, slug }).select("id,expires_at").single();
    if (error || !challenge) return json(req, { error: "challenge_create_failed" }, 500);
    return json(req, { challengeId: challenge.id, expiresAt: challenge.expires_at });
  }

  if (action === "grant") {
    const challengeId = String(body?.challengeId || "");
    if (!/^[0-9a-f-]{36}$/i.test(challengeId)) return json(req, { error: "invalid_challenge" }, 400);
    const rewardType = body?.rewardType == null ? null : String(body.rewardType).slice(0, 80);
    const rewardAmount = body?.rewardAmount == null ? null : Number(body.rewardAmount);
    const { data, error } = await admin.rpc("soutak_consume_reward_challenge", {
      p_user_id: user.id,
      p_challenge_id: challengeId,
      p_slug: slug,
      p_reward_type: rewardType,
      p_reward_amount: Number.isFinite(rewardAmount) ? rewardAmount : null
    });
    if (error) {
      const m = String(error.message || "");
      const known = ["challenge_not_found","challenge_already_used","challenge_expired","challenge_too_early","unknown_resource"].find(x => m.includes(x));
      return json(req, { error: known || "reward_rejected" }, known === "challenge_too_early" ? 409 : 400);
    }
    const row = data?.[0];
    return json(req, { progress: row?.granted_count || 0, required: row?.required_ads || resource.required_ads, unlocked: Boolean(row?.unlocked) });
  }

  if (action === "content") {
    const { data: entitlement } = await admin.from("soutak_reward_entitlements").select("granted_count,unlocked_at").eq("user_id", user.id).eq("slug", slug).maybeSingle();
    if (!entitlement?.unlocked_at || Number(entitlement.granted_count || 0) < resource.required_ads) return json(req, { error: "not_entitled" }, 403);
    const { data: protectedResource, error } = await admin.from("soutak_protected_resources").select("filename,mime_type,content,required_ads").eq("slug", slug).single();
    if (error || !protectedResource) return json(req, { error: "resource_unavailable" }, 404);
    return json(req, { filename: protectedResource.filename, mimeType: protectedResource.mime_type, content: protectedResource.content });
  }

  return json(req, { error: "unknown_action" }, 400);
});
