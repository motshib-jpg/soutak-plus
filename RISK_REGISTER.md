# Soutak+ Production Risk Register

Last baseline review: 2026-09-07
Production: https://soutak-plus.vercel.app/

This register is the canonical pre-mortem baseline for the production site. New reviews must compare against this file instead of inventing a fresh untracked list. A risk may be added only when there is new evidence, a new dependency, a new feature, or a materially changed external policy.

## Risk scale

- P: probability 1–5
- I: impact 1–5
- Score = P × I
- 20–25 critical, 12–19 high, 6–11 medium, 1–5 low

## Current risks and controls

| ID | Risk | P | I | Status | Preventive control | Early warning / trigger |
|---|---|---:|---:|---|---|---|
| R01 | Google does not discover/index most new URLs | 4 | 5 | EXTERNAL / MONITORED | XML sitemap, robots, canonicals, static HTML, contextual internal links, GSC indexing tracker | Majority of new URLs still unknown/discovered-not-indexed after 2–4 weeks |
| R02 | Organic search visibility remains too low to create traffic | 4 | 5 | EXTERNAL / MONITORED | People-first pillar content, source-backed pages, first-party examples, RSS, Search Console monitoring | Impressions and indexed pages do not trend upward after launch window |
| R03 | Content is technically correct but too generic/reproducible | 3 | 5 | MITIGATING | Pillar pages require official sources plus first-party evidence/templates; editorial policy forbids scaled filler | New article has no original example, tool, template, evidence, or defensible added value |
| R04 | AdSense rejects the site or monetization remains negligible | 3 | 5 | EXTERNAL / MONITORED | Valuable content, content-first layout, ads excluded from legal/form/admin/error pages, ads.txt, transparent policy | AdSense rejection, policy warning, or traffic too low for meaningful monetization |
| R05 | Site depends on only one acquisition channel | 4 | 4 | MITIGATING | RSS feed, email capture, shareable URLs, content designed for reuse on external channels | >80% of meaningful traffic comes from one platform after traffic becomes material |
| R06 | Weak authorship / trust signals | 2 | 4 | MITIGATING | Visible editorial bylines, author organization schema, editorial methodology, correction policy, source lists on factual pillar pages | Readers cannot tell who is responsible for content or how claims were checked |
| R07 | Production change reaches users before validation blocks it | 3 | 5 | PARTIAL / EXTERNAL CONFIG NEEDED | Permanent CI, daily live monitor, Vercel immutable deployments and rollback | main is not protected by required checks / Vercel Deployment Checks not configured |
| R08 | Manual static publishing becomes inconsistent at scale | 3 | 4 | MITIGATED | Dynamic filesystem-derived QA, sitemap parity, internal-link checks, minimum quality invariants | Article count grows while publishing remains manual and QA begins requiring exceptions |
| R09 | Orphan or weakly linked articles reduce discovery | 2 | 4 | MITIGATING | Hub links every article; QA checks contextual inbound links and sitemap parity | Any indexable article has no inbound internal link outside itself |
| R10 | Pages become slow because public reading path regains unnecessary dependencies | 2 | 4 | MITIGATED | Static reading path, no Supabase SDK on articles/hub, CI forbids CDN/runtime regressions | Supabase SDK/runtime config appears on content-consumption pages |
| R11 | Shared/generic social presentation reduces external click-through | 3 | 2 | ACCEPTED / IMPROVE OVER TIME | Accurate OG metadata and consistent brand cover today; article-specific visual assets preferred for pillars | External sharing becomes a material acquisition channel but CTR is weak |
| R12 | No reliable behavioral measurement | 2 | 4 | MITIGATED | Privacy-minimal first-party analytics + GSC; GA4 optional additional layer | Page views occur but there is no usable engagement/conversion signal |
| R13 | Analytics spam poisons decision-making | 2 | 3 | MITIGATED | Allowed origins, strict event/tool allowlists, server-side rate limiting, no user-entered text in events | Sudden impossible event volume or one path dominates unnaturally |
| R14 | Public forms are abused/spammed | 2 | 4 | MITIGATED | Hardened Edge Function, server-side validation and rate limiting, RLS | Submission spike, repeated identities, provider abuse reports |
| R15 | Admin account compromise | 2 | 5 | MITIGATED | Admin allowlist, password auth, MFA, AAL2 authorization, no third-party admin SDK CDN | New/unexpected MFA factor or admin profile, suspicious auth activity |
| R16 | Admin loses sole MFA/recovery access | 2 | 5 | EXTERNAL OPERATIONAL | Keep recovery method securely offline; do not remove the verified factor without replacement | Only one verified factor and no tested recovery path |
| R17 | Supabase password leak protection remains unavailable on current plan | 2 | 3 | ACCEPTED PLAN LIMIT | Public readers have no accounts; admin uses MFA/AAL2 | Supabase plan changes or public user auth is reintroduced |
| R18 | Archived rewarded-ad infrastructure is accidentally restored | 1 | 4 | MITIGATED | Reward UI/runtime removed from main, retired-file assertions in QA, archived separately | reward-gate/account/store/rewarded-ad runtime reappears in main |
| R19 | Ad consent requirements are missed after ads become active | 2 | 5 | EXTERNAL CONFIG TRIGGER | Privacy policy documents CMP intent; enable Google-certified CMP before relevant personalized ads | AdSense approved/activated for EEA/UK/Switzerland traffic without CMP configuration |
| R20 | Hosting/platform outage | 1 | 5 | EXTERNAL / RECOVERABLE | GitHub is source of truth, Vercel rollback, static architecture minimizes compute dependency | Vercel outage or repeated 5xx from production |
| R21 | Database/Edge Function outage breaks reading experience | 1 | 4 | MITIGATED | Public reading is static; DB only affects forms/admin/analytics | Supabase outage causes article or hub rendering failure (should never happen) |
| R22 | Database data loss | 2 | 5 | PARTIAL / EXTERNAL OPERATION | Git source protects code/content; operational DB data needs periodic export/backup appropriate to plan | Subscriber/request counts change unexpectedly or restore is needed |
| R23 | Canonical/robots/sitemap drift | 1 | 5 | MITIGATED | QA derives expected URLs from filesystem; scheduled live monitor; short crawler-file cache | Sitemap count differs from public pages, canonical mismatch, robots blocks public paths |
| R24 | Broken links/assets after edits | 1 | 4 | MITIGATED | QA validates local references; scheduled live crawl validates HTTP status | CI/live monitor reports missing reference or non-2xx public URL |
| R25 | Search/AdSense policy changes | 3 | 4 | EXTERNAL / MONITORED | Prefer official sources, documented policy baseline, avoid hacks or scaled content | New Google policy materially affects site, ads, consent, or indexing |
| R26 | Content becomes stale | 3 | 3 | MITIGATING | dateModified discipline, source-backed pillar pages, quarterly review of change-sensitive pages | Official source changes while article still presents old behavior as current |
| R27 | A custom-domain migration later causes SEO loss | 2 | 4 | ACCEPTED UNTIL DOMAIN OWNED | Keep URLs stable; when a custom domain is acquired, use one migration with permanent redirects and GSC change controls | Decision to leave vercel.app after significant traffic/backlinks accumulate |
| R28 | External links/sources disappear | 2 | 2 | MITIGATING | Prefer durable first-party official documentation; keep core answer self-contained | Source returns 404 or changes meaning materially |
| R29 | Security header/CSP regression | 1 | 5 | MITIGATED | CI asserts HSTS, CSP, frame protection and no-store sensitive routes | Header missing in live response or CI failure |
| R30 | Secret accidentally committed | 1 | 5 | MITIGATED | CI scans known secret patterns; service-role secret remains server-side | Secret scan failure or credential exposure alert |
| R31 | Service worker serves stale production assets | 1 | 3 | MITIGATED | Versioned cache, no-store service worker response, retired runtime excluded | Live source differs from browser cache across version change |
| R32 | Content duplication/cannibalization grows | 2 | 4 | MITIGATING | One clear intent per article; no scaled keyword variants; future GSC cannibalization review | Multiple pages start ranking for same query with weak differentiation |
| R33 | External sharing has low CTR because visuals are generic | 3 | 2 | OPEN IMPROVEMENT | Pillar-specific inline visuals and accurate titles; add dedicated social images when distribution justifies it | Social impressions grow but outbound CTR remains weak |
| R34 | Business value remains zero despite traffic | 3 | 4 | MITIGATING | Clear service/sponsor/contact paths, newsletter, content tools; track conversions once traffic is meaningful | Visits grow but subscribers/requests stay at zero for sustained period |

## Irreducible external risks

No engineering change can guarantee zero probability for Google indexing/ranking decisions, AdSense approval, platform outages, algorithm changes, third-party policy changes, or user demand. The project goal is therefore: **no silent internal single point of failure, every material external risk monitored, and every known trigger mapped to a response.**

## Review rule

Before adding a new risk in a future pre-mortem, first check whether it is already represented here. If it is the same underlying failure mode, update its evidence/control instead of creating a duplicate. Add a new ID only for a genuinely new failure mode introduced by a new feature, dependency, external rule, or observed incident.
