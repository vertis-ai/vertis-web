# Authentication Architecture & Okta SSO

## Overview

Vertis Web 2 now shares a single authentication architecture that covers embedded Auth0 login, Okta SSO, and our SSR-aware route protection in TanStack Start. This document captures the complete picture so future work (Hasura, cross-subdomain sessions, tenant rollouts) can lean on a single source of truth.

---

## TanStack Start Authentication Flow (2025)

### Goals

- **Zero flash** between private and public routes, even during SSR or refreshes.
- **Shared tokens** with the legacy Vite app (localStorage is still the source of truth).
- **SSR-safe guards** so Hasura/tRPC loaders can trust `Request` cookies.
- **Okta + Auth0 parity** without duplicating logic per provider.

### Route Protection + Loader Sequence

1. `/_authenticated.beforeLoad` runs on both server and client.  
   - If the guard can see valid tokens (cookies on SSR, localStorage on CSR), we render the private layout immediately.  
   - If the guard runs on the server *without* cookies (e.g., preview domains, first hit after logout), it redirects to `/auth/loading` instead of `/login`.
2. `/auth/loading` shows a full-page loader (styled like the legacy Vertis spinner) and finishes the token check in the browser.  
   - If tokens appear once hydration completes, we push back to the original destination.  
   - If not, we forward to `/login` with the `redirect` search param so users land where they intended after signing in.
3. `/login.beforeLoad` performs the inverse guard: if an authenticated user hits `/login`, we bounce them to `/` (or whatever `redirect` was passed).

This sequence matches TanStack Router’s recommended pattern of short-circuiting layout rendering until auth is known, which is why the redirect flash is gone [TanStack Router – Authenticated Routes](https://tanstack.com/router/v1/docs/framework/react/guide/authenticated-routes).

### Token Storage Model

- `src/lib/auth/tokenStorage.ts` keeps **localStorage as the canonical source** for cross-subdomain alignment with the legacy app.
- On every write we **sync cookies** (domain-scoped) so SSR loaders and `beforeLoad` can read tokens during server renders.
- On SSR the guard only reads cookies; on the client it rehydrates from localStorage and backfills cookies if users arrive from legacy.
- Clearing tokens wipes both storage layers, so logout remains single point of truth.

### Legacy Compatibility & Testing

- Both apps continue to share the same storage keys (`vertis_access_token`, `vertis_user_info`, etc.), so switching between `app.vertis.ai` and `app2.vertis.ai` keeps sessions aligned.
- To test the loader flow, clear cookies only and refresh a protected route: SSR will fall back to `/auth/loading`, then the client will notice existing localStorage tokens and route you back to `/`.
- To test full logout, clear both cookies and localStorage (or use the UI) and verify `/auth/loading` forwards to `/login`.

---

## Okta SSO Implementation

### Security: Callback URL Validation

### 🔒 Security Vulnerability Fixed

**Issue:** Open redirect enabling JWT token theft via unvalidated callback URLs

**Risk:** CRITICAL - Attacker could steal user JWT tokens and fully impersonate users

**Fix:** Domain whitelist with wildcard pattern support

### Validation Logic

All callback URLs are validated against a trusted domain whitelist before use:

```typescript
// Whitelist configured via environment variable:
TRUSTED_CALLBACK_DOMAINS=*.vertis.ai,*.vertis.com,localhost

// Validation:
✅ https://app.vertis.ai → Accepted (matches *.vertis.ai)
✅ https://app2.vertis.ai → Accepted (matches *.vertis.ai)
✅ http://localhost:3000 → Accepted (matches localhost)
❌ https://attacker.com → REJECTED (not in whitelist)
❌ https://vertis.ai.evil.com → REJECTED (typosquatting)
```

**Protection:**
- Prevents JWT token theft
- Prevents open redirect attacks
- Prevents XSS via callback URL
- Logs security rejections for monitoring

---

### Architecture

### Flow Diagram

```
User → Frontend (login page)
         ↓ (form POST with callbackUrl)
Frontend → AWS API Gateway → oktaInitiate Lambda
                               ↓ (redirect to Okta with RelayState)
User → Okta (authentication)
         ↓ (SAML response with RelayState)
Okta → AWS API Gateway → oktaAcs Lambda
                           ↓ (validate, generate JWT)
User ← Frontend (with JWT in hash) ← oktaAcs
```

### Components

1. **Frontend (`useOktaSso` hook)**
   - Creates form with: `email`, `relayState`, `callbackUrl`
   - Submits directly to AWS API Gateway (not through Vite proxy)
   - `callbackUrl` = `window.location.origin` (where user came from)

2. **oktaInitiate Lambda**
   - Validates `callbackUrl` against trusted domain whitelist
   - If trusted, passes through Okta's `RelayState`
   - If untrusted, uses original `relayState` (fallback)

3. **oktaAcs Lambda (callback)**
   - Receives SAML response from Okta
   - Extracts email domain from SAML or RelayState
   - Validates SAML assertion
   - Generates Hasura JWT
   - Validates callback URL again
   - Redirects to trusted URL with JWT in hash fragment

---

### Three Supported Login Flows

#### Flow 1: Okta Dashboard Login

**Trigger:** User logs in directly from Okta dashboard

**Data Flow:**
```
RelayState: undefined
↓
oktaAcs detects missing RelayState
↓
Extracts email domain from SAML: "vertis.ai"
↓
Looks up SSO config: loadConfiguration("vertis.ai") ✅
↓
Validates SAML with domain: "vertis.ai" ✅
↓
Redirect: process.env.FRONTEND_CALLBACK_URL ✅
```

**Result:** User redirected to configured default URL (legacy app)

---

#### Flow 2: Legacy App Login

**Trigger:** User clicks "Continue with Okta" in legacy app

**Data Flow:**
```
Frontend sends: email, relayState (no callbackUrl)
↓
oktaInitiate: safeRelayState = "narin@vertis.ai"
↓
Okta returns: RelayState = "narin@vertis.ai"
↓
oktaAcs detects email in RelayState
↓
Extracts domain: "narin@vertis.ai".split("@")[1] = "vertis.ai"
↓
Looks up SSO config: loadConfiguration("vertis.ai") ✅
↓
Validates SAML with domain: "vertis.ai" ✅
↓
RelayState is not a URL, redirect: FRONTEND_CALLBACK_URL ✅
```

**Result:** User redirected to legacy app (unchanged legacy behavior)

---

#### Flow 3: New App Login

**Trigger:** User clicks "Continue with Okta" in new app (Web 2)

**Data Flow:**
```
Frontend sends: email, relayState, callbackUrl="http://localhost:3000"
↓
oktaInitiate validates callbackUrl against whitelist
  - "localhost" in whitelist? YES ✅
  - safeRelayState = "http://localhost:3000"
↓
Okta returns: RelayState = "http://localhost:3000"
↓
oktaAcs detects URL in RelayState
↓
Extracts domain from SAML: "vertis.ai"
↓
Looks up SSO config: loadConfiguration("vertis.ai") ✅
↓
Validates SAML with domain: "vertis.ai" ✅
↓
Validates callbackUrl against whitelist again
  - "localhost" in whitelist? YES ✅
  - Redirect to: "http://localhost:3000#jwt=..." ✅
```

**Result:** User redirected back to new app with JWT

---

### Configuration

#### Frontend Environment Variables

**File: `Web 2️⃣/.env`**

```bash
# Serverless Backend (required)
VITE_VERTIS_SERVERLESS_BASE_URL=https://xv8ny0pep9.execute-api.us-east-1.amazonaws.com

# Auth0 (required)
VITE_AUTH_0_DOMAIN_URL=your-tenant.us.auth0.com
VITE_AUTH_0_CLIENT_ID=your-client-id

# DO NOT SET (causes issues):
# VITE_API_BASE_URL=...
```

#### Backend Environment Variables

**Configured in: `Serverless 🌐/serverless.yml`**

```yaml
# Development
dev:
  FRONTEND_CALLBACK_URL: https://www.dev.vertis.ai/login/callback
  TRUSTED_CALLBACK_DOMAINS: "*.vertis.ai,*.vertis.com,localhost"

# Staging
staging:
  FRONTEND_CALLBACK_URL: https://www.staging.vertis.ai/login/callback
  TRUSTED_CALLBACK_DOMAINS: "*.vertis.ai,*.vertis.com"

# Production
prod:
  FRONTEND_CALLBACK_URL: https://www.app.vertis.ai/login/callback
  TRUSTED_CALLBACK_DOMAINS: "*.vertis.ai,*.vertis.com"
```

**Variables:**
- `FRONTEND_CALLBACK_URL` - Default fallback for legacy app and Okta dashboard
- `TRUSTED_CALLBACK_DOMAINS` - Comma-separated whitelist with wildcard support

---

### Security Best Practices

### Whitelist Configuration

**Recommended for production:**
```bash
TRUSTED_CALLBACK_DOMAINS=*.vertis.ai,*.vertis.com
```

**Do NOT include:**
- ❌ Wildcard TLD patterns (*.vertis.*)
- ❌ IP addresses unless absolutely necessary
- ❌ `localhost` in production

**For development:**
```bash
TRUSTED_CALLBACK_DOMAINS=*.vertis.ai,*.vertis.com,localhost
```

### Monitoring

**Set up CloudWatch alarms for:**
```
[SECURITY] Rejected callback URL
operation: "untrusted_callback_url"
```

**Alert on:**
- Multiple rejections from same IP (potential attack)
- Rejections of legitimate domains (configuration issue)
- Unusual patterns (investigate)

### Defense in Depth

**Multiple validation layers:**
1. ✅ Frontend sends only origin URL (not full path with params)
2. ✅ Backend validates format (must be valid URL)
3. ✅ Backend validates against whitelist (trusted domains only)
4. ✅ Backend validates AGAIN at redirect time (double-check)
5. ✅ Fallback to default URL if validation fails (safe default)
6. ✅ Security events logged to CloudWatch (monitoring)

---

### Testing

### Security Test Cases

Run these tests after deployment:

**Test 1: Legitimate new app (should work)**
```bash
# From new app at localhost:3000
1. Go to http://localhost:3000/login
2. Click "Continue with Okta"
3. Enter: narin@vertis.ai
4. Login with Okta
5. Should redirect to: http://localhost:3000#jwt=...
```

**Test 2: Malicious callback URL (should reject)**
```bash
# Try to inject malicious URL (attacker scenario)
curl -X POST \
  'https://xv8ny0pep9.execute-api.us-east-1.amazonaws.com/dev/auth/sso/okta/initiate' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'email=narin@vertis.ai' \
  -d 'relayState=narin@vertis.ai' \
  -d 'callbackUrl=https://attacker.com'

# Check logs - should see:
# [SECURITY] Rejected callback URL with untrusted domain: attacker.com
```

**Test 3: Legacy app (should still work)**
```bash
# From legacy app (no callbackUrl)
1. Go to legacy app login
2. Click "Continue with Okta"
3. Login with Okta
4. Should redirect to FRONTEND_CALLBACK_URL
```

---

### Files Modified

### Frontend
- `src/hooks/auth/useOktaSso.ts` - Sends callbackUrl with form submission

### Backend
- `services/sso/oktaInitiate.ts` - Validates and passes through callbackUrl
- `services/sso/oktaAcs.ts` - Validates callback URL before redirect with JWT
- `serverless.yml` - Added TRUSTED_CALLBACK_DOMAINS configuration

### Tests
- `services/sso/__tests__/callbackUrlValidation.test.ts` - Security validation tests

---

### Deployment

```bash
cd "Serverless 🌐"
serverless deploy --stage dev
```

**Verify after deployment:**
1. Check Lambda environment variables include `TRUSTED_CALLBACK_DOMAINS`
2. Test new app login → should redirect correctly
3. Test with malicious URL → should reject and log
4. Check CloudWatch logs for security events

---

## Summary

| Aspect | Status | Notes |
|--------|--------|-------|
| **Security Vulnerability** | ✅ Fixed | Domain whitelist implemented |
| **Backwards Compatibility** | ✅ Maintained | All three flows work |
| **Type Safety** | ✅ Implemented | No `any` types for business logic |
| **Code Quality** | ✅ Clean | Debug logs removed, comments clear |
| **Testing** | ✅ Covered | Security test suite included |
| **Monitoring** | ✅ Configured | Security rejections logged |

**Status: SECURE AND READY FOR PRODUCTION** 🔒🚀

