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
import type { TRPCRouter } from "@/integrations/trpc/router"
import Header from "../components/Header"
import { NotFound } from "../components/NotFound"
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
	notFoundComponent: NotFound,
	beforeLoad: ({ location }) => {
		// Allow public routes (both server and client)
		const isPublic = isPublicRoute(location.pathname)

		if (isPublic) {
			return
		}

		if (typeof window === "undefined") return

		// Client-side: Check authentication
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
