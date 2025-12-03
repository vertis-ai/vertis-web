import { useNavigate } from "@tanstack/react-router"
import { useEffect } from "react"
import { AuthService } from "../../services/authService"
import { useJwtExtraction } from "./useJwtExtraction"

export const useOktaCallback = () => {
	const navigate = useNavigate()
	const { extractAndValidateJwt, extractJwtFromUrl } = useJwtExtraction()

	useEffect(() => {
		// Check if we're returning from an Okta SSO flow
		const hash = window.location.hash

		if (hash?.includes("jwt=")) {
			try {
				// Extract and validate JWT
				const jwtResult = extractAndValidateJwt()

				if (!jwtResult.isValid) {
					// Only log errors
					console.error(
						"[OKTA CALLBACK] JWT validation failed:",
						jwtResult.error,
					)
					navigate({
						to: "/login",
						search: {
							error: "jwt_validation_failed",
							error_description: jwtResult.error || "JWT validation failed",
						},
					})
					return
				}

				const { payload } = jwtResult
				if (!payload) {
					console.error("[OKTA CALLBACK] No JWT payload found")
					navigate({
						to: "/login",
						search: {
							error: "no_jwt_payload",
						},
					})
					return
				}

				// Create AuthResult object compatible with existing token storage
				const jwtString = extractJwtFromUrl() // Get the JWT string from URL

				const vertisUserId =
					((payload.hasura_claims as Record<string, unknown> | undefined)?.[
						"x-hasura-vertis-user-id"
					] as string) || payload.sub

				const result = {
					accessToken: jwtString || "", // Use JWT string as access token
					idToken: jwtString || "", // Use JWT string as ID token too
					expiresIn: 604800, // Default to 7 days (604800 seconds) instead of 24 hours
					tokenType: "Bearer",
					user: {
						sub: payload.sub,
						email: payload.email,
						email_verified: payload.email_verified,
						name: payload.name,
						picture: payload.picture,
						oktaId: payload.sub, // Add Okta ID for provider detection
						vertis_user_id: vertisUserId, // Use Hasura claims or fallback to sub
						auth_database_user_id: payload.auth_database_user_id,
						login_count: payload.login_count,
						hasura_claims: payload.hasura_claims as
							| {
									"x-hasura-auth-0-user-id": string
									"x-hasura-vertis-user-id": string
									"x-hasura-organization-id": string
									"x-hasura-default-role": string
									"x-hasura-allowed-roles": string[]
							  }
							| undefined,
						// Store the JWT as the access token for API calls
						accessToken: hash.substring(1), // Store the full JWT fragment
					},
				}

				// Store tokens using existing AuthService
				AuthService.storeTokens(result)

				// Clear the URL hash to prevent re-processing
				window.history.replaceState(
					{},
					document.title,
					window.location.pathname,
				)

				// Dispatch custom event to notify auth hooks that tokens have been stored
				window.dispatchEvent(
					new CustomEvent("auth:tokens-stored", { detail: result }),
				)

				// Redirect to home page
				navigate({ to: "/" })
			} catch (error) {
				console.error("[OKTA CALLBACK] Error processing Okta callback:", error)
				navigate({
					to: "/login",
					search: {
						error: "okta_callback_failed",
						error_description:
							error instanceof Error ? error.message : "Unknown error",
					},
				})
			}
		}
	}, [navigate, extractAndValidateJwt, extractJwtFromUrl])
}
