# GROUND_TRUTH.md - sauvern-core
## mAIn St. Solutions | sauvern.com
## Owner: Atlas | Last updated: 2026-04-01

---

## WHAT THIS FILE IS

Working ground-truth snapshot for `sauvern-core`.

Use it to recover live marketplace assumptions before editing listings, migrations, or acquire flow behavior.

---

## SERVICE IDENTITY

| Field | Value |
|-------|-------|
| Repo | the-vault-deck/sauvern-core |
| Product | SAUVERN Marketplace |
| Domain | sauvern.com |
| Stack | Python 3.12 / FastAPI / React / Vite |
| Deploy | Dockerfile -> Railway auto-deploy |
| Migrations | Alembic |
| Health endpoint | /health |
| Railway service ID | 2328e2ba |
| Railway config | railway.toml |

---

## WHAT sauvern-core IS

sauvern-core is the marketplace layer. It owns listings, browse surfaces, creator metadata, and the acquire redirect into Soulbolt.

Owns:
- Featured and public marketplace listing queries
- Listing seed/migration history
- Trial/acquire redirect flow
- Admin listing management
- Creator profiles and submission pipeline

Does NOT own:
- User identity
- Product entitlements
- Bolt storage
- Product launch routing inside Soulbolt

---

## CURRENT PLATFORM STATE

| Item | Value |
|------|-------|
| Status | LIVE |
| Strikecoin listing | Seeded and featured |
| Acquire flow | Redirect-based via soulbolt.ai |
| Checkout | Present but not the focus of this rollout |
| Admin tools | Live |
| Ground truth | Committed this session |
| Current main SHA | 56efdee |

---

## KEY FILES

| File | Purpose |
|------|---------|
| main.py | FastAPI app entry |
| start.sh | Alembic upgrade then app startup |
| models.py | Listing and creator models |
| routers/listings.py | Public and featured listing queries |
| routers/trial.py | Trial/acquire routing |
| routers/admin.py | Listing admin endpoints and allowlists |
| frontend/src/pages/Admin.jsx | Admin listing UI |
| migrations/versions/0007_strikecoin_listing.py | Strikecoin listing seed |
| migrations/versions/0008_feature_strikecoin.py | Follow-on migration to feature Strikecoin |

---

## ACQUIRE FLOW

Marketplace listing -> begin trial/acquire -> redirect to:

`https://soulbolt.ai/api/start?product_id=<product_id>`

Operational note:
- Sauvern stores listing metadata including `acquire_url`
- Soulbolt still owns the actual authenticated product launch path after acquire

---

## FEATURED LISTING RULES

The featured marketplace surface depends on the listing query in `routers/listings.py`.

Practical requirements for a row to appear:
- `is_featured = TRUE`
- valid creator join
- listing shape consistent with its listing type

Strikecoin specifically is a trial-style listing and now depends on:
- `product_id = 'strikecoin'`
- `slug = 'strikecoin'`
- `is_featured = TRUE`

---

## MIGRATION HISTORY RELEVANT TO STRIKECOIN

| Revision | Purpose |
|----------|---------|
| 0005 | Add `product_id` field |
| 0006_is_featured | Add featured flag |
| 0007_strikecoin_listing | Add Strikecoin listing metadata and seed listing row |
| 0008_feature_strikecoin | Flip live Strikecoin listing to `is_featured = TRUE` |

Important lessons from tonight:
- `0007` must point to `down_revision = '0006_is_featured'`, not `'0006'`
- The live database still enforced `listings.contact_value NOT NULL`
- The Strikecoin seed must therefore insert a non-null `contact_value`
- Setting `is_featured = FALSE` in the seed hides the listing from the marketplace even if the row exists

---

## STRIKECOIN MARKETPLACE STATE

Strikecoin listing values now expected live:
- `product_id = 'strikecoin'`
- `title = 'Strikecoin'`
- `slug = 'strikecoin'`
- `status = 'ACTIVE'`
- `is_featured = TRUE`
- `acquire_url = 'https://soulbolt.ai/api/start?product_id=strikecoin'`

Launch note:
- Sauvern may store a placeholder `launch_url`
- Soulbolt does not use Sauvern `launch_url` for YOUR TOOLS launch routing

---

## SESSION LOG

### 2026-04-01

- Added Strikecoin listing migration in `0007_strikecoin_listing.py`
- Fixed `0007` parent revision to `0006_is_featured`
- Fixed seed row to satisfy live `contact_value NOT NULL` constraint
- Confirmed `0007` ran in production logs
- Diagnosed missing marketplace appearance to `is_featured = FALSE`
- Updated `0007` for future correctness with `is_featured = TRUE`
- Added `0008_feature_strikecoin.py` to correct the already-applied live row
- Confirmed production upgrade `0007_strikecoin_listing -> 0008_feature_strikecoin`
- Confirmed Strikecoin appears in live featured feed
- Ground truth committed this session

---

## OPEN FLAGS

- If the listings schema changes again, keep seed migrations aligned to live constraints rather than assuming nullable fields
- The missing historical `0001` lineage should still be treated carefully during any full reprovision
