# API Architecture

## Overview

This document clarifies the different APIs used in the Vertis application and how they interact.

## API Types

### 1. Serverless Backend API (External)

**Purpose**: Main backend API for business logic, authentication, and data operations.

**Location**: Separate serverless codebase (`vertis-serverless`)

**Base URL Configuration**:
- Environment Variable: `VITE_API_BASE_URL` or `VITE_VERTIS_SERVERLESS_BASE_URL`
- Dev: `https://api.dev.vertis.ai` (or temporary API Gateway URL)
- Staging: `https://api.staging.vertis.ai`
- Production: `https://api.vertis.ai`

**Key Endpoints**:
- `/auth/sso/okta/initiate` - Okta SSO initiation
- `/auth/sso/okta/acs` - Okta SAML assertion consumer service
- `/scim/v2/*` - SCIM provisioning endpoints
- Other business logic endpoints

**Usage**:
- Called from the frontend (browser) via HTTP requests
- Handles authentication flows (Okta SSO, SAML)
- Provides business logic and data operations
- **Important**: This is NOT part of the TanStack Start web app

### 2. TanStack Start Web App API Routes (Internal)

**Purpose**: API routes within the TanStack Start application for web app-specific functionality.

**Location**: `src/routes/api.*.ts` or `src/routes/api.*.tsx`

**Base URL**: Relative to the web app domain (e.g., `/api/trpc`, `/api/todos`)

**Key Endpoints**:
- `/api/trpc/*` - tRPC endpoints (if using tRPC)
- Other web app-specific API routes

**Usage**:
- Server-side API routes within the TanStack Start app
- Handled by Nitro (the deployment adapter)
- Can be used for web app-specific logic that doesn't need the full serverless backend

### 3. Hasura GraphQL API (External)

**Purpose**: GraphQL API for data queries and mutations.

**Location**: Separate Hasura instance

**Base URL Configuration**:
- Environment Variable: `VITE_HASURA_URL`
- Dev: `https://hasura.dev.vertis.ai`
- Staging: `https://hasura.staging.vertis.ai`
- Production: `https://hasura.vertis.ai`

**Usage**:
- Called from both server-side (SSR) and client-side
- Requires authentication tokens for RLS (Row-Level Security)
- Used for data fetching and mutations

## Important Distinctions

### Okta SSO Flow

The Okta SSO flow uses the **Serverless Backend API**, not the web app API:

1. User enters email on login page
2. Frontend creates a form and POSTs to `${VITE_API_BASE_URL}/auth/sso/okta/initiate`
3. Serverless backend processes the request and redirects to Okta
4. Okta authenticates the user and redirects back to the serverless backend
5. Serverless backend processes the SAML response and redirects to the frontend with tokens

**Key Point**: The form submission in `useOktaSso.ts` must use the full serverless backend URL, not a relative path like `/dev`.

### Environment Variables

```bash
# Serverless Backend API (for Okta SSO, business logic)
VITE_API_BASE_URL=https://api.dev.vertis.ai
# OR
VITE_VERTIS_SERVERLESS_BASE_URL=https://api.dev.vertis.ai

# Hasura GraphQL API
VITE_HASURA_URL=https://hasura.dev.vertis.ai

# Auth0 Configuration
VITE_AUTH_0_DOMAIN_URL=your-domain.auth0.com
VITE_AUTH_0_CLIENT_ID=your-client-id
```

### Common Mistakes

1. **Using relative URLs for serverless backend**: 
   - ❌ Wrong: `/dev/auth/sso/okta/initiate`
   - ✅ Correct: `https://api.dev.vertis.ai/auth/sso/okta/initiate`

2. **Confusing web app API routes with serverless backend**:
   - Web app API routes (`/api/*`) are for TanStack Start app-specific logic
   - Serverless backend API is for business logic and authentication

3. **Missing environment variables**:
   - Always check that `VITE_API_BASE_URL` or `VITE_VERTIS_SERVERLESS_BASE_URL` is set
   - The code will throw a helpful error if missing

## Error Handling

### Serverless Backend Errors

When the serverless backend encounters an error (e.g., during Okta SSO), it redirects back to the frontend with error parameters:

```
/login?error=okta_sso_failed&error_description=Error message&flow=okta&email=user@example.com
```

The login page's `useEffect` hook automatically handles these error parameters and displays them to the user.

### Form Submission Errors

When a form submission fails (e.g., endpoint doesn't exist), the browser may show an error page. To prevent this:

1. Validate API URL configuration before submitting
2. Ensure the serverless backend is running and accessible
3. Check that the endpoint exists in the serverless backend

## Future Considerations

As the application grows, consider:

1. **API Gateway**: Using an API gateway to route requests to the appropriate backend
2. **Service Mesh**: If microservices are introduced
3. **GraphQL Federation**: If multiple GraphQL APIs need to be unified
4. **API Versioning**: For backward compatibility

## References

- Serverless Backend: `vertis-serverless` codebase
- TanStack Start API Routes: [TanStack Start Docs](https://tanstack.com/router/latest/docs/framework/react/guide/api-routes)
- Hasura: [Hasura Docs](https://hasura.io/docs/)



