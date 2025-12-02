# Authentication Architecture for TanStack Start (SSR)

## Problem Statement

The original auth implementation was ported from a Vite React app (client-only) and uses `localStorage` for token storage. This doesn't work for SSR because:

1. **localStorage is client-only** - Not accessible during server-side rendering
2. **SSR data fetching needs tokens** - Route loaders and server functions need access to user tokens for Hasura RLS
3. **Performance** - We want to leverage SSR for faster initial page loads with authenticated data

## Solution: Hybrid Cookie + localStorage Strategy

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Token Storage Layer                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐              ┌──────────────┐            │
│  │   Cookies    │              │ localStorage │            │
│  │  (Server +   │              │  (Client     │            │
│  │   Client)    │              │   Only)      │            │
│  └──────┬───────┘              └──────┬───────┘            │
│         │                              │                   │
│         └──────────┬───────────────────┘                   │
│                    │                                       │
│         ┌──────────▼──────────┐                             │
│         │  Unified Token API  │                             │
│         │  (tokenStorage.ts)  │                             │
│         └──────────┬──────────┘                             │
│                    │                                         │
└────────────────────┼─────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
    ┌────▼────┐            ┌─────▼─────┐
    │ Server  │            │  Client   │
    │ (SSR)   │            │ (Browser) │
    └─────────┘            └───────────┘
```

### Storage Strategy

1. **Cookies** (Primary for SSR)
   - Accessible on both server and client
   - Automatically sent with requests
   - Used for server-side route loaders and data fetching
   - Secure flags: `SameSite=Lax`, `Secure` (HTTPS only)

2. **localStorage** (Client-side cache)
   - Faster access for client-side code
   - Fallback if cookies aren't available
   - Used for client-side navigation and components

### Implementation Details

#### Token Storage (`src/lib/auth/tokenStorage.ts`)

- **Unified API**: Single functions that work on both server and client
- **Cookie-first**: Checks cookies first, falls back to localStorage
- **Automatic sync**: When tokens are stored, they're saved to both cookies and localStorage
- **Expiry handling**: Validates token expiry on both storage mechanisms

#### Server-Side Access

In route loaders and server functions:
```typescript
import { getAccessToken } from '@/lib/auth/tokenStorage'

export const Route = createFileRoute('/data')({
  loader: async ({ request }) => {
    const token = getAccessToken(request) // Works on server!
    // Use token for Hasura request with RLS
  }
})
```

#### Client-Side Access

In components and hooks:
```typescript
import { getAccessToken } from '@/lib/auth/tokenStorage'

function MyComponent() {
  const token = getAccessToken() // Works on client!
  // Use token for client-side requests
}
```

### Benefits

1. **SSR Compatibility**: Tokens available during server-side rendering
2. **Hasura RLS**: User-scoped tokens work correctly in server-side data fetching
3. **Performance**: Client-side caching with localStorage for fast access
4. **Security**: Cookies with proper security flags
5. **Backward Compatible**: Existing client-side code continues to work

### Migration Path

1. ✅ Create `tokenStorage.ts` with hybrid storage
2. ⏳ Update `authService.ts` to use new storage functions
3. ⏳ Update route guards to work with cookies on server
4. ⏳ Update Hasura client to use tokens from request context
5. ⏳ Test SSR data fetching with authenticated routes

### Security Considerations

- **Cookie Security**: 
  - `SameSite=Lax` prevents CSRF attacks
  - `Secure` flag ensures HTTPS-only transmission
  - HttpOnly cookies could be added for refresh tokens (future enhancement)

- **Token Expiry**: 
  - Validated on both storage mechanisms
  - Automatic cleanup of expired tokens

- **XSS Protection**: 
  - localStorage is still vulnerable to XSS
  - Cookies provide better protection with SameSite

### Future Enhancements

1. **Refresh Token Strategy**: 
   - Store refresh token in httpOnly cookie
   - Access token in regular cookie/localStorage
   - Automatic token refresh on expiry

2. **Token Rotation**: 
   - Implement token rotation for enhanced security
   - Handle token refresh in middleware

3. **Multi-domain Support**: 
   - Configure cookie domain for subdomain sharing
   - Ensure tokens work across app subdomains

## TanStack Store Analysis

### Can TanStack Store be used for SSR?

**Short Answer: No, TanStack Store is client-side only.**

**Analysis:**
- TanStack Store is an in-memory JavaScript state management library
- It runs in the browser's JavaScript runtime
- Server-side code (Node.js) runs in a completely separate environment
- Server-side route loaders and server functions cannot access client-side store state
- HTTP requests are stateless - the server doesn't have access to client-side JavaScript state

**Conclusion:**
TanStack Store cannot be used to pass tokens to the server. We still need cookies (or another HTTP mechanism) to pass data from client to server.

### Recommended Approach: localStorage + Cookies Hybrid

**Why localStorage is PRIMARY:**
1. **Cross-subdomain compatibility** - Legacy app and new app on different subdomains need to share tokens
2. **Legacy app compatibility** - Existing app uses localStorage, must continue working
3. **Single sign-on** - User logs in once, works on both apps

**Why cookies are needed:**
1. **SSR support** - Server-side route loaders need access to tokens
2. **Cross-subdomain sharing** - Cookies with `domain: .vertis.com` work across subdomains
3. **Automatic sync** - Tokens in localStorage are automatically synced to cookies

### Final Strategy: localStorage-First with Cookie Sync

```
┌─────────────────────────────────────────────────────────────┐
│                    Token Storage Strategy                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. User logs in → Tokens stored in localStorage (PRIMARY)  │
│  2. Tokens automatically synced to cookies (for SSR)        │
│  3. Cookies use domain: .vertis.com (cross-subdomain)       │
│                                                               │
│  Client-side: Read from localStorage (fast, primary)        │
│  Server-side: Read from cookies (synced from localStorage)  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Implementation:**
- `localStorage` is the source of truth (legacy compatibility)
- Cookies are automatically synced when tokens are stored
- Cookies use `domain: .vertis.com` for cross-subdomain support
- Server reads from cookies (which were synced from localStorage)
- Client reads from localStorage (primary) and syncs to cookies if needed

**Benefits:**
- ✅ Works with legacy app (localStorage)
- ✅ Works across subdomains (cookies with domain)
- ✅ Works with SSR (cookies accessible on server)
- ✅ Single sign-on (shared tokens via cookies)
- ✅ Hasura RLS support (tokens available on server)

## Cross-Subdomain Token Sharing

### Requirement
- Legacy app: `app.vertis.com` (or similar subdomain)
- New app: Different subdomain (e.g., `app2.vertis.com`)
- User should only log in once
- Tokens should work on both apps

### Solution
1. **localStorage**: Each subdomain has its own localStorage (NOT shared)
2. **Cookies with domain**: Set cookies with `domain: .vertis.com` to share across subdomains
3. **Sync strategy**: 
   - When user logs in on either app, tokens stored in localStorage
   - Tokens automatically synced to cookies with `domain: .vertis.com`
   - Both apps can read from cookies (cross-subdomain)
   - Legacy app continues using localStorage (no changes needed)

### Cookie Domain Configuration

```typescript
// Extract domain from hostname (e.g., app.vertis.com -> .vertis.com)
const hostname = window.location.hostname
const domain = hostname.includes(".") 
  ? `.${hostname.split(".").slice(-2).join(".")}` 
  : hostname

// Set cookie with cross-subdomain domain
document.cookie = `token=${value}; domain=${domain}; path=/; SameSite=Lax; Secure`
```

This ensures cookies work across:
- `app.vertis.com`
- `app2.vertis.com`
- Any other `*.vertis.com` subdomain

## Implementation Status

1. ✅ Created `tokenStorage.ts` with localStorage-first + cookie sync
2. ⏳ Update `authService.ts` to use new storage functions
3. ⏳ Update route guards to check cookies on server
4. ⏳ Update Hasura client to use tokens from request context
5. ⏳ Test cross-subdomain token sharing
6. ⏳ Test SSR data fetching with authenticated routes
