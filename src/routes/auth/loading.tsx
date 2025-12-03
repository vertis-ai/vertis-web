import { AuthService } from "@/services/authService"
import { createFileRoute, useRouter } from "@tanstack/react-router"
import { useEffect } from "react"
import { z } from "zod"

export const Route = createFileRoute("/auth/loading")({
	validateSearch: z.object({
		redirect: z.string().optional(),
	}),
	component: AuthLoading,
})

function AuthLoading() {
	const router = useRouter()
	const search = Route.useSearch()

	useEffect(() => {
		let cancelled = false

		const finishAuthCheck = () => {
			if (cancelled) return

			const next = search.redirect ?? "/"
			const isAuthenticated = AuthService.isAuthenticated()

			if (isAuthenticated) {
				router.history.push(next)
				return
			}

			const redirectQuery =
				next && next !== "/" ? `?redirect=${encodeURIComponent(next)}` : ""

			router.history.push(`/login${redirectQuery}`)
		}

		const rafId = window.requestAnimationFrame(finishAuthCheck)

		return () => {
			cancelled = true
			window.cancelAnimationFrame(rafId)
		}
	}, [router, search.redirect])

	return (
		<div className="min-h-screen bg-white flex items-center justify-center px-6 text-center">
			<div className="flex flex-col items-center gap-6">
				<div className="relative flex items-center justify-center">
					<div
						className="h-16 w-16 rounded-full border-2 border-(--action-blue) border-t-transparent animate-spin"
						aria-hidden="true"
					/>
					<div className="absolute h-20 w-20 rounded-full bg-(--action-blue)/15 blur-3xl" />
				</div>
				<div className="space-y-2">
					<p className="text-base font-medium text-(--color-body-text)">
						Loading...
					</p>
					<p className="text-sm text-(--color-vertis-purple-lt)">
						Hang tight while we confirm your Vertis session.
					</p>
				</div>
			</div>
		</div>
	)
}
