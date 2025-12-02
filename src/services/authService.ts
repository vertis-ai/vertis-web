import { type AuthResult, auth0Client, type User } from "../config/auth0Client"
import * as tokenStorage from "../lib/auth/tokenStorage"

// Token Management Functions - now using tokenStorage for hybrid localStorage + cookie support
function storeTokens(result: AuthResult): void {
	const { accessToken, idToken, expiresIn, tokenType, user } = result

	// Use tokenStorage.storeTokens which handles both localStorage and cookies
	tokenStorage.storeTokens({
		accessToken,
		idToken,
		expiresIn,
		tokenType,
		user,
	})
}

function getAccessToken(request?: Request): string | null {
	// Use tokenStorage.getAccessToken which works on both server and client
	return tokenStorage.getAccessToken(request)
}

function getIdToken(request?: Request): string | null {
	// Use tokenStorage.getIdToken which works on both server and client
	return tokenStorage.getIdToken(request)
}

function getUserInfo(request?: Request): User | null {
	// Use tokenStorage.getUserInfo which works on both server and client
	const userInfo = tokenStorage.getUserInfo(request)
	if (!userInfo) return null

	try {
		return userInfo as User
	} catch {
		return null
	}
}

function clearTokens(): void {
	// Use tokenStorage.clearTokens which clears both localStorage and cookies
	tokenStorage.clearTokens()
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

function isAuthenticated(request?: Request): boolean {
	// Use tokenStorage.isAuthenticated which works on both server and client
	return tokenStorage.isAuthenticated(request)
}

// Token Management Exports
export {
	clearTokens,
	getAccessToken,
	getIdToken,
	getUserInfo,
	isAuthenticated,
	storeTokens,
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
