import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { useOAuthCallback } from "@/hooks/auth/useOAuthCallback"
import { useOktaCallback } from "@/hooks/auth/useOktaCallback"

export const Route = createFileRoute("/auth/callback")({
	component: LoginCallback,
})

function LoginCallback() {
	const [isProcessing, setIsProcessing] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [errorDescription, setErrorDescription] = useState<string | null>(null)

	// Use both callback hooks
	useOAuthCallback()
	useOktaCallback()

	useEffect(() => {
		// Check for error parameters in URL
		const urlParams = new URLSearchParams(window.location.search)
		const urlError = urlParams.get("error")
		const urlErrorDescription = urlParams.get("error_description")

		if (urlError) {
			setError(urlError)
			setErrorDescription(urlErrorDescription)
			setIsProcessing(false)
			return
		}

		// Check if we're processing a callback
		const hash = window.location.hash
		const search = window.location.search

		const hasAuth0Tokens =
			(hash && hash.includes("access_token")) ||
			(search &&
				(search.includes("access_token") || search.includes("id_token")))
		const hasOktaJwt = hash && hash.includes("jwt=")

		if (!hasAuth0Tokens && !hasOktaJwt) {
			// No callback parameters found, route back to login with explicit error so UX stays on login
			setError("no_callback_parameters")
			setErrorDescription("No authentication parameters found in URL")
			setIsProcessing(false)
			return
		}

		// Set a timeout to prevent infinite loading
		const timeout = setTimeout(() => {
			setError("callback_timeout")
			setErrorDescription("Authentication callback timed out")
			setIsProcessing(false)
		}, 10000) // 10 second timeout

		// Clean up timeout if component unmounts
		return () => clearTimeout(timeout)
	}, [])

	// If there's an error, show the error handler
	if (error) {
		return (
			<div className="min-h-screen bg-purple-800 flex items-center justify-center p-4">
				<div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
					<h2 className="text-2xl font-bold text-gray-900 mb-4">
						Authentication Error
					</h2>
					<p className="text-gray-600 mb-4">
						{errorDescription || "An error occurred during authentication"}
					</p>
					<a
						href="/login"
						className="text-blue-600 hover:text-blue-800 underline text-sm font-medium"
					>
						Return to login
					</a>
				</div>
			</div>
		)
	}

	// If still processing, show loading
	if (isProcessing) {
		return (
			<div className="min-h-screen bg-purple-800 flex items-center justify-center p-4">
				<div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
					<div className="flex items-center justify-center">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
					</div>
					<p className="text-center text-gray-600 mt-4">
						Processing authentication...
					</p>
				</div>
			</div>
		)
	}

	// Fallback - should not reach here
	return (
		<div className="min-h-screen bg-purple-800 flex items-center justify-center p-4">
			<div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
				<h2 className="text-2xl font-bold text-gray-900 mb-4">Unknown Error</h2>
				<p className="text-gray-600 mb-4">
					An unexpected error occurred during authentication
				</p>
				<a
					href="/login"
					className="text-blue-600 hover:text-blue-800 underline text-sm font-medium"
				>
					Return to login
				</a>
			</div>
		</div>
	)
}
