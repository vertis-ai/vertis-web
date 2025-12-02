import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import { useEffect } from "react"
import { AuthService } from "@/services/authService"

export const Route = createFileRoute("/")({
	beforeLoad: () => {
		// Skip auth check on server-side (SSR)
		if (typeof window === "undefined") return

		// Check authentication - redirect to login if not authenticated
		const authenticated = AuthService.isAuthenticated()

		if (!authenticated) {
			throw redirect({
				to: "/login",
				search: {
					redirect: "/",
				},
			})
		}
	},
	component: Home,
})

function Home() {
	const navigate = useNavigate()
	const user = AuthService.getUserInfo()

	// Client-side auth check as fallback (in case SSR rendered the page)
	useEffect(() => {
		if (!AuthService.isAuthenticated()) {
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
