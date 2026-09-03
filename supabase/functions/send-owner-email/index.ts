import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req: Request) => {
  // This endpoint should not be public in production.
  // Call it from another trusted Edge Function or protect it with a secret/JWT.
  const expected = Deno.env.get("INTERNAL_EMAIL_SECRET");
  const supplied = req.headers.get("x-internal-secret");

  if (!expected || supplied !== expected) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const OWNER_EMAIL = Deno.env.get("OWNER_EMAIL");
  const FROM_EMAIL = Deno.env.get("FROM_EMAIL");

  if (!RESEND_API_KEY || !OWNER_EMAIL || !FROM_EMAIL) {
    return new Response(JSON.stringify({ error: "email_not_configured" }), {
      status: 503,
      headers: { "Content-Type": "application/json" }
    });
  }

  const body = await req.json().catch(() => ({}));
  const subject = String(body.subject || "إشعار من صوتك+").slice(0, 180);
  const text = String(body.text || "").slice(0, 8000);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "User-Agent": "SoutakPlus/1.0",
      "Idempotency-Key": crypto.randomUUID()
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [OWNER_EMAIL],
      subject,
      text
    })
  });

  const result = await response.json().catch(() => ({}));
  return new Response(JSON.stringify(result), {
    status: response.status,
    headers: { "Content-Type": "application/json" }
  });
});
