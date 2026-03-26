# GROUND_TRUTH.md
## sauvern-core | Append-only state log
## Authority: Virgil

---

## 2026-03-26 — SESSION V+1 HANDOFF

### WHAT WAS FIXED THIS SESSION

**TGR entitlement flow — end-to-end:**

1. `soulbolt-v1 account_store.py` — `FREE_PRODUCTS = set()` (empty). Nothing is automatic.
   `PERMANENT_PRODUCTS = {"tgr"}` — acquire via /api/start creates ends_at = 100 years.

2. `soulbolt-v1 api/start.py` — `tgr` added to `ALLOWED_PRODUCTS`. Expired-trial lock
   skipped for PERMANENT_PRODUCTS (they never expire so the lock never applies).

3. `soulbolt-v1 api/account.py` — standard access gate. TGR uses same logic as all
   products. Permanent trial row (ends_at 100y) means get_active_trial always returns,
   trial_active=True, access granted. No special-casing.

4. `soulbolt-v1 frontend/src/App.jsx` — acquire flow split into LAUNCH_ON_ACQUIRE:
   - cantlie: SSO pass-through to cantlie.ai after /api/start (existing behavior)
   - tgr + future products: navigate to /tools after /api/start so user sees new card.
   EntitlementCard: isPermanentTrial = days_remaining > 3650 → shows FREE badge,
   no countdown, no trial language.

5. `sauvern-core frontend/src/pages/Admin.jsx` — two additions:
   - product_id field in CREATE LISTING form (dropdown: cantlie/tgr/ironoak/secondarc/sauvern)
   - MANAGE LISTINGS tab: shows all active listings with product_id status, allows
     patching product_id via PATCH /admin/listings/{id}/product

**Root cause of "TGR goes straight to thisgamerules.ai":**
The TGR listing in the DB was created without product_id (null). ListingDetail.jsx
isTrial check = false → rendered as contact link → opened URL directly.
Fix: MANAGE LISTINGS tab in admin → set product_id = "tgr" on the listing.

### REQUIRED MANUAL STEP (NOT YET DONE)
Go to sauvern.com/admin → MANAGE LISTINGS → find TGR listing → select "tgr" → Set.
This patches product_id on the existing DB record. Until this is done, the TGR
listing in SAUVERN still opens thisgamerules.ai directly instead of the acquire flow.

### FULL ACQUIRE FLOW (confirmed working after manual step above)
1. User clicks TGR listing in SAUVERN → ListingDetail shows "Begin Trial" button
2. handleBeginTrial() → window.location = soulbolt.ai/?acquire=tgr
3. soulbolt App.jsx: /api/start?product_id=tgr fires with Bearer token
4. soulbolt-v1 api/start.py: creates permanent product_trials row (ends_at = 100y)
5. afterAcquire(): navigate("/tools") — user lands on SOULBOLT tools panel
6. THIS GAME RULES card appears with FREE badge + ↗ OPEN
7. User clicks → SSO to thisgamerules.ai/auth?sb_token=...

### SAUVERN-CORE DEPLOY NOTE
sauvern-core had no commits for 20+ hours (Railway auto-deploy only on push).
Admin.jsx push this session triggered a new deploy. Allow ~3 min for build.

### OPEN ITEMS CARRIED FORWARD
- ListingDetail "Begin 14-Day Trial" button copy should be "Add to My Tools" for TGR
- sauvern-core and kgc-core Railway MCP log queries failing this session (list_projects
  and list_services work; deployments/variables/logs all error). Railway token may need
  rotation or re-link.
- GitHub PAT expires 2026-04-15 — rotate before that date
- TGR SSO from soulbolt.ai toolbar (clicking TGR card → thisgamerules.ai) — working
- kgc-core TGR auth 401 on /generate — still unresolved from prior session.
  Backend auth.py calls GET /api/account/access?product=tgr which is wired correctly.
  Suspect: soulbolt-v1 not deployed at time of test, or token issue. Re-test after
  this session's soulbolt-v1 deploys fully.

*Virgil | 2026-03-26 | Session V+1 close*
