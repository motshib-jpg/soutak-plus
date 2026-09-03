from pathlib import Path
import re, sys, subprocess, shutil

root = Path(__file__).resolve().parent
errors = []
htmls = list(root.glob("*.html"))
if not htmls:
    errors.append("No HTML files found.")

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
    for ref in re.findall(r'(?:src|href)="([^"#?]+)', txt):
        if ref.startswith(("http:", "https:", "mailto:", "tel:", "javascript:", "/api/")):
            continue
        target = ref.lstrip("/")
        if not (root / target).exists():
            errors.append(f"{hp.name}: missing local reference {ref}")

node = shutil.which("node")
if node:
    for js in (root / "assets/js").glob("*.js"):
        p = subprocess.run([node, "--check", str(js)], capture_output=True, text=True)
        if p.returncode:
            errors.append(f"{js.name}: JS syntax error: {p.stderr.strip()}")

store = (root / "assets/js/store.js").read_text(encoding="utf-8")
gate = (root / "assets/js/reward-gate.js").read_text(encoding="utf-8")
ads = (root / "assets/js/rewarded-ads.js").read_text(encoding="utf-8")
for marker in ['"creator-starter-guide":5','"content-templates":5','"first-audience":10']:
    if marker not in store.replace(" ", "") or marker not in gate.replace(" ", ""):
        errors.append(f"Reward policy missing or inconsistent: {marker}")
if "rewardedSlotGranted" not in ads:
    errors.append("Rewarded ads must grant progress only from rewardedSlotGranted")
if "localStorage" in gate:
    errors.append("reward-gate.js must not trust localStorage for entitlement")
if "functions/v1/soutak-reward" not in gate:
    errors.append("reward-gate.js must use the server-side reward function")

for forbidden_resource in ["downloads/creator-starter-guide.md", "downloads/content-templates.md", "downloads/first-audience-roadmap.md"]:
    if (root / forbidden_resource).exists():
        errors.append(f"Protected resource must not be public: {forbidden_resource}")

for forbidden in ["checkout.html", "payment.html", "subscription.html"]:
    if (root / forbidden).exists():
        errors.append(f"Forbidden paid-access file present: {forbidden}")

if not (root / "vercel.json").exists():
    errors.append("vercel.json is required for production hosting")
if not (root / "account.html").exists() or not (root / "assets/js/account.js").exists():
    errors.append("User account flow is required for server-bound reward entitlement")

if errors:
    print("QA FAILED")
    for e in errors:
        print("-", e)
    sys.exit(1)
print(f"QA PASSED: {len(htmls)} HTML pages checked; server-side reward entitlement + 5/5/10 verified.")
