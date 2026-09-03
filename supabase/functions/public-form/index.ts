import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function verifyTurnstile(token: string, ip: string | null) {
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
  if (!secret) return false;

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);
  if (ip) body.set("remoteip", ip);

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    { method: "POST", body },
  );

  const result = await response.json();
  return result?.success === true;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const ip = req.headers.get("cf-connecting-ip");
  const payload = await req.json().catch(() => null);

  if (!payload || typeof payload !== "object") {
    return json({ error: "invalid_json" }, 400);
  }

  const turnstileToken = String(payload.turnstileToken || "");
  if (!(await verifyTurnstile(turnstileToken, ip))) {
    return json({ error: "human_verification_failed" }, 403);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const db = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false },
  });

  const kind = String(payload.kind || "");
  const data = payload.data || {};

  const safe = (value: unknown, max: number) =>
    String(value ?? "").trim().slice(0, max);

  let error = null;

  if (kind === "contact") {
    ({ error } = await db.from("contact_messages").insert({
      name: safe(data.name, 120),
      email: safe(data.email, 254).toLowerCase(),
      subject: safe(data.subject, 200),
      message: safe(data.message, 4000),
    }));
  } else if (kind === "sponsor") {
    ({ error } = await db.from("sponsor_requests").insert({
      company: safe(data.company, 160),
      name: safe(data.name, 120),
      email: safe(data.email, 254).toLowerCase(),
      budget: safe(data.budget, 120) || null,
      type: safe(data.type, 120),
      message: safe(data.message, 4000),
    }));
  } else if (kind === "service") {
    ({ error } = await db.from("service_requests").insert({
      name: safe(data.name, 120),
      email: safe(data.email, 254).toLowerCase(),
      service: safe(data.service, 160),
      budget: safe(data.budget, 120) || null,
      message: safe(data.message, 4000),
    }));
  } else {
    return json({ error: "unknown_kind" }, 400);
  }

  if (error) {
    console.error(error);
    return json({ error: "storage_failed" }, 500);
  }

  return json({ ok: true });
});
