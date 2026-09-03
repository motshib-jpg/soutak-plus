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
    for ref in re.findall(r'(?:src|href)="([^"#?]+)', txt):
        if ref.startswith(("http:", "https:", "mailto:", "tel:", "javascript:")):
            continue
        if not (root / ref).exists():
            errors.append(f"{hp.name}: missing local reference {ref}")

node = shutil.which("node")
if node:
    for js in (root / "assets/js").glob("*.js"):
        p = subprocess.run([node, "--check", str(js)], capture_output=True, text=True)
        if p.returncode:
            errors.append(f"{js.name}: JS syntax error: {p.stderr.strip()}")

if "YOUR-DOMAIN.example" not in (root / "sitemap.xml").read_text(encoding="utf-8"):
    print("INFO: domain placeholder still present (expected before deployment).")

if errors:
    print("QA FAILED")
    for e in errors:
        print("-", e)
    sys.exit(1)

print(f"QA PASSED: {len(htmls)} HTML pages checked.")
