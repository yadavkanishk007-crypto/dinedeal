# 🧪 DineDeal Security Remediation — Test Cases

> **Total Test Cases**: 78
> **Covers**: 5 CRITICAL + 7 HIGH + 8 MEDIUM fixes
> **Backend URL**: `https://dinedeal-backend-076n.onrender.com`

---

## 🔴 CRITICAL Test Cases

### CRIT-1: Authentication Middleware

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| C1.1 | **No token → 401** | `curl -X POST <URL>/api/payments/create-order -H "Content-Type: application/json" -d '{"amount":100,"type":"restaurant"}'` | `401 { success: false, error: "Missing or malformed Authorization header" }` |
| C1.2 | **Invalid token → 401** | `curl -X POST <URL>/api/payments/create-order -H "Authorization: Bearer fake_token_123" -H "Content-Type: application/json" -d '{"amount":100}'` | `401 { success: false, error: "Invalid or expired token" }` |
| C1.3 | **Expired token → 401** | Use a JWT that has expired (>1hr old) in Authorization header | `401 { error: "Invalid or expired token" }` |
| C1.4 | **Valid token → passes** | Get fresh token via `supabase.auth.getSession()`, use in header | Request reaches the controller, returns normal response |
| C1.5 | **Admin route — customer token → 403** | Authenticate as customer user, call `POST /api/admin/settlements/create` | `403 { error: "Insufficient privileges — admin access required" }` |
| C1.6 | **Admin route — admin token → passes** | Authenticate as admin user, call `GET /api/admin/settlements` | `200` with settlement data |
| C1.7 | **Admin route — no token → 401** | `curl -X POST <URL>/api/admin/payouts/test-id/instant` | `401 { error: "Missing or malformed Authorization header" }` |
| C1.8 | **Notifications — customer → 403** | Auth as customer, call `POST /api/notifications/send` | `403` |
| C1.9 | **Rewards — valid user → 200** | Auth as any user, call `GET /api/rewards/me` | Returns user's reward points |
| C1.10 | **Health check — no auth needed** | `curl <URL>/` | `200 { status: "OK" }` (no auth required) |

**Files validated**: `src/middleware/auth.js`, `src/index.js`

---

### CRIT-1 (Frontend): Auth Token in API Calls

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| C1.11 | **Pay.tsx sends Bearer token** | Open browser DevTools → Network tab, initiate payment on `/pay` page | Fetch to `/api/payments/create-order` includes `Authorization: Bearer <token>` header |
| C1.12 | **DineIn.tsx sends Bearer token** | Open DevTools, click "Pay Now" on dine-in bill | Fetch includes `Authorization: Bearer <token>` header |
| C1.13 | **Expired session → toast error** | Clear Supabase session from localStorage, click Pay | Toast: "Session expired. Please sign in again." — no API call made |
| C1.14 | **Guest blocked (Pay.tsx)** | Navigate to `/pay` without signing in, attempt payment | Toast: "Sign in required" — payment blocked before API call |

**Files validated**: `Pay.tsx`, `DineIn.tsx`

---

### CRIT-2: Server-Side Amount Validation (Restaurant)

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| C2.1 | **Honest amount → order created** | Send `{ amount: 900, billAmount: 1000, type: "restaurant" }` with a 10% offer active | Server recalculates discount=100, final=900, creates Razorpay order |
| C2.2 | **Tampered amount → 400 rejected** | Send `{ amount: 1, billAmount: 1000, type: "restaurant" }` | `400 { message: "Payment amount mismatch..." }` |
| C2.3 | **No offer active → full bill** | Send `{ amount: 1000, billAmount: 1000 }` with no active offers | Server confirms no discount, amount matches, order created |
| C2.4 | **Coupon validated server-side** | Send valid coupon code in `metadata.couponCode`, correct discounted amount | Order created successfully |
| C2.5 | **Fake coupon code → ignored** | Send `{ metadata: { couponCode: "FAKECOUPON" } }` with full bill amount | Coupon not found, server expects full amount, passes if amount matches |
| C2.6 | **Expired coupon → ignored** | Send coupon code with `valid_until` in the past | Coupon ignored, server expects full bill amount |
| C2.7 | **Points redeemed — verified against DB** | User has 500 points, sends `pointsUsed: 500` on ₹1500 bill | Server verifies 500 points exist, calculates ₹50 discount |
| C2.8 | **Points inflated → capped** | User has 100 points, sends `pointsUsed: 9999` | Server caps at 100 actual points, calculates ₹10 discount |
| C2.9 | **Points on bill < ₹1000 → no cashback** | Send `pointsUsed: 500` on ₹800 bill | Server ignores points (min ₹1000 rule), expects full ₹800 |
| C2.10 | **Rounding tolerance (₹1)** | Server calculates ₹899.50, frontend sends ₹900 | Passes (within ₹1 tolerance) |
| C2.11 | **Razorpay order uses server amount** | Tamper `amount` to ₹1, but server calculates ₹900 | Razorpay order created with `amount: 90000` (₹900 × 100 paise) |

**File validated**: `src/controllers/payments.controller.js` (lines 53–195)

---

### CRIT-2: Server-Side Amount Validation (Dine-In)

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| C2.12 | **Honest dine-in → order created** | Restaurant posted ₹2000 bill, user sends `amount: 2000` with no discounts | Order created |
| C2.13 | **Tampered dine-in → 400** | Restaurant posted ₹2000, user sends `amount: 1` | `400 { message: "Payment amount mismatch..." }` |
| C2.14 | **Dine-in with valid coupon** | Coupon gives 15% off on ₹2000 = ₹300 off, user sends `amount: 1700` | Passes validation |
| C2.15 | **Dine-in coupon wrong restaurant** | Coupon belongs to restaurant B, used on restaurant A's bill | Coupon not found for this restaurant, server expects full amount |
| C2.16 | **Dine-in points + coupon combo** | ₹2000 bill, coupon saves ₹200, 500 points saves ₹50, user sends ₹1750 | Passes — server independently calculates same |
| C2.17 | **Transaction not found → 404** | Send fake `transactionId` | `404 { message: "Transaction not found" }` |

**File validated**: `src/controllers/payments.controller.js` (lines 197–315)

---

### CRIT-3: Atomic Rewards (Race Condition)

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| C3.1 | **Single payment → rewards credited** | Complete a ₹1000 payment, check `rewards` table | Points increased by `1000 × 2 = 2000` |
| C3.2 | **Points redeemed → deducted** | Pay with 500 `pointsUsed`, check `rewards.total_redeemed` | `total_redeemed` increased by 500 |
| C3.3 | **RPC called (not read-then-write)** | Check webhook controller code | Uses `supabase.rpc("update_user_rewards", ...)` not `.select()` then `.upsert()` |
| C3.4 | **New user → rewards row created** | First-time user completes payment | New row in `rewards` table with correct `points` and `total_earned` |
| C3.5 | **RPC failure → payment still completes** | Simulate RPC error (e.g., function not created yet) | Transaction status = `completed`, error logged but not thrown |
| C3.6 | **No user_id → rewards skipped** | Webhook fires for a txn where `user_id` is null | No RPC call made, no crash |

**Precondition for C3.1–C3.4**: The `update_user_rewards` SQL function must be created in Supabase.

**File validated**: `src/controllers/webhooks.controller.js` (lines 66–105)

---

### CRIT-4: Webhook Signature Verification

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| C4.1 | **Valid Razorpay webhook → 200** | Razorpay sends real webhook with valid `x-razorpay-signature` | `200 { success: true }` |
| C4.2 | **Forged body → 401** | Send POST to `/api/webhooks/razorpay` with fake body and wrong signature | `401 { success: false }` |
| C4.3 | **Missing signature header → error** | POST without `x-razorpay-signature` header | Error (cannot create Buffer from undefined) → `500` |
| C4.4 | **Uses req.rawBody (not JSON.stringify)** | Code review: line 11 of webhooks.controller.js | `shasum.update(req.rawBody)` — not `JSON.stringify(req.body)` |

**File validated**: `src/controllers/webhooks.controller.js` (lines 7–20)

---

### CRIT-5: Debug Log Removed

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| C5.1 | **No API key in logs** | Start the backend server, check stdout | No line containing `RAZORPAY_KEY_ID` in output |
| C5.2 | **Code review** | Search `index.js` for `console.log.*RAZORPAY` | No matches found |

**File validated**: `src/index.js`

---

## 🟠 HIGH Test Cases

### HIGH-1: Rate Limiting

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| H1.1 | **Payment: 11th request in 1 min → 429** | Send 11 rapid POST requests to `/api/payments/create-order` | First 10 pass, 11th returns `429 { error: "Too many payment attempts" }` |
| H1.2 | **API: 101st request in 15 min → 429** | Send 101 requests to `/api/admin/settlements` | 101st returns `429 { error: "Too many requests..." }` |
| H1.3 | **Webhook: 51st in 1 min → 429** | Send 51 requests to `/api/webhooks/razorpay` | 51st returns `429` |
| H1.4 | **Rate limit headers present** | Check response headers after any API call | Contains `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset` |
| H1.5 | **Health check not rate limited** | Spam `GET /` many times | Always returns `200` |

**File validated**: `src/index.js` (lines 27–49)

---

### HIGH-2: Helmet Security Headers

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| H2.1 | **X-Content-Type-Options** | `curl -I <URL>/` | Response includes `x-content-type-options: nosniff` |
| H2.2 | **X-Frame-Options** | Same as above | Response includes `x-frame-options: SAMEORIGIN` |
| H2.3 | **X-DNS-Prefetch-Control** | Same as above | Header present |
| H2.4 | **X-Powered-By removed** | Same as above | No `X-Powered-By: Express` header |

**File validated**: `src/index.js` (line 25)

---

### HIGH-3: Global Error Handler

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| H3.1 | **Malformed JSON → 400** | `curl -X POST <URL>/api/payments/create-order -H "Content-Type: application/json" -d '{bad json'` | `400 { error: "Invalid JSON body" }` |
| H3.2 | **Server doesn't crash** | Send malformed JSON, then send a valid request | Second request succeeds (server still alive) |

**File validated**: `src/index.js` (lines 107–114)

---

### HIGH-4: Dead `app.js` Deleted

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| H4.1 | **File doesn't exist** | Check `src/app.js` in filesystem | File not found |
| H4.2 | **No imports reference it** | `grep -r "app.js" src/` | No results |

---

### HIGH-5: Single Razorpay Client

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| H5.1 | **controllers/razorpay.js deleted** | Check filesystem | File not found |
| H5.2 | **payouts.controller.js imports from config** | Code review line 1 | `import razorpay from "../config/razorpay.js"` |
| H5.3 | **Payouts still work** | Trigger a payout via admin endpoint | Razorpay API call succeeds |

**File validated**: `src/controllers/payouts.controller.js`

---

### HIGH-6: Guest Payments Blocked

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| H6.1 | **No user → toast shown** | On Pay.tsx, simulate `user = null`, click pay | Toast: "Sign in required" |
| H6.2 | **userId is never "guest"** | Code review Pay.tsx | `userId: user.id` — no `?? "guest"` fallback |

**File validated**: `Pay.tsx` (line 268)

---

### HIGH-7: Rewards Endpoint Auth

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| H7.1 | **No token → 401** | `curl <URL>/api/rewards/me` | `401` |
| H7.2 | **Valid token → returns rewards** | Auth as user with rewards, call `/api/rewards/me` | `200` with `{ points, total_earned, total_redeemed }` |
| H7.3 | **req.user is set by middleware** | Code review rewards.controller.js line 5 | Comment says "req.user is set by requireAuth middleware" |

**File validated**: `src/controllers/rewards.controller.js`

---

## 🟡 MEDIUM Test Cases

### MED-1: Admin Role Signup Blocked

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| M1.1 | **localStorage "admin" → becomes "customer"** | Set `localStorage.setItem("signup_role", "admin")`, complete Google OAuth signup | `user_roles` table shows `role = "customer"`, NOT `admin` |
| M1.2 | **localStorage "super_admin" → becomes "customer"** | Same with "super_admin" | Role = "customer" |
| M1.3 | **"restaurant" role → allowed** | Set `signup_role = "restaurant"`, sign up | Role = "restaurant" ✅ |
| M1.4 | **"customer" role → allowed** | Normal signup | Role = "customer" ✅ |
| M1.5 | **"event_organiser" → allowed** | Set role, sign up | Role = "event_organiser" ✅ |
| M1.6 | **Garbage value → defaults to customer** | Set `signup_role = "hacker_role"` | Role = "customer" |

**File validated**: `src/contexts/AuthContext.tsx` (lines 107–118)

---

### MED-3: 404 Catch-All Route

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| M3.1 | **Unknown frontend route → NotFound** | Navigate to `https://dinedeal.in/some/random/page` | Renders the NotFound component (not blank page) |
| M3.2 | **Known routes still work** | Navigate to `/explore`, `/rewards`, `/profile` | All render correctly |

**File validated**: `src/App.tsx`

---

### MED-5: Invoice PDF Cleanup

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| M5.1 | **PDF deleted after email sent** | Trigger invoice generation, check `tmp/` directory | PDF file removed after email is sent |
| M5.2 | **Cleanup failure → non-fatal** | Make `tmp/` read-only, trigger invoice | Warning logged, no crash |

**File validated**: `src/services/invoice-runner.service.js`

---

### MED-6: Settlement Status Case Fix

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| M6.1 | **Auto-settlement finds transactions** | Create a completed transaction (via webhook), wait for cron | Settlement created with correct `gross_amount` |
| M6.2 | **Code review: correct column** | Check settlement.service.js line 55 | `.eq("payment_status", "completed")` — lowercase, correct column |
| M6.3 | **Previously broken query** | Verify old code used `.eq("status", "COMPLETED")` | Old code no longer present |

**File validated**: `src/services/settlement.service.js`

---

### MED-7: CORS Preflight Fix

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| M7.1 | **Preflight from allowed origin** | `curl -X OPTIONS <URL>/api/payments/create-order -H "Origin: https://dinedeal.in"` | `Access-Control-Allow-Origin: https://dinedeal.in` |
| M7.2 | **Preflight from unknown origin** | `curl -X OPTIONS <URL>/api/payments/create-order -H "Origin: https://evil.com"` | No `Access-Control-Allow-Origin` header (blocked) |
| M7.3 | **Code uses same corsConfig** | Review index.js | `app.use(cors(corsConfig))` and `app.options("*", cors(corsConfig))` — same object |

**File validated**: `src/index.js` (lines 51–64)

---

### MED-8: Duplicate Code Removed

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| M8.1 | **Single setProfiles call** | Code review PostBillToCustomer.tsx lines 119–120 | Only ONE `setProfiles(profilesData)` line |

**File validated**: `src/components/PostBillToCustomer.tsx`

---

### LOW-5: Safe JSON Parse

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| L5.1 | **Corrupted localStorage → no crash** | Set `localStorage.setItem("user_coordinates", "not_json{}")`, reload app | App loads normally, coordinates default to `null` |
| L5.2 | **Valid localStorage → works** | Set valid JSON coords, reload | Coordinates restored correctly |

**File validated**: `src/contexts/LocationContext.tsx`

---

## Quick Smoke Test Checklist

Run these 10 tests to quickly verify the most critical paths:

| # | Test | Command / Action | Pass Criteria |
|---|------|-----------------|---------------|
| 1 | Health check | `curl <URL>/` | `200 OK` |
| 2 | Unauthenticated payment | `curl -X POST <URL>/api/payments/create-order` | `401` |
| 3 | Unauthenticated admin | `curl -X POST <URL>/api/admin/settlements/create` | `401` |
| 4 | Helmet headers | `curl -I <URL>/` | `x-content-type-options` present |
| 5 | CORS blocked | `curl -H "Origin: https://evil.com" -I <URL>/` | No CORS header |
| 6 | Rate limit header | `curl -I <URL>/api/rewards/me` | `RateLimit-*` headers present |
| 7 | Invalid JSON | `curl -X POST <URL>/api/payments/create-order -H "CT: application/json" -d '{bad'` | `400` not `500` |
| 8 | 404 route | `curl <URL>/api/nonexistent` | `404 { error: "Route not found" }` |
| 9 | No debug log | Start server, check output | No `RAZORPAY_KEY_ID` in logs |
| 10 | Frontend 404 | Visit `/random/page` in browser | NotFound page rendered |
