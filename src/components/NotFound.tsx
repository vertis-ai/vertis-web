import { Link } from "@tanstack/react-router"
import { VertisLogo } from "./auth/icons/VertisLogo"
import { Button } from "./ui/button"

export function NotFound() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-white to-gray-50 px-4">
			<div className="w-full max-w-md space-y-8 text-center">
				{/* Logo */}
				<div className="flex justify-center">
					<VertisLogo className="h-12 w-auto" />
				</div>

				{/* 404 Message */}
				<div className="space-y-4">
					<h1 className="text-6xl font-bold text-gray-900">404</h1>
					<h2 className="text-2xl font-semibold text-gray-700">
						Page Not Found
					</h2>
					<p className="text-gray-500">
						The page you're looking for doesn't exist or has been moved.
					</p>
				</div>

				{/* Action Buttons */}
				<div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
					<Button asChild size="lg">
						<Link to="/">Go to Home</Link>
					</Button>
					<Button asChild variant="outline" size="lg">
						<Link to="/login">Go to Login</Link>
					</Button>
				</div>
			</div>
		</div>
	)
}
