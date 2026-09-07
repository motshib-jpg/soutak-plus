import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

const ALLOWED_ORIGINS = new Set([
  "https://soutak-plus.vercel.app",
  "https://soutak-plus-al-shaibani.vercel.app",
  "https://soutak-plus-git-main-al-shaibani.vercel.app"
]);
const EVENTS = new Set(["page_view", "content_tool"]);
const TOOLS = new Set(["clarity", "headline", "brief"]);
const ACTIONS = new Set(["calculate", "build", "copy"]);

function headers(origin = "") {
  const h: Record<string,string> = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store, max-age=0",
    "Pragma": "no-cache",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };
  if (ALLOWED_ORIGINS.has(origin)) h["Access-Control-Allow-Origin"] = origin;
  return h;
}
function reply(origin: string, data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: headers(origin) });
}
function clean(value: unknown, max: number) {
  return String(value ?? "").replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, max);
}
function clientIp(req: Request) {
  const direct = clean(req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || "", 80);
  if (direct) return direct;
  return clean((req.headers.get("x-forwarded-for") || "").split(",")[0], 80);
}
async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2,"0")).join("");
}
function pageType(path: string) {
  if (path === "/" || path === "/index.html") return "home";
  if (path === "/content.html") return "content_hub";
  if (path.startsWith("/articles/") && path.endsWith(".html")) return "article";
  if (path === "/services.html") return "services";
  if (path === "/sponsors.html") return "sponsors";
  if (path === "/contact.html") return "contact";
  return "public_page";
}
function safeReferrerHost(value: unknown) {
  const raw = clean(value, 500);
  if (!raw) return null;
  try {
    const u = new URL(raw);
    return u.hostname.slice(0, 253) || null;
  } catch { return null; }
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin") || "";
  if (!ALLOWED_ORIGINS.has(origin)) return reply(origin, { error: "forbidden_origin" }, 403);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: headers(origin) });
  if (req.method !== "POST") return reply(origin, { error: "method_not_allowed" }, 405);

  const declared = Number(req.headers.get("content-length") || 0);
  if (declared > 4000) return reply(origin, { error: "payload_too_large" }, 413);

  let body: Record<string,unknown>;
  try {
    const raw = await req.text();
    if (new TextEncoder().encode(raw).length > 4000) return reply(origin, { error: "payload_too_large" }, 413);
    body = JSON.parse(raw || "{}");
    if (!body || Array.isArray(body) || typeof body !== "object") throw new Error("shape");
  } catch { return reply(origin, { error: "invalid_request" }, 400); }

  const event = clean(body.event, 40);
  const path = clean(body.path, 300);
  if (!EVENTS.has(event) || !/^\/(?:[A-Za-z0-9._~!$&'()*+,;=:@%\/-]*)$/.test(path)) {
    return reply(origin, { error: "invalid_input" }, 400);
  }

  const metadata: Record<string,string> = { page_type: pageType(path) };
  if (event === "content_tool") {
    const tool = clean(body.tool, 30);
    const action = clean(body.action, 30);
    if (!TOOLS.has(tool) || !ACTIONS.has(action)) return reply(origin, { error: "invalid_input" }, 400);
    metadata.tool = tool;
    metadata.action = action;
  }

  try {
    const salt = SERVICE_ROLE_KEY.slice(-32);
    const ip = clientIp(req);
    const ipHash = ip ? await sha256(`${salt}|analytics-ip|${ip}`) : null;
    const fallbackIdentity = `${origin}|${path}|${new Date().toISOString().slice(0,13)}`;
    const identityHash = ipHash || await sha256(`${salt}|analytics-fallback|${fallbackIdentity}`);
    const { data: allowed, error: rlError } = await admin.rpc("soutak_claim_public_rate_limit", {
      p_action: "analytics",
      p_ip_hash: ipHash,
      p_identity_hash: identityHash,
      p_ip_limit: 100,
      p_identity_limit: 100,
      p_window_seconds: 600
    });
    if (rlError) return reply(origin, { error: "service_unavailable" }, 503);
    if (allowed !== true) return reply(origin, { ok: true, limited: true });

    const { error } = await admin.from("soutak_analytics_events").insert({
      event_name: event,
      path,
      referrer: safeReferrerHost(body.referrer),
      session_id: null,
      metadata
    });
    if (error) return reply(origin, { error: "service_unavailable" }, 503);
    return reply(origin, { ok: true });
  } catch {
    return reply(origin, { error: "service_unavailable" }, 503);
  }
});