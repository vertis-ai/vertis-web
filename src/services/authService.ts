import { auth0Client, type AuthResult, type User } from "../config/auth0Client"

// Token storage keys
const ACCESS_TOKEN_KEY = "vertis_access_token"
const ID_TOKEN_KEY = "vertis_id_token"
const TOKEN_EXPIRY_KEY = "vertis_token_expiry"
const USER_INFO_KEY = "vertis_user_info"
const TOKEN_TYPE_KEY = "vertis_token_type"

// Token Management Functions
function storeTokens(result: AuthResult): void {
	if (typeof window === "undefined") {
		return
	}

	const { accessToken, idToken, expiresIn, tokenType, user } = result

	// Calculate expiry time
	const expiryTime = Date.now() + expiresIn * 1000

	// Store tokens
	localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
	localStorage.setItem(ID_TOKEN_KEY, idToken)
	localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString())
	localStorage.setItem(TOKEN_TYPE_KEY, tokenType)

	// Store user info
	if (user) {
		localStorage.setItem(USER_INFO_KEY, JSON.stringify(user))
	}
}

function getAccessToken(): string | null {
	if (typeof window === "undefined") {
		return null
	}

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

	return token
}

function getIdToken(): string | null {
	if (typeof window === "undefined") {
		return null
	}
	return localStorage.getItem(ID_TOKEN_KEY)
}

function getUserInfo(): User | null {
	if (typeof window === "undefined") {
		return null
	}

	const userInfo = localStorage.getItem(USER_INFO_KEY)
	if (!userInfo) return null

	try {
		const result = JSON.parse(userInfo) as User
		return result
	} catch {
		return null
	}
}

function clearTokens(): void {
	if (typeof window === "undefined") {
		return
	}
	localStorage.removeItem(ACCESS_TOKEN_KEY)
	localStorage.removeItem(ID_TOKEN_KEY)
	localStorage.removeItem(TOKEN_EXPIRY_KEY)
	localStorage.removeItem(USER_INFO_KEY)
	localStorage.removeItem(TOKEN_TYPE_KEY)
}

// Auth0 Embedded Login Methods
export async function loginWithEmailPassword(
	email: string,
	password: string,
): Promise<AuthResult> {
	if (!auth0Client) {
		throw new Error("Auth0 client not initialized")
	}

	return new Promise((resolve, reject) => {
		auth0Client?.login(
			{
				realm: "Username-Password-Authentication", // or your database connection name
				username: email,
				password: password,
			},
			(err, authResult) => {
				if (err) {
					reject(err)
					return
				}

				if (authResult) {
					const result: AuthResult = {
						accessToken: authResult.accessToken,
						idToken: authResult.idToken,
						expiresIn: authResult.expiresIn,
						tokenType: authResult.tokenType,
						user: {
							sub: authResult.idTokenPayload.sub,
							email: authResult.idTokenPayload.email,
							email_verified: authResult.idTokenPayload.email_verified,
							name: authResult.idTokenPayload.name,
							picture: authResult.idTokenPayload.picture,
							oktaId: undefined, // Auth0 users don't have Okta ID
							// Extract custom claims from Auth0 action
							vertis_user_id: authResult.idTokenPayload.vertis_user_id,
							auth_database_user_id:
								authResult.idTokenPayload.auth_database_user_id,
							login_count: authResult.idTokenPayload.login_count,
							// Extract Hasura claims from access token
							hasura_claims:
								authResult.accessTokenPayload?.["https://hasura.io/jwt/claims"],
						},
					}

					storeTokens(result)
					resolve(result)
				} else {
					reject(new Error("No authentication result received"))
				}
			},
		)
	})
}

// Google OAuth Login
export async function loginWithGoogle(): Promise<void> {
	if (!auth0Client) {
		throw new Error("Auth0 client not initialized")
	}

	// Generate state parameter for security
	const state =
		Math.random().toString(36).substring(2, 15) +
		Math.random().toString(36).substring(2, 15)
	localStorage.setItem("auth0_state", state)

	// Redirect to Google OAuth - this will not return
	auth0Client.authorize({
		connection: "google-oauth2",
		state: state,
	})

	// This line will never be reached due to redirect
	// The OAuth callback will handle the token processing
}

export async function signupWithEmailPassword(
	email: string,
	password: string,
): Promise<{ success: boolean; message: string }> {
	if (!auth0Client) {
		throw new Error("Auth0 client not initialized")
	}

	return new Promise((resolve, reject) => {
		auth0Client?.signup(
			{
				connection: "Username-Password-Authentication",
				email: email,
				password: password,
			},
			(err, authResult) => {
				if (err) {
					reject(err)
					return
				}

				if (authResult) {
					// For signup, Auth0 typically just creates the user account
					// The user needs to verify their email before they can log in
					resolve({
						success: true,
						message:
							"Account created successfully. Please check your email to verify your account before logging in.",
					})
				} else {
					reject(new Error("No authentication result received"))
				}
			},
		)
	})
}

export async function resetPassword(email: string): Promise<void> {
	if (!auth0Client) {
		throw new Error("Auth0 client not initialized")
	}

	return new Promise((resolve, reject) => {
		auth0Client?.changePassword(
			{
				connection: "Username-Password-Authentication",
				email: email,
			},
			(err) => {
				if (err) {
					reject(err)
					return
				}
				resolve()
			},
		)
	})
}

function isAuthenticated(): boolean {
	if (typeof window === "undefined") {
		return false
	}

	const token = getAccessToken()
	const userInfo = getUserInfo()
	const hasToken = token !== null
	const hasUserInfo = userInfo !== null

	console.log("[AUTH SERVICE] isAuthenticated check:", {
		hasToken,
		hasUserInfo,
		tokenExists: !!token,
		userInfoExists: !!userInfo,
		localStorageKeys: {
			accessToken: localStorage.getItem("vertis_access_token") ? "exists" : "missing",
			userInfo: localStorage.getItem("vertis_user_info") ? "exists" : "missing",
		},
	})

	return hasToken && hasUserInfo
}

// Token Management Exports
export {
	clearTokens,
	getAccessToken,
	getIdToken,
	getUserInfo,
	isAuthenticated,
	storeTokens
}

// Detect authentication provider from user data
export function getAuthProvider(): "auth0" | "okta" | "unknown" {
	try {
		const userInfo = getUserInfo()
		if (!userInfo) return "unknown"

		// Check for Okta-specific fields
		if (userInfo.oktaId || userInfo.hasura_claims?.["x-hasura-okta-user-id"]) {
			return "okta"
		}

		// Check for Auth0-specific fields
		if (
			userInfo.auth_database_user_id ||
			userInfo.hasura_claims?.["x-hasura-auth-0-user-id"]
		) {
			return "auth0"
		}

		return "unknown"
	} catch {
		return "unknown"
	}
}

export function logout(): void {
	const provider = getAuthProvider()

	if (provider === "auth0" && auth0Client) {
		// Auth0 logout - clear our local tokens first, then clear Auth0 session
		// Auth0 maintains browser session state that needs to be cleared
		// BUT we must clear our local tokens first since auth0Client.logout() doesn't touch them
		clearTokens()
		auth0Client.logout({
			returnTo: window.location.origin,
			clientID: import.meta.env.VITE_AUTH_0_CLIENT_ID,
		})
		// Note: Auth0 will redirect back to our app, but our tokens are already cleared
	} else {
		// For Okta, unknown provider, or fallback - just clear tokens and redirect
		clearTokens()
		window.location.href = "/"
	}
}

// Token Refresh (for future implementation)
export async function refreshToken(): Promise<AuthResult | null> {
	// TODO: Implement token refresh logic
	// This will be implemented in future tickets
	console.warn("Token refresh not yet implemented")
	return null
}

// Export as object for backward compatibility (can be removed after updating all imports)
export const AuthService = {
	loginWithEmailPassword,
	loginWithGoogle,
	signupWithEmailPassword,
	resetPassword,
	getAccessToken,
	getIdToken,
	getUserInfo,
	isAuthenticated,
	clearTokens,
	storeTokens,
	getAuthProvider,
	logout,
	refreshToken,
}
