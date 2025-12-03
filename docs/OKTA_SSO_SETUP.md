# Okta SSO Setup Guide

## Overview

This document explains how Okta SSO authentication works in the Vertis Web 2 application and how to configure it correctly for different environments.

## Architecture

The Okta SSO flow requires a full browser redirect to the serverless backend, which then initiates the SAML authentication flow with Okta. The flow is:

1. User enters email on login page
2. Frontend creates a form and submits it to `/auth/sso/okta/initiate` endpoint
3. Browser redirects to serverless backend
4. Serverless backend initiates SAML flow with Okta
5. User authenticates with Okta
6. Okta redirects back to our callback URL with JWT token
7. Frontend extracts JWT and stores authentication state

## Environment-Specific Behavior

### Development Mode

In **development mode** (`import.meta.env.DEV === true`), the application ALWAYS uses the Vite proxy:

- Frontend URL: `/dev/auth/sso/okta/initiate`
- Vite proxy forwards to serverless backend based on environment configuration
- This matches the legacy app behavior exactly

**Configuration Priority:**
1. `SERVERLESS_URL_LOCAL` - For local serverless offline (e.g., `http://localhost:3001`)
2. `VITE_VERTIS_SERVERLESS_BASE_URL` - For AWS API Gateway (e.g., `https://xv8ny0pep9.execute-api.us-east-1.amazonaws.com`)
3. Fallback: `http://localhost:3001`

### Production Mode

In **production mode**, the application directly hits the serverless backend URL:

- Uses `VITE_API_BASE_URL` or `VITE_VERTIS_SERVERLESS_BASE_URL` environment variable
- Falls back to AWS API Gateway URL if not set

## Environment Variables

Create a `.env` file in the Web 2 project root with the following variables:

```bash
# Auth0 Configuration (required)
VITE_AUTH_0_DOMAIN_URL=your-tenant.us.auth0.com
VITE_AUTH_0_CLIENT_ID=your-auth0-client-id

# Serverless Backend Configuration
# For local development, choose ONE of the following:

# Option 1: Local serverless offline
SERVERLESS_URL_LOCAL=http://localhost:3001

# Option 2: AWS API Gateway (development)
VITE_VERTIS_SERVERLESS_BASE_URL=https://xv8ny0pep9.execute-api.us-east-1.amazonaws.com
```

**Important Notes:**
- Set ONLY ONE serverless URL variable at a time
- The AWS API Gateway URL should NOT include the `/dev` stage suffix
- The Vite proxy handles the stage routing automatically

## Vite Proxy Configuration

The Vite proxy is configured in `vite.config.ts` to handle the `/dev` prefix:

### For AWS API Gateway
- Request: `/dev/auth/sso/okta/initiate`
- Forwarded as: `/dev/auth/sso/okta/initiate` (path preserved)
- Target: `https://xv8ny0pep9.execute-api.us-east-1.amazonaws.com`
- Final URL: `https://xv8ny0pep9.execute-api.us-east-1.amazonaws.com/dev/auth/sso/okta/initiate`

### For Local Serverless Offline
- Request: `/dev/auth/sso/okta/initiate`
- Forwarded as: `/auth/sso/okta/initiate` (path rewritten, `/dev` removed)
- Target: `http://localhost:3001`
- Final URL: `http://localhost:3001/auth/sso/okta/initiate`

The proxy automatically detects which mode to use based on whether the target URL contains `execute-api` (AWS API Gateway indicator).

## Common Issues and Solutions

### Issue 1: "Site can't be reached" error

**Symptom:** When submitting Okta login, browser redirects to a URL that doesn't exist.

**Cause:** Environment variable is set to a non-existent URL (e.g., `https://api.dev.vertis.ai`)

**Solution:**
1. Check your `.env` file
2. Either:
   - Set `VITE_VERTIS_SERVERLESS_BASE_URL` to the correct AWS API Gateway URL: `https://xv8ny0pep9.execute-api.us-east-1.amazonaws.com`
   - OR remove the env variable to use the default Vite proxy with localhost fallback

### Issue 2: Proxy not forwarding requests

**Symptom:** Form submission works, but the serverless backend doesn't receive the request.

**Cause:** Vite dev server proxy is misconfigured or target is unreachable.

**Solution:**
1. Check the Vite dev server console for proxy logs
2. Ensure your serverless backend is running:
   - For local: Start serverless offline on port 3001
   - For AWS: Ensure the API Gateway URL is accessible
3. Verify the `SERVERLESS_URL_LOCAL` or `VITE_VERTIS_SERVERLESS_BASE_URL` is set correctly

### Issue 3: CORS errors

**Symptom:** Browser shows CORS policy errors.

**Cause:** Serverless backend doesn't have CORS headers configured.

**Solution:**
- Ensure the serverless backend includes CORS headers in the `/auth/sso/okta/initiate` endpoint
- The Vite proxy sets `changeOrigin: true` to handle this for development

## Testing

To test the Okta SSO flow:

1. **Start the dev server:**
   ```bash
   pnpm dev
   ```

2. **Verify environment:**
   - Check console logs for `[OKTA SSO] Configuration:` to see which URL is being used
   - Check browser network tab for the form submission

3. **Test the flow:**
   - Navigate to `/login`
   - Click "Continue with Okta"
   - Enter an email address
   - Submit the form
   - Verify the browser redirects to the serverless backend (check network tab)

## Debugging

Enable detailed logging by checking the browser console for:
- `[OKTA SSO]` logs - Shows configuration and form submission details
- `[VITE PROXY]` logs - Shows proxy configuration and request forwarding (in Vite dev server console, not browser)

## Differences from Legacy App

The new implementation differs from the legacy app in the following way:

**Legacy (`useOktaSso.ts`):**
```typescript
const apiBaseUrl = import.meta.env.DEV 
  ? "/dev" 
  : import.meta.env.VITE_API_BASE_URL || "https://api-dev.vertis.com"
```

**New (fixed):**
```typescript
const apiBaseUrl = import.meta.env.DEV
  ? "/dev"
  : import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_VERTIS_SERVERLESS_BASE_URL ||
    "https://xv8ny0pep9.execute-api.us-east-1.amazonaws.com"
```

The key improvement is that the new version:
1. Always uses the proxy in dev mode (consistent with legacy)
2. Provides better fallback URLs
3. Supports both `VITE_API_BASE_URL` and `VITE_VERTIS_SERVERLESS_BASE_URL` for flexibility
4. Has detailed logging for debugging

## Related Files

- `src/hooks/auth/useOktaSso.ts` - Hook for initiating Okta SSO
- `src/routes/login.tsx` - Login page that uses the hook
- `vite.config.ts` - Vite proxy configuration
- `src/hooks/auth/useOktaCallback.ts` - Handles callback from Okta with JWT
- `src/services/authService.ts` - Auth token storage and management
