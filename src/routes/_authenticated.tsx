import Header from "@/components/Header"
import { Sidebar } from "@/components/common/Sidebar"
import { AuthService } from "@/services/authService"
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/_authenticated")({
	beforeLoad: ({ context, location }) => {
		const isServer = typeof window === "undefined"
		const request = isServer ? context.request : undefined
		const authenticated = AuthService.isAuthenticated(request)
		const redirectTarget = location.href ?? location.pathname

		if (authenticated) {
			return
		}

		if (isServer) {
			throw redirect({
				to: "/auth/loading",
				search: {
					redirect: redirectTarget,
				},
			})
		}

		throw redirect({
			to: "/login",
			search: {
				redirect: redirectTarget,
			},
		})
	},
	component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
	return (
		<div className="h-screen flex flex-col overflow-hidden">
			{/* Fixed Header */}
			<Header />

			{/* Main Layout: Sidebar + Content */}
			<div className="flex flex-1 overflow-hidden">
				{/* Fixed Sidebar */}
				<Sidebar />

				{/* Scrollable Main Content */}
				<main className="flex-1 overflow-y-auto bg-(--color-purple-100)">
					<Outlet />
				</main>
			</div>
		</div>
	)
}
