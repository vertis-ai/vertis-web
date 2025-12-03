import Header from "@/components/Header"
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
		<>
			<Header />
			<Outlet />
		</>
	)
}
