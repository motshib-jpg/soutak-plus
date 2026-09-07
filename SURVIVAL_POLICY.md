# Soutak+ Survival Policy

This file defines the non-negotiable production rules for Soutak+.

## 1. Content-first rule

- Do not publish pages just to increase URL count, keyword coverage, or ad inventory.
- Every new article must have one primary reader intent and a clear reason to exist.
- Every change-sensitive factual pillar page must contain durable official/primary sources where practical.
- Every pillar page must add at least one non-generic value layer: first-party evidence, a worked example, a reusable template, an interactive tool, a decision matrix, or a documented case study.
- Do not change `dateModified` unless the page materially changed.

## 2. Discoverability rule

- Every indexable page must be in `sitemap.xml`.
- Every article must be linked from `content.html` and must receive at least one contextual inbound link from another public content page.
- Every article canonical must also remain present in the RSS discovery feed.
- Public content must remain static/indexable without login, database availability, or client-side rendering.
- Canonicals must use the production origin consistently.
- Search Console tracker remains the authoritative indexing monitor; repeated inspection is diagnostic, not a substitute for quality.
- Google crawling/indexing is an external decision: never represent URL Inspection or repeated inspection as a guaranteed indexing request.

## 3. Production safety rule

- `QA_CHECK.py` and `.github/workflows/import-site.yml` are permanent controls.
- Automatic Vercel deployment from `main` must remain disabled (`git.deploymentEnabled.main=false`).
- A production release is performed only after repository validation succeeds; production rollback remains available through immutable Vercel deployments.
- Permanent CI must fail if the automatic-main freeze is removed.
- Scheduled live monitoring must verify the deployed site, not only repository files.
- Sensitive admin/login routes remain `noindex`, `no-store`, and isolated from third-party SDK CDNs.
- Public reading pages must not regain Supabase SDK/client dependencies.
- Never commit service-role keys, private secrets, or production credentials.

## 4. Monetization rule

- Ads must never become the reason a page exists.
- AdSense code is limited to eligible content surfaces; form, legal, admin, login, error, and retired pages remain ad-free.
- Before activating advertising that requires consent in regulated regions, configure an appropriate Google-certified CMP and verify the live behavior.
- Rewarded-ad code stays outside production main unless a separate policy/privacy/UX review explicitly re-approves it.

## 5. Measurement rule

- First-party analytics collect the minimum operational event data necessary.
- Never transmit Content Lab user-entered text to analytics.
- Respect GPC and DNT in the first-party measurement layer.
- Add new analytics fields only when they answer a concrete operational question.
- Search Console is used for organic discovery/indexing; first-party analytics for on-site usage; GA4 may be added as an additional layer, not a single point of failure.

## 6. Resilience rule

- GitHub is the source of truth for public site code/content.
- Public reading must continue during Supabase outages.
- Keep rollback possible through immutable Vercel deployments.
- Operational database data must have a backup/export process appropriate to the hosting plan once the data becomes material.
- Recovery access for the admin account must be maintained separately from the primary MFA factor.

## 7. Pre-mortem rule

`RISK_REGISTER.md` is the canonical risk inventory. A future pre-mortem must:

1. Re-check every existing risk against fresh evidence.
2. Update severity/status when evidence changes.
3. Add a new risk only when the underlying failure mode is genuinely new.
4. Never duplicate an existing risk under different wording.
5. Distinguish internal fixable risks from external decisions that cannot be guaranteed (Google ranking/indexing, AdSense approval, platform outages, policy changes, demand).

The goal is not the impossible claim of zero risk. The goal is **zero hidden known internal risks and no material risk left without a control, trigger, or explicit accepted limitation.**
