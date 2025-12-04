import Header from "@/components/Header"
import { Sidebar } from "@/components/common/Sidebar"
import { getCurrentUserDetailsQuery } from "@/data/hasura/queries/users/getCurrentUserDetails-options"
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
	loader: async ({ context }) => {
		// Prefetch user data for the entire authenticated layout
		// This ensures Header/Sidebar have data available immediately on SSR
		const userInfo = AuthService.getUserInfo(context.request)
		const vertisUserId =
			userInfo?.vertis_user_id ||
			(userInfo?.hasura_claims?.["x-hasura-vertis-user-id"] as
				| string
				| undefined) ||
			""

		if (vertisUserId) {
			// Prefetch on server (SSR) and cache for client (CSR)
			await context.queryClient.ensureQueryData(
				getCurrentUserDetailsQuery(vertisUserId, context.request),
			)
		}
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
