import { AuthService } from "@/services/authService"

/**
 * Utility to check if the current user is a Vertis admin
 * Can be used in non-component contexts (route guards, loaders, etc.)
 *
 * Note: This reads from the stored user info (JWT claims), not from Hasura.
 * For component usage with cache, use the `useIsVertisAdmin` hook instead.
 *
 * @param request - Optional Request object for SSR context
 * @returns boolean - true if user is Vertis admin, false otherwise
 *
 * @example
 * // In route loader or beforeLoad
 * export const Route = createFileRoute('/admin')({
 *   beforeLoad: ({ context }) => {
 *     if (!isVertisAdmin(context.request)) {
 *       throw redirect({ to: '/' })
 *     }
 *   }
 * })
 */
export function isVertisAdmin(request?: Request): boolean {
	const userInfo = AuthService.getUserInfo(request)

	if (!userInfo) {
		return false
	}

	// Check hasura_claims first (most reliable source)
	const hasuraRole = userInfo.hasura_claims?.["x-hasura-default-role"]
	if (hasuraRole === "vertis_admin") {
		return true
	}

	// Fallback to direct property (may be set via Auth0/Okta claims)
	// Need to handle the type properly - userInfo is unknown
	if (typeof userInfo === "object" && userInfo !== null) {
		const userObj = userInfo as Record<string, unknown>
		return userObj.is_vertis_admin === true
	}

	return false
}
