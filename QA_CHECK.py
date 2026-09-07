from pathlib import Path
import re, sys, subprocess, shutil

root = Path(__file__).resolve().parent
errors = []
all_htmls = list(root.glob("*.html"))
# Search Console verification files are exact machine-readable artifacts, not site pages.
verification_htmls = {p for p in all_htmls if re.fullmatch(r"google[a-zA-Z0-9_-]+\.html", p.name)}
htmls = [p for p in all_htmls if p not in verification_htmls]
if not htmls:
    errors.append("No HTML pages found.")

for hp in htmls:
    txt = hp.read_text(encoding="utf-8")
    if "<title>" not in txt:
        errors.append(f"{hp.name}: missing title")
    if 'name="description"' not in txt:
        errors.append(f"{hp.name}: missing meta description")
    if "YOUR-DOMAIN.example" in txt or "motshib-jpg.github.io/soutak-plus" in txt:
        errors.append(f"{hp.name}: production URL placeholder found")
    if "وضع تجريبي" in txt or "نسخة تجريبية" in txt:
        errors.append(f"{hp.name}: demo text found")
    if hp.name not in {"admin.html", "login.html", "account.html", "404.html"} and 'rel="canonical" href="https://soutak-plus.vercel.app/' not in txt:
        errors.append(f"{hp.name}: missing production canonical")
    for ref in re.findall(r'(?:src|href)="([^"#?]+)', txt):
        if ref.startswith(("http:", "https:", "mailto:", "tel:", "javascript:", "/api/")):
            continue
        target = ref.lstrip("/")
        if not (root / target).exists():
            errors.append(f"{hp.name}: missing local reference {ref}")

# Verification artifacts must remain tiny and must not accidentally become content pages.
for vp in verification_htmls:
    txt = vp.read_text(encoding="utf-8")
    if len(txt) > 512 or "google-site-verification:" not in txt:
        errors.append(f"{vp.name}: unexpected verification file content")

node = shutil.which("node")
if node:
    for js in (root / "assets/js").glob("*.js"):
        p = subprocess.run([node, "--check", str(js)], capture_output=True, text=True)
        if p.returncode:
            errors.append(f"{js.name}: JS syntax error: {p.stderr.strip()}")

store = (root / "assets/js/store.js").read_text(encoding="utf-8")
gate = (root / "assets/js/reward-gate.js").read_text(encoding="utf-8")
ads = (root / "assets/js/rewarded-ads.js").read_text(encoding="utf-8")
display_ads = (root / "assets/js/ads.js").read_text(encoding="utf-8")
forms = (root / "assets/js/forms.js").read_text(encoding="utf-8")
admin = (root / "assets/js/admin.js").read_text(encoding="utf-8")
for marker in ['"creator-starter-guide":5','"content-templates":5','"first-audience":10']:
    if marker not in store.replace(" ", "") or marker not in gate.replace(" ", ""):
        errors.append(f"Reward policy missing or inconsistent: {marker}")
if "rewardedSlotGranted" not in ads:
    errors.append("Rewarded ads must grant progress only from rewardedSlotGranted")
if "localStorage" in gate:
    errors.append("reward-gate.js must not trust localStorage for entitlement")
if "functions/v1/soutak-reward" not in gate:
    errors.append("reward-gate.js must use the server-side reward function")
if "functions/v1/soutak-public-submit" not in forms:
    errors.append("Public forms must use the hardened submission Edge Function")
admin_markers = ["soutak_is_admin", "aal2", "/factors/", "challenge_id", "/token?grant_type=password"]
if any(marker not in admin for marker in admin_markers):
    errors.append("Admin flow must require direct password auth, MFA challenge/verify, and AAL2 authorization")
login_html = (root / "login.html").read_text(encoding="utf-8")
admin_html = (root / "admin.html").read_text(encoding="utf-8")
if any(x in login_html + admin_html for x in ["cdn.jsdelivr.net", "unpkg.com", "supabase-client.js"]):
    errors.append("Admin/login must not depend on external Supabase SDK CDNs")
if "مساحة إعلانية تجريبية" in display_ads or "مزود الإعلانات غير مهيأ" in display_ads:
    errors.append("Display ad code must not render demo or configuration placeholders")

for forbidden_resource in ["downloads/creator-starter-guide.md", "downloads/content-templates.md", "downloads/first-audience-roadmap.md"]:
    if (root / forbidden_resource).exists():
        errors.append(f"Protected resource must not be public: {forbidden_resource}")

for forbidden in ["checkout.html", "payment.html", "subscription.html", "database/schema.sql"]:
    if (root / forbidden).exists():
        errors.append(f"Forbidden production file present: {forbidden}")

if not (root / "vercel.json").exists():
    errors.append("vercel.json is required for production hosting")
if not (root / "account.html").exists() or not (root / "assets/js/account.js").exists():
    errors.append("User account flow is required for server-bound reward entitlement")

if errors:
    print("QA FAILED")
    for e in errors:
        print("-", e)
    sys.exit(1)
print(f"QA PASSED: {len(htmls)} HTML pages checked; verification artifacts preserved; direct REST admin MFA + server-side reward entitlement + 5/5/10 verified.")
