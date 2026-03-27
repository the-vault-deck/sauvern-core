# GROUND_TRUTH.md — sauvern-core
## mAIn St. Solutions | sauvern.com
## Owner: Atlas | Last updated: 2026-03-26

---

## WHAT THIS FILE IS

Atlas-maintained session log for sauvern-core. Virgil reads this at the start of every session. Atlas writes to it after every session. No other agent writes here.

Read ARCHITECTURE.md in main-st-ops before touching anything.

---

## SERVICE IDENTITY

| Field | Value |
|-------|-------|
| Repo | the-vault-deck/sauvern-core |
| Product | SAUVERN Marketplace |
| Domain | sauvern.com |
| Stack | Python 3.12 / FastAPI / React / Vite |
| Deploy | Dockerfile → Railway auto-deploy |
| Migrations | Alembic (5 files — note: 0001 missing from versions/) |
| Health endpoint | /health (inferred from start.sh pattern) |
| Railway service ID | 2328e2ba |
| Railway config | railway.toml |

---

## WHAT sauvern-core IS

sauvern-core is the marketplace layer. It is stealth infrastructure — not co-branded with SOULBOLT at launch.

Owns:
- Product listings (browse, search, detail pages)
- Acquire flow — "Begin Trial" button → redirects to soulbolt.ai/?acquire=<product_id>
- Checkout (Stripe) — paused pending business paperwork
- Creator profiles and submission pipeline
- Admin UI for listing management

Does NOT own:
- User identity (soulbolt-v1 owns this)
- Entitlements (soulbolt-v1 owns this)
- Bolt storage (cantlie-core owns this)
- Product UIs (each product owns its own)

---

## PRODUCTION STATE — 2026-03-26 (Session V+2 close)

| Item | Value |
|------|-------|
| Latest SHA | 09da5e8 |
| Status | LIVE — sauvern.com functional |
| Listings | Featured listings live |
| Acquire flow | Working end-to-end |
| Checkout | Paused — Stripe intentionally disabled pending paperwork |
| Admin UI | Live — MANAGE LISTINGS tab with PATCH capability |

---

## MIGRATION HISTORY

| # | File | What it does |
|---|------|-------------|
| — | 0001 missing | Not present in versions/ — may have been applied manually |
| 2 | 0002_purchases.py | Purchases table |
| 3 | 0003_listing_fields.py | Additional listing fields |
| 4 | 0004_submission_pipeline.py | Creator submission pipeline |
| 5 | 0005_product_id.py | product_id column on listings |
| 6 | 0006_is_featured.py | is_featured flag on listings |

**WARNING:** 0001 is missing from versions/. If re-provisioning DB from scratch, this gap must be resolved before alembic upgrade head will run clean.

---

## FILE MAP — KEY FILES

| File | Purpose |
|------|---------|
| main.py | FastAPI app entry |
| auth.py | JWT validation |
| database.py | Postgres connection |
| models.py | Listing, Purchase, Creator models |
| schemas.py | Pydantic schemas |
| start.sh | alembic upgrade head → uvicorn on $PORT |
| railway.toml | startCommand = bash start.sh |
| routers/listings.py | GET /listings — browse, detail |
| routers/admin.py | Admin UI — CREATE + MANAGE LISTINGS with PATCH |
| routers/checkout.py | Stripe checkout — currently paused |
| routers/trial.py | Trial acquisition routing |
| routers/creators.py | Creator profiles |
| routers/submissions.py | Submission pipeline |
| registry/SYSTEM_REGISTRY_V2_SAUVERN.json | Product registry |

---

## CRITICAL — LISTING PRODUCT_ID RULE

Every listing MUST have `product_id` set. If `product_id = NULL`:
- ListingDetail renders a contact link instead of the acquire button
- User cannot acquire the product
- Acquire flow is completely broken

Always confirm `product_id` is set after creating or patching a listing. Use Admin UI at sauvern.com/admin → MANAGE LISTINGS to verify and patch if needed.

---

## ACQUIRE FLOW

sauvern.com listing → "Begin Trial" button → redirects to:
`https://soulbolt.ai/?acquire=<product_id>`

soulbolt-v1 handles everything from that point. sauvern-core does not call soulbolt-v1 APIs directly — it redirects.

---

## BRAND RULES

- SAUVERN is stealth — not co-branded with SOULBOLT at launch
- Background: #0f172a, Accent: #38bdf8 (sky blue — NOT cyan #00ffff), Primary text: #e5e7eb
- Never use cyan #00ffff anywhere in frontend

---

## SESSION LOG

### 2026-03-26 — SESSION V+1

**SAUVERN marketplace confirmed live**
- sauvern.com functional with featured listings and ListingDetail pages

**TGR acquire flow fix**
- Root cause: TGR listing had product_id = NULL → contact link rendered instead of acquire button
- Fix: Admin.jsx — added product_id dropdown to CREATE LISTING + new MANAGE LISTINGS tab with PATCH capability
- Philly patched TGR listing via admin UI: product_id = 'tgr'
- Acquire flow confirmed working end-to-end

---

## OPEN BLOCKERS

None confirmed at V+2 close.

---

## CARRY FORWARD

| Priority | Item |
|----------|------|
| P1 | Philly: mAIn St. listings on SAUVERN — content/copy needed |
| P2 | Stripe checkout re-enable — pending business paperwork |
| P3 | 0001 migration gap — document or resolve before any DB reprovision |

---

*Atlas | mAIn St. Solutions | 2026-03-26*
