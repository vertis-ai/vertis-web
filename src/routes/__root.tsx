import type { TRPCRouter } from "@/integrations/trpc/router"
import { TanStackDevtools } from "@tanstack/react-devtools"
import type { QueryClient } from "@tanstack/react-query"
import {
	createRootRouteWithContext,
	HeadContent,
	redirect,
	Scripts,
} from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query"
import Header from "../components/Header"
import { useOAuthCallback } from "../hooks/auth/useOAuthCallback"
import { useOktaCallback } from "../hooks/auth/useOktaCallback"
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools"
import { isPublicRoute } from "../lib/auth/routeGuards"
import StoreDevtools from "../lib/demo-store-devtools"
import { AuthService } from "../services/authService"
import appCss from "../styles.css?url"

interface MyRouterContext {
	queryClient: QueryClient

	trpc: TRPCOptionsProxy<TRPCRouter>
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	beforeLoad: ({ location }) => {
		console.log("[ROOT ROUTE] beforeLoad called", {
			pathname: location.pathname,
			isServer: typeof window === "undefined",
		})

		// Allow public routes (both server and client)
		const isPublic = isPublicRoute(location.pathname)
		console.log("[ROOT ROUTE] isPublicRoute check", {
			pathname: location.pathname,
			isPublic,
		})

		if (isPublic) {
			console.log("[ROOT ROUTE] Route is public, allowing access")
			return
		}

		if (typeof window === "undefined") return // For SSR, we'll allow the page to render and let client-side handle redirect

		// Client-side: Check authentication
		const authenticated = AuthService.isAuthenticated()
		console.log("[ROOT ROUTE] Authentication check", {
			authenticated,
			pathname: location.pathname,
		})

		if (!authenticated) {
			console.log("[ROOT ROUTE] Not authenticated, redirecting to /login")
			throw redirect({
				to: "/login",
				search: {
					redirect: location.pathname,
				},
			})
		}

		console.log("[ROOT ROUTE] Authenticated, allowing access")
	},
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "TanStack Start Starter",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),

	shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
	// Run OAuth callback hooks globally (like legacy app)
	// This processes tokens from URL hash/search params on any route
	useOAuthCallback()
	useOktaCallback()

	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				<Header />
				{children}
				<TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
						StoreDevtools,
						TanStackQueryDevtools,
					]}
				/>
				<Scripts />
			</body>
		</html>
	)
}
