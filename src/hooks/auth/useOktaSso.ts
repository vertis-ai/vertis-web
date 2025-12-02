import { useCallback } from "react"

interface OktaSsoError {
	message: string
	code?: string
}

export const useOktaSso = () => {
	const initiateOktaSso = useCallback(
		async (email: string): Promise<string> => {
			try {
				// Extract domain from email
				const domain = email.split("@")[1]
				if (!domain) {
					throw new Error("Invalid email format")
				}

				// For SAML SSO, we need to do a full browser redirect, not an XHR call
				// Create a form and submit it to trigger the SAML flow
				//
				// CRITICAL: Form submissions do NOT go through Vite proxy!
				// Vite proxy only works for fetch/XHR requests, NOT HTML form navigation.
				// We MUST submit directly to the AWS API Gateway URL in all environments.
				//
				// The form submission causes a full page navigation, which bypasses the dev server proxy entirely.
				const apiBaseUrl =
					import.meta.env.VITE_VERTIS_SERVERLESS_BASE_URL ||
					import.meta.env.VITE_API_BASE_URL ||
					"https://xv8ny0pep9.execute-api.us-east-1.amazonaws.com"

				// Normalize the base URL (remove trailing slash if present)
				const normalizedBaseUrl = apiBaseUrl.replace(/\/+$/, "")
				// AWS API Gateway stage is /dev
				const endpoint = "/dev/auth/sso/okta/initiate"
				const formAction = `${normalizedBaseUrl}${endpoint}`

				const form = document.createElement("form")
				form.method = "POST"
				form.action = formAction
				form.style.display = "none"

				// Add email field
				const emailField = document.createElement("input")
				emailField.type = "hidden"
				emailField.name = "email"
				emailField.value = email
				form.appendChild(emailField)

				// Add relayState field - MUST be email or email domain for SSO lookup
				const relayStateField = document.createElement("input")
				relayStateField.type = "hidden"
				relayStateField.name = "relayState"
				relayStateField.value = email
				form.appendChild(relayStateField)

				// Add callback URL field - for redirect after authentication
				const callbackUrlField = document.createElement("input")
				callbackUrlField.type = "hidden"
				callbackUrlField.name = "callbackUrl"
				callbackUrlField.value = window.location.origin
				form.appendChild(callbackUrlField)

				// Submit the form to trigger browser redirect
				document.body.appendChild(form)
				form.submit()

				// Return a success message since we're redirecting
				// Note: This line may not execute if the form submission redirects immediately
				return "Redirecting to Okta SSO..."
			} catch (error) {
				console.error("Okta SSO initiation error:", error)
				throw error
			}
		},
		[],
	)

	const handleOktaSsoError = useCallback((error: OktaSsoError) => {
		console.error("Okta SSO error:", error)

		// Redirect to login page with error
		const errorParams = new URLSearchParams({
			error: "okta_sso_failed",
			error_description: error.message,
		})

		window.location.href = `/login?${errorParams.toString()}`
	}, [])

	return {
		initiateOktaSso,
		handleOktaSsoError,
	}
}
