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
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const SERVICE_TYPES = new Set([
  "استشارة محتوى",
  "إعداد صفحة صانع محتوى",
  "تحويل معرفة إلى مادة",
  "طلب آخر مرتبط بالمحتوى"
]);
const SPONSOR_TYPES = new Set(["رعاية محتوى", "إعلان أو ذكر", "مراجعة", "حملة", "شراكة"]);
const ACTIONS = new Set(["newsletter","contact","service","sponsor"]);

function baseHeaders(origin = "") {
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
  return new Response(JSON.stringify(data), { status, headers: baseHeaders(origin) });
}

function cleanText(value: unknown, max: number) {
  return String(value ?? "").replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, max);
}

function clientIp(req: Request) {
  const trusted = (req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || "").trim();
  if (trusted) return trusted.slice(0, 80);
  const forwarded = req.headers.get("x-forwarded-for") || "";
  return (forwarded.split(",")[0] || "").trim().slice(0, 80);
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2,"0")).join("");
}

async function claimRateLimit(req: Request, action: string, identity: string) {
  const salt = SERVICE_ROLE_KEY.slice(-32);
  const ip = clientIp(req);
  const identityHash = await sha256(`${salt}|identity|${identity.toLowerCase()}`);
  const ipHash = ip ? await sha256(`${salt}|ip|${ip}`) : null;
  const ipLimit = action === "newsletter" ? 10 : 6;
  const identityLimit = action === "newsletter" ? 4 : 3;
  const { data, error } = await admin.rpc("soutak_claim_public_rate_limit", {
    p_action: action,
    p_ip_hash: ipHash,
    p_identity_hash: identityHash,
    p_ip_limit: ipLimit,
    p_identity_limit: identityLimit,
    p_window_seconds: 600
  });
  if (error) throw new Error("rate_limit_failed");
  return data === true;
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin") || "";
  if (!ALLOWED_ORIGINS.has(origin)) return reply(origin, { error: "forbidden_origin" }, 403);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: baseHeaders(origin) });
  if (req.method !== "POST") return reply(origin, { error: "method_not_allowed" }, 405);

  const declaredLength = Number(req.headers.get("content-length") || 0);
  if (declaredLength > 20_000) return reply(origin, { error: "payload_too_large" }, 413);

  let body: Record<string,unknown>;
  try {
    const raw = await req.text();
    if (new TextEncoder().encode(raw).length > 20_000) return reply(origin, { error: "payload_too_large" }, 413);
    body = JSON.parse(raw || "{}");
    if (!body || Array.isArray(body) || typeof body !== "object") throw new Error("bad_shape");
  } catch {
    return reply(origin, { error: "invalid_request" }, 400);
  }

  if (cleanText(body.website, 200)) return reply(origin, { ok: true });

  const action = cleanText(body.action, 30);
  if (!ACTIONS.has(action)) return reply(origin, { error: "invalid_request" }, 400);

  const email = cleanText(body.email, 254).toLowerCase();
  if (!EMAIL_RE.test(email)) return reply(origin, { error: "invalid_input" }, 400);

  try {
    if (!(await claimRateLimit(req, action, email))) return reply(origin, { error: "too_many_requests" }, 429);

    let error: any = null;
    if (action === "newsletter") {
      const result = await admin.from("soutak_subscribers").upsert({
        email,
        source: "website",
        status: "active",
        consent_at: new Date().toISOString()
      }, { onConflict: "email" });
      error = result.error;
    } else if (action === "contact") {
      const name = cleanText(body.name, 120);
      const subject = cleanText(body.subject, 180);
      const message = cleanText(body.message, 4000);
      if (name.length < 2 || subject.length < 3 || message.length < 20) return reply(origin, { error: "invalid_input" }, 400);
      error = (await admin.from("soutak_contact_messages").insert({ name, email, subject, message, status: "new" })).error;
    } else if (action === "service") {
      const name = cleanText(body.name, 120);
      const service = cleanText(body.service, 160);
      const budget = cleanText(body.budget, 120);
      const message = cleanText(body.message, 4000);
      if (name.length < 2 || !SERVICE_TYPES.has(service) || message.length < 20) return reply(origin, { error: "invalid_input" }, 400);
      error = (await admin.from("soutak_service_requests").insert({ name, email, service, budget: budget || null, message, status: "new" })).error;
    } else if (action === "sponsor") {
      const company = cleanText(body.company, 160);
      const name = cleanText(body.name, 120);
      const type = cleanText(body.type, 120);
      const budget = cleanText(body.budget, 120);
      const message = cleanText(body.message, 4000);
      if (company.length < 2 || name.length < 2 || !SPONSOR_TYPES.has(type) || message.length < 30) return reply(origin, { error: "invalid_input" }, 400);
      error = (await admin.from("soutak_sponsor_requests").insert({ company, name, email, budget: budget || null, type, message, status: "new" })).error;
    }

    if (error) return reply(origin, { error: "service_unavailable" }, 503);
    return reply(origin, { ok: true });
  } catch {
    return reply(origin, { error: "service_unavailable" }, 503);
  }
});