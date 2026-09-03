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

for needed in [root / "downloads/creator-starter-guide.md", root / "downloads/content-templates.md", root / "downloads/first-audience-roadmap.md"]:
    if not needed.exists() or needed.stat().st_size == 0:
        errors.append(f"Missing or empty resource: {needed.relative_to(root)}")

for forbidden in ["checkout.html", "payment.html", "subscription.html"]:
    if (root / forbidden).exists():
        errors.append(f"Forbidden paid-access file present: {forbidden}")

if not (root / "vercel.json").exists():
    errors.append("vercel.json is required for production hosting")

if errors:
    print("QA FAILED")
    for e in errors:
        print("-", e)
    sys.exit(1)
print(f"QA PASSED: {len(htmls)} HTML pages checked; Vercel production + rewarded policy 5/5/10 verified.")
