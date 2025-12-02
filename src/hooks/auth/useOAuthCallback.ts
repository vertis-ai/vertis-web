import { useNavigate } from "@tanstack/react-router"
import { useEffect } from "react"
import { decodeJwtPayload, validateJwtExpiration } from "../../lib/jwtUtils"
import { AuthService } from "../../services/authService"

export const useOAuthCallback = () => {
	const navigate = useNavigate()

	useEffect(() => {
		// Check if we're returning from an OAuth flow
		const hash = window.location.hash
		const search = window.location.search

		// Check if we have OAuth tokens in hash or search params
		const hasHashTokens = hash?.includes("access_token")
		const hasSearchTokens =
			search?.includes("access_token") || search?.includes("id_token")

		if (hasHashTokens || hasSearchTokens) {
			console.log("[OAUTH CALLBACK] Found OAuth tokens, processing...")
			let urlParams: URLSearchParams

			// Parse parameters from either hash or search
			if (hash?.includes("access_token")) {
				// Parse from hash fragment
				urlParams = new URLSearchParams(hash.substring(1)) // Remove the # and parse
			} else if (
				search?.includes("access_token") ||
				search?.includes("id_token")
			) {
				// Parse from search parameters
				urlParams = new URLSearchParams(search.substring(1)) // Remove the ? and parse
			} else {
				console.log("[OAUTH CALLBACK] No valid token parameters found")
				return
			}

			const accessToken = urlParams.get("access_token")
			const idToken = urlParams.get("id_token")
			const state = urlParams.get("state")
			const expiresIn = urlParams.get("expires_in")
			const tokenType = urlParams.get("token_type")
			const error = urlParams.get("error")
			const errorDescription = urlParams.get("error_description")

			// Check for OAuth errors first
			if (error) {
				console.error("OAuth error:", error, errorDescription)
				navigate({
					to: "/login",
					search: {
						error: error,
						error_description: errorDescription || "",
					},
				})
				return
			}

			if (accessToken && idToken) {
				// Verify state parameter
				const storedState = localStorage.getItem("auth0_state")

				if (storedState && state && storedState !== state) {
					console.error("State mismatch:", {
						storedState,
						receivedState: state,
					})
					navigate({
						to: "/login",
						search: {
							error: "state_mismatch",
						},
					})
					return
				}

				try {
					// Parse the ID token to get user info
					const idTokenResult = decodeJwtPayload(idToken)
					if (!idTokenResult.success) {
						throw new Error(`ID token decoding failed: ${idTokenResult.error}`)
					}
					const idTokenPayload = idTokenResult.payload
					if (!idTokenPayload) {
						throw new Error("No ID token payload found")
					}

					// Also decode the access token to see if it has Hasura claims
					const accessTokenResult = decodeJwtPayload(accessToken)
					if (!accessTokenResult.success) {
						throw new Error(
							`Access token decoding failed: ${accessTokenResult.error}`,
						)
					}
					const accessTokenPayload = accessTokenResult.payload
					if (!accessTokenPayload) {
						throw new Error("No access token payload found")
					}

					// Check token expiration using utility function
					const expirationValidation = validateJwtExpiration(accessToken)
					if (expirationValidation.isValid && expirationValidation.isExpired) {
						console.error("Token expired:", {
							exp: expirationValidation.exp,
							now: Math.floor(Date.now() / 1000),
						})
						navigate({
							to: "/login",
							search: {
								error: "token_expired",
							},
						})
						return
					}

					// Store the tokens and user info
					const result = {
						accessToken: accessToken,
						idToken: idToken,
						expiresIn: parseInt(expiresIn || "604800", 10), // Default to 7 days (604800 seconds) instead of 24 hours
						tokenType: tokenType || "Bearer",
						user: {
							sub: idTokenPayload.sub as string,
							email: idTokenPayload.email as string,
							email_verified: idTokenPayload.email_verified as boolean,
							name: idTokenPayload.name as string,
							picture: idTokenPayload.picture as string,
							oktaId: undefined, // Auth0 users don't have Okta ID
							vertis_user_id: idTokenPayload.vertis_user_id as string,
							auth_database_user_id:
								idTokenPayload.auth_database_user_id as string,
							login_count: idTokenPayload.login_count as number,
							hasura_claims: accessTokenPayload[
								"https://hasura.io/jwt/claims"
							] as
								| {
										"x-hasura-auth-0-user-id": string
										"x-hasura-vertis-user-id": string
										"x-hasura-organization-id": string
										"x-hasura-default-role": string
										"x-hasura-allowed-roles": string[]
								  }
								| undefined,
						},
					}

					console.log("[OAUTH CALLBACK] Storing tokens", {
						hasAccessToken: !!result.accessToken,
						hasIdToken: !!result.idToken,
						hasUser: !!result.user,
					})

					AuthService.storeTokens(result)

					console.log("[OAUTH CALLBACK] Tokens stored, checking localStorage", {
						accessToken: localStorage.getItem("vertis_access_token")
							? "exists"
							: "missing",
						userInfo: localStorage.getItem("vertis_user_info")
							? "exists"
							: "missing",
					})

					// Clear the state and nonce from localStorage
					localStorage.removeItem("auth0_state")
					localStorage.removeItem("auth0_nonce")

					// Clear the URL hash/search params to prevent re-processing
					window.history.replaceState(
						{},
						document.title,
						window.location.pathname,
					)

					// Dispatch custom event to notify auth hooks that tokens have been stored
					window.dispatchEvent(
						new CustomEvent("auth:tokens-stored", { detail: result }),
					)

					// Redirect to home page instead of reloading
					navigate({ to: "/" })
				} catch (parseError) {
					console.error("Error processing OAuth callback:", parseError)

					navigate({
						to: "/login",
						search: {
							error: "token_processing_failed",
							error_description:
								parseError instanceof Error
									? parseError.message
									: "Token processing failed",
						},
					})
				}
			}
		}
	}, [navigate])
}
