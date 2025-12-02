/**
 * Hybrid token storage for SSR compatibility with cross-subdomain support
 * 
 * Strategy:
 * - localStorage: PRIMARY source of truth (for cross-subdomain compatibility with legacy app)
 * - Cookies: Synced from localStorage for SSR support (domain: .vertis.com for cross-subdomain)
 * 
 * This ensures:
 * 1. localStorage is the source of truth (legacy app compatibility)
 * 2. Tokens sync to cookies automatically (for SSR data fetching)
 * 3. Cross-subdomain token sharing via cookies (domain: .vertis.com)
 * 4. Hasura RLS works correctly with user-scoped tokens on both server and client
 * 5. User only logs in once, works on both legacy and new app
 * 
 * IMPORTANT: localStorage does NOT work across subdomains. Each subdomain has its own localStorage.
 * However, cookies CAN work across subdomains if domain is set to ".vertis.com"
 * So we sync localStorage → cookies to enable cross-subdomain + SSR support.
 */

// Cookie names
const ACCESS_TOKEN_COOKIE = "vertis_access_token"
const ID_TOKEN_COOKIE = "vertis_id_token"
const USER_INFO_COOKIE = "vertis_user_info"
const TOKEN_EXPIRY_COOKIE = "vertis_token_expiry"

// localStorage keys (for client-side caching)
const ACCESS_TOKEN_KEY = "vertis_access_token"
const ID_TOKEN_KEY = "vertis_id_token"
const TOKEN_EXPIRY_KEY = "vertis_token_expiry"
const USER_INFO_KEY = "vertis_user_info"
const TOKEN_TYPE_KEY = "vertis_token_type"

/**
 * Get cookie value from request headers (server-side) or document.cookie (client-side)
 */
function getCookie(name: string, request?: Request): string | null {
	if (typeof window !== "undefined") {
		// Client-side: parse document.cookie
		const value = `; ${document.cookie}`
		const parts = value.split(`; ${name}=`)
		if (parts.length === 2) {
			return parts.pop()?.split(";").shift() || null
		}
		return null
	}

	// Server-side: parse from request headers
	if (request) {
		const cookieHeader = request.headers.get("cookie")
		if (!cookieHeader) return null

		const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
			const [key, value] = cookie.trim().split("=")
			if (key && value) {
				acc[key] = decodeURIComponent(value)
			}
			return acc
		}, {} as Record<string, string>)

		return cookies[name] || null
	}

	return null
}

/**
 * Set cookie (client-side only)
 * Uses domain: .vertis.com for cross-subdomain support
 */
function setCookie(
	name: string,
	value: string,
	days: number = 7,
): void {
	if (typeof window === "undefined") return

	const expires = new Date()
	expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)

	// Extract domain from current hostname (e.g., app.vertis.com -> .vertis.com)
	const hostname = window.location.hostname
	const domain = hostname.includes(".") ? `.${hostname.split(".").slice(-2).join(".")}` : hostname

	// Set cookie with secure flags and cross-subdomain domain
	document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; domain=${domain}; SameSite=Lax${
		window.location.protocol === "https:" ? "; Secure" : ""
	}`
}

/**
 * Delete cookie (client-side only)
 * Uses same domain as setCookie for proper deletion
 */
function deleteCookie(name: string): void {
	if (typeof window === "undefined") return

	// Reuse setCookie helper with an expired date to ensure consistent domain/path handling
	setCookie(name, "", -1)
}

/**
 * Get access token - works on both server and client
 * 
 * Priority:
 * 1. Server-side: Read from cookies (synced from localStorage)
 * 2. Client-side: Read from localStorage (primary source), sync to cookies if needed
 * 
 * @param request - Request object (server-side only)
 */
export function getAccessToken(request?: Request): string | null {
	// Server-side: Read from cookies (which were synced from localStorage)
	if (typeof window === "undefined" && request) {
		const cookieToken = getCookie(ACCESS_TOKEN_COOKIE, request)
		if (cookieToken) {
			// Validate expiry from cookie
			const expiry = getCookie(TOKEN_EXPIRY_COOKIE, request)
			if (expiry && Date.now() > parseInt(expiry)) {
				return null // Token expired
			}
			return cookieToken
		}
		return null
	}

	// Client-side: Read from localStorage (primary source of truth)
	if (typeof window !== "undefined") {
		const token = localStorage.getItem(ACCESS_TOKEN_KEY)
		const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY)

		if (!token || !expiry) {
			return null
		}

		// Check if token is expired
		if (Date.now() > parseInt(expiry)) {
			clearTokens()
			return null
		}

		// Sync to cookies if not already synced (for SSR and cross-subdomain)
		const cookieToken = getCookie(ACCESS_TOKEN_COOKIE)
		if (cookieToken !== token) {
			// Token in localStorage but not in cookies, sync it
			syncLocalStorageToCookies()
		}

		return token
	}

	return null
}

/**
 * Get ID token - works on both server and client
 * Server: reads from cookies, Client: reads from localStorage (primary)
 */
export function getIdToken(request?: Request): string | null {
	// Server-side: Read from cookies
	if (typeof window === "undefined" && request) {
		return getCookie(ID_TOKEN_COOKIE, request)
	}

	// Client-side: Read from localStorage (primary source)
	if (typeof window !== "undefined") {
		return localStorage.getItem(ID_TOKEN_KEY)
	}

	return null
}

/**
 * Get user info - works on both server and client
 * Server: reads from cookies, Client: reads from localStorage (primary)
 */
export function getUserInfo(request?: Request): unknown | null {
	// Server-side: Read from cookies
	if (typeof window === "undefined" && request) {
		const cookieUserInfo = getCookie(USER_INFO_COOKIE, request)
		if (cookieUserInfo) {
			try {
				return JSON.parse(cookieUserInfo)
			} catch {
				return null
			}
		}
		return null
	}

	// Client-side: Read from localStorage (primary source)
	if (typeof window !== "undefined") {
		const userInfo = localStorage.getItem(USER_INFO_KEY)
		if (!userInfo) return null

		try {
			return JSON.parse(userInfo)
		} catch {
			return null
		}
	}

	return null
}

/**
 * Store tokens - localStorage is PRIMARY, cookies are synced for SSR/cross-subdomain
 * 
 * This ensures:
 * 1. localStorage is the source of truth (legacy app compatibility)
 * 2. Cookies are synced for SSR support and cross-subdomain access
 */
export function storeTokens(data: {
	accessToken: string
	idToken: string
	expiresIn: number
	tokenType: string
	user?: unknown
}): void {
	if (typeof window === "undefined") return

	const { accessToken, idToken, expiresIn, tokenType, user } = data

	// Calculate expiry time
	const expiryTime = Date.now() + expiresIn * 1000
	const expiryDays = Math.ceil(expiresIn / 86400) // Convert seconds to days

	// PRIMARY: Store in localStorage (source of truth, works with legacy app)
	localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
	localStorage.setItem(ID_TOKEN_KEY, idToken)
	localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString())
	localStorage.setItem(TOKEN_TYPE_KEY, tokenType)
	if (user) {
		localStorage.setItem(USER_INFO_KEY, JSON.stringify(user))
	}

	// SYNC: Store in cookies (for SSR and cross-subdomain support)
	setCookie(ACCESS_TOKEN_COOKIE, accessToken, expiryDays)
	setCookie(ID_TOKEN_COOKIE, idToken, expiryDays)
	setCookie(TOKEN_EXPIRY_COOKIE, expiryTime.toString(), expiryDays)
	if (user) {
		setCookie(USER_INFO_COOKIE, JSON.stringify(user), expiryDays)
	}
}

/**
 * Sync localStorage tokens to cookies (for SSR and cross-subdomain support)
 * Called automatically when tokens are read from localStorage but not in cookies
 */
function syncLocalStorageToCookies(): void {
	if (typeof window === "undefined") return

	const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY)
	const idToken = localStorage.getItem(ID_TOKEN_KEY)
	const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY)
	const userInfo = localStorage.getItem(USER_INFO_KEY)

	if (!accessToken || !expiry) return

	const expiryTime = parseInt(expiry)
	const expiryDays = Math.ceil((expiryTime - Date.now()) / (24 * 60 * 60 * 1000))

	if (expiryDays > 0) {
		setCookie(ACCESS_TOKEN_COOKIE, accessToken, expiryDays)
		if (idToken) {
			setCookie(ID_TOKEN_COOKIE, idToken, expiryDays)
		}
		setCookie(TOKEN_EXPIRY_COOKIE, expiry, expiryDays)
		if (userInfo) {
			setCookie(USER_INFO_COOKIE, userInfo, expiryDays)
		}
	}
}

/**
 * Clear tokens from both cookies and localStorage
 */
export function clearTokens(): void {
	if (typeof window === "undefined") return

	// Clear cookies
	deleteCookie(ACCESS_TOKEN_COOKIE)
	deleteCookie(ID_TOKEN_COOKIE)
	deleteCookie(TOKEN_EXPIRY_COOKIE)
	deleteCookie(USER_INFO_COOKIE)

	// Clear localStorage
	localStorage.removeItem(ACCESS_TOKEN_KEY)
	localStorage.removeItem(ID_TOKEN_KEY)
	localStorage.removeItem(TOKEN_EXPIRY_KEY)
	localStorage.removeItem(USER_INFO_KEY)
	localStorage.removeItem(TOKEN_TYPE_KEY)
}

/**
 * Check if user is authenticated - works on both server and client
 */
export function isAuthenticated(request?: Request): boolean {
	const hasToken = getAccessToken(request) !== null
	const hasUserInfo = getUserInfo(request) !== null
	return hasToken && hasUserInfo
}

