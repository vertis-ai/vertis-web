import { AuthService } from "../../services/authService"

// Define public routes that don't require authentication
const PUBLIC_ROUTES = [
	"/login",
	"/signup",
	"/forgot-password",
	"/reset-password",
	"/auth/callback",
]

/**
 * Check if a route is public (doesn't require authentication)
 */
export const isPublicRoute = (pathname: string): boolean => {
	const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))
	console.log("[ROUTE GUARDS] isPublicRoute check", {
		pathname,
		isPublic,
		publicRoutes: PUBLIC_ROUTES,
	})
	return isPublic
}

/**
 * Require authentication - throws redirect if not authenticated
 * Use this in route beforeLoad guards
 */
export const requireAuth = (): void => {
	if (typeof window === "undefined") {
		return // SSR - skip check
	}

	if (!AuthService.isAuthenticated()) {
		// This will be handled by the route guard
		throw new Error("UNAUTHENTICATED")
	}
}
