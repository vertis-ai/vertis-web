import { Outlet, createFileRoute, redirect } from "@tanstack/react-router"
import Header from "@/components/Header"
import { AuthService } from "@/services/authService"

export const Route = createFileRoute("/_authenticated")({
	beforeLoad: ({ location }) => {
		// Check authentication for all routes under this layout
		if (typeof window === "undefined") return

		const authenticated = AuthService.isAuthenticated()

		if (!authenticated) {
			throw redirect({
				to: "/login",
				search: {
					redirect: location.pathname,
				},
			})
		}
	},
	component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
	return (
		<>
			<Header />
			<Outlet />
		</>
	)
}
