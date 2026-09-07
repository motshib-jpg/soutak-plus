from pathlib import Path
from urllib.parse import urlparse
import re, sys, subprocess, shutil, xml.etree.ElementTree as ET

root = Path(__file__).resolve().parent
errors = []
prod = "https://soutak-plus.vercel.app/"
retired_or_private = {"admin.html", "login.html", "account.html", "product.html", "products.html", "post.html", "404.html"}

all_htmls = list(root.glob("*.html")) + list((root / "articles").glob("*.html"))
verification_htmls = {p for p in all_htmls if re.fullmatch(r"google[a-zA-Z0-9_-]+\.html", p.name)}
htmls = [p for p in all_htmls if p not in verification_htmls]
article_pages = sorted((root / "articles").glob("*.html"))

# Core production artifacts.
for required in ["vercel.json", "robots.txt", "sitemap.xml", "ads.txt", "manifest.webmanifest", ".well-known/security.txt", "assets/images/article-cover.png"]:
    if not (root / required).exists():
        errors.append(f"Missing production artifact: {required}")

if len(article_pages) != 20:
    errors.append(f"Expected exactly 20 public article pages, found {len(article_pages)}")

# HTML integrity, local references, metadata, and production URL hygiene.
for hp in htmls:
    txt = hp.read_text(encoding="utf-8")
    if "<title>" not in txt:
        errors.append(f"{hp}: missing title")
    if hp.name not in retired_or_private and 'name="description"' not in txt:
        errors.append(f"{hp}: missing meta description")
    if hp.name in retired_or_private and hp.name not in {"admin.html", "login.html"} and 'name="robots"' in txt and "noindex" not in txt:
        errors.append(f"{hp}: retired/private page must remain noindex")
    if any(marker in txt for marker in ["YOUR-DOMAIN.example", "motshib-jpg.github.io/soutak-plus", "نسخة تجريبية", "وضع تجريبي"]):
        errors.append(f"{hp}: production placeholder/demo text found")
    if hp.name not in retired_or_private and f'rel="canonical" href="{prod}' not in txt:
        errors.append(f"{hp}: missing production canonical")
    for ref in re.findall(r'(?:src|href)="([^"#?]+)', txt):
        if ref.startswith(("http:", "https:", "mailto:", "tel:", "javascript:", "/api/", "data:")):
            continue
        target = ref.lstrip("/")
        candidate_a = (hp.parent / target).resolve()
        candidate_b = (root / target).resolve()
        if not candidate_a.exists() and not candidate_b.exists():
            errors.append(f"{hp}: missing local reference {ref}")

# Article quality + structured data + social sharing metadata.
app_js = (root / "assets/js/app.js").read_text(encoding="utf-8")
if "article-byline" not in app_js:
    errors.append("Article attribution enhancement is missing from app.js")
for article in article_pages:
    txt = article.read_text(encoding="utf-8")
    plain = re.sub(r"<[^>]+>", " ", txt)
    words = len(re.findall(r"\S+", plain))
    if words < 400:
        errors.append(f"{article.name}: article too short ({words} words)")
    if len(re.findall(r"<h2[ >]", txt)) < 6:
        errors.append(f"{article.name}: insufficient section structure")
    for marker in ["datePublished", "dateModified", '"@type":"Article"', '"image"', '"logo"', 'property="og:image"', 'name="twitter:card"']:
        if marker not in txt:
            errors.append(f"{article.name}: missing article/social marker {marker}")

# Search-engine artifacts.
ads_line = "google.com, pub-2236396092729732, DIRECT, f08c47fec0942fa0"
if (root / "ads.txt").read_text(encoding="utf-8").strip() != ads_line:
    errors.append("ads.txt publisher record is missing or changed")
robots = (root / "robots.txt").read_text(encoding="utf-8")
if f"Sitemap: {prod}sitemap.xml" not in robots:
    errors.append("robots.txt does not advertise production sitemap")

try:
    sitemap_root = ET.parse(root / "sitemap.xml").getroot()
    ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    urls = [n.text.strip() for n in sitemap_root.findall("s:url/s:loc", ns) if n.text]
    if len(urls) != 29:
        errors.append(f"Expected 29 sitemap URLs, found {len(urls)}")
    if len(set(urls)) != len(urls):
        errors.append("Duplicate URLs found in sitemap")
    sitemap_paths = {urlparse(u).path.lstrip("/") for u in urls}
    for bad in retired_or_private:
        if bad in sitemap_paths:
            errors.append(f"Retired/private URL present in sitemap: {bad}")
    article_urls = [u for u in urls if "/articles/" in urlparse(u).path]
    if len(article_urls) != 20:
        errors.append(f"Expected 20 article URLs in sitemap, found {len(article_urls)}")
except Exception as exc:
    errors.append(f"Invalid sitemap.xml: {exc}")

# Google verification files stay machine-readable and tiny.
for vp in verification_htmls:
    txt = vp.read_text(encoding="utf-8")
    if len(txt) > 512 or "google-site-verification:" not in txt:
        errors.append(f"{vp.name}: unexpected verification file content")

# JavaScript syntax.
node = shutil.which("node")
if node:
    for js in (root / "assets/js").glob("*.js"):
        p = subprocess.run([node, "--check", str(js)], capture_output=True, text=True)
        if p.returncode:
            errors.append(f"{js.name}: JS syntax error: {p.stderr.strip()}")

# Public forms must use hardened server-side submission route.
forms = (root / "assets/js/forms.js").read_text(encoding="utf-8")
if "functions/v1/soutak-public-submit" not in forms:
    errors.append("Public forms must use the hardened submission Edge Function")

# Admin remains isolated and MFA/AAL2 protected.
admin = (root / "assets/js/admin.js").read_text(encoding="utf-8")
admin_markers = ["soutak_is_admin", "aal2", "/factors/", "challenge_id", "/token?grant_type=password"]
if any(marker not in admin for marker in admin_markers):
    errors.append("Admin flow must retain password auth, MFA challenge/verify and AAL2 authorization")
login_html = (root / "login.html").read_text(encoding="utf-8")
admin_html = (root / "admin.html").read_text(encoding="utf-8")
if any(x in login_html + admin_html for x in ["cdn.jsdelivr.net", "unpkg.com", "supabase-client.js"]):
    errors.append("Admin/login must not depend on external Supabase SDK CDNs")

# Ad placement safety: content pages may load AdSense; forms/legal/admin/error pages must not.
adsense = "pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"
for fname in ["contact.html", "services.html", "sponsors.html", "privacy.html", "terms.html", "editorial.html", "about.html", "admin.html", "login.html", "account.html", "404.html", "product.html", "products.html", "post.html"]:
    p = root / fname
    if p.exists() and adsense in p.read_text(encoding="utf-8"):
        errors.append(f"{fname}: AdSense must remain disabled on this page")
for p in [root / "index.html", root / "content.html", *article_pages]:
    if adsense not in p.read_text(encoding="utf-8"):
        errors.append(f"{p.relative_to(root)}: eligible content page missing AdSense verification script")

# Rewarded-ads/public-account implementation must not leak back into production main.
retired_files = [
    "assets/js/account.js", "assets/js/reward-gate.js", "assets/js/rewarded-ads.js", "assets/js/store.js",
    "REWARDED_ADS_SETUP.md", "checkout.html", "payment.html", "subscription.html"
]
for retired in retired_files:
    if (root / retired).exists():
        errors.append(f"Retired production file present: {retired}")

# One-time maintenance workflows must self-delete.
for tmp in [".github/workflows/seo-polish.yml", ".github/workflows/contact-polish.yml", ".github/workflows/contact-final.yml", ".github/workflows/qa-run.yml"]:
    if (root / tmp).exists():
        errors.append(f"Temporary workflow still present: {tmp}")

if errors:
    print("QA FAILED")
    for e in errors:
        print("-", e)
    sys.exit(1)

print(f"QA PASSED: {len(htmls)} HTML pages; {len(article_pages)} articles; 29 sitemap URLs; local references, metadata, JS, admin MFA, forms, AdSense scope and retired-feature boundaries verified.")
