import { WebAuth } from "auth0-js"

// Auth0 client configuration for embedded login
// Only initialize when window is available (client-side) and env vars are set
export const auth0Client =
	typeof window !== "undefined" &&
	import.meta.env.VITE_AUTH_0_DOMAIN_URL &&
	import.meta.env.VITE_AUTH_0_CLIENT_ID
		? new WebAuth({
				domain: import.meta.env.VITE_AUTH_0_DOMAIN_URL,
				clientID: import.meta.env.VITE_AUTH_0_CLIENT_ID,
				redirectUri: window.location.origin,
				responseType: "token id_token",
				scope: "openid profile email",
			})
		: null

// Interface for authentication result
export interface AuthResult {
	accessToken: string
	idToken: string
	expiresIn: number
	tokenType: string
	user: {
		sub: string
		email: string
		email_verified: boolean
		name?: string
		picture?: string
		oktaId?: string // Add Okta ID for provider detection
		// Custom claims from Auth0 action
		vertis_user_id?: string
		auth_database_user_id?: string
		login_count?: number
		// Hasura claims from access token
		hasura_claims?: {
			"x-hasura-auth-0-user-id"?: string
			"x-hasura-okta-user-id"?: string
			"x-hasura-vertis-user-id": string
			"x-hasura-organization-id": string
			"x-hasura-default-role": string
			"x-hasura-allowed-roles": string[]
		}
	}
}

// User type from AuthResult
export type User = AuthResult["user"]

// Interface for Okta tenant information
export interface OktaTenant {
	id: string
	domain: string
	ssoUrl: string
	clientId: string
	organizationId: string
}
