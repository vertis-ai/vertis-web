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
				const apiBaseUrl = import.meta.env.DEV
					? "/dev"
					: import.meta.env.VITE_API_BASE_URL || "https://api-dev.vertis.com"
				const form = document.createElement("form")
				form.method = "POST"
				form.action = `${apiBaseUrl}/auth/sso/okta/initiate`
				form.style.display = "none"

				// Add email field
				const emailField = document.createElement("input")
				emailField.type = "hidden"
				emailField.name = "email"
				emailField.value = email
				form.appendChild(emailField)

				// Add relayState field
				const relayStateField = document.createElement("input")
				relayStateField.type = "hidden"
				relayStateField.name = "relayState"
				relayStateField.value = email
				form.appendChild(relayStateField)

				// Submit the form to trigger browser redirect
				document.body.appendChild(form)
				form.submit()

				// Return a success message since we're redirecting
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
