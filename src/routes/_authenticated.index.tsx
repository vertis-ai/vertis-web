import { AuthService } from "@/services/authService"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_authenticated/")({
	component: Home,
})

function Home() {
	const user = AuthService.getUserInfo()

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
