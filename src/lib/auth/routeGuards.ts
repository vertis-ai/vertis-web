import { redirect } from "@tanstack/react-router"
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
 * Require authentication - works on both server and client
 * Use this in route beforeLoad guards
 *
 * @param request - Request object (server-side only, from route context)
 */
export const requireAuth = (request?: Request): void => {
	// Check authentication (works on both server and client)
	if (!AuthService.isAuthenticated(request)) {
		// This will be handled by the route guard with redirect
		throw redirect({
			to: "/login",
			search: {
				redirect:
					typeof window !== "undefined" ? window.location.pathname : "/",
			},
		})
	}
}

/**
 * Authenticated route loader - use in route beforeLoad
 * Checks authentication and redirects if not authenticated
 */
export const authenticatedRouteLoader = (request?: Request) => {
	if (!AuthService.isAuthenticated(request)) {
		throw redirect({
			to: "/login",
			search: {
				redirect:
					typeof window !== "undefined" ? window.location.pathname : "/",
			},
		})
	}
	return true
}

/**
 * Public route loader - use in route beforeLoad
 * Redirects to home if already authenticated
 */
export const publicRouteLoader = (request?: Request) => {
	if (AuthService.isAuthenticated(request)) {
		throw redirect({
			to: "/",
		})
	}
	return true
}
