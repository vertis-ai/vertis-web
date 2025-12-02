import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import { AuthService } from "@/services/authService"
import { useEffect } from "react"

export const Route = createFileRoute("/")({
	beforeLoad: () => {
		console.log("[INDEX ROUTE] beforeLoad called", {
			isServer: typeof window === "undefined",
		})

		// Skip auth check on server-side (SSR)
		if (typeof window === "undefined") {
			console.log("[INDEX ROUTE] Skipping auth check (server-side)")
			return
		}

		// Check authentication - redirect to login if not authenticated
		const authenticated = AuthService.isAuthenticated()
		console.log("[INDEX ROUTE] Authentication check", { authenticated })

		if (!authenticated) {
			console.log("[INDEX ROUTE] Not authenticated, redirecting to /login")
			throw redirect({
				to: "/login",
				search: {
					redirect: "/",
				},
			})
		}

		console.log("[INDEX ROUTE] Authenticated, allowing access")
	},
	component: Home,
})

function Home() {
	const navigate = useNavigate()
	const user = AuthService.getUserInfo()

	// Client-side auth check as fallback (in case SSR rendered the page)
	useEffect(() => {
		console.log("[HOME COMPONENT] Client-side auth check", {
			isAuthenticated: AuthService.isAuthenticated(),
		})

		if (!AuthService.isAuthenticated()) {
			console.log("[HOME COMPONENT] Not authenticated, redirecting to /login")
			navigate({
				to: "/login",
				search: {
					redirect: "/",
				},
			})
		}
	}, [navigate])

	return (
		<div className="min-h-screen bg-gray-50 p-8">
			<div className="max-w-4xl mx-auto">
				<h1 className="text-3xl font-bold text-gray-900 mb-4">
					Welcome to Vertis
				</h1>
				{user && (
					<p className="text-lg text-gray-600">
						Logged in as: {user.email || user.sub}
					</p>
				)}
			</div>
		</div>
	)
}
