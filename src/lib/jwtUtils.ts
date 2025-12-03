/**
 * Utility functions for JWT token handling
 */

export interface JwtDecodeResult<T = Record<string, unknown>> {
	success: boolean
	payload?: T
	error?: string
}

/**
 * Safely decodes a JWT token payload, handling URL encoding and base64 padding issues
 * @param token - The JWT token to decode
 * @returns Object containing success status, payload, or error message
 */
export const decodeJwtPayload = <T = Record<string, unknown>>(
	token: string,
): JwtDecodeResult<T> => {
	try {
		// URL decode the token first
		const urlDecodedToken = decodeURIComponent(token)

		// Split the JWT into parts
		const parts = urlDecodedToken.split(".")
		if (parts.length !== 3) {
			return {
				success: false,
				error: "Invalid JWT format - must have 3 parts separated by dots",
			}
		}

		// Get the payload part (middle section)
		let payload = parts[1]

		// Add padding if needed for base64 decoding
		while (payload.length % 4) {
			payload += "="
		}

		// Replace URL-safe base64 characters with standard base64 characters
		payload = payload.replace(/-/g, "+").replace(/_/g, "/")

		// Decode and parse
		const decodedPayload = JSON.parse(atob(payload)) as T

		return {
			success: true,
			payload: decodedPayload,
		}
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown decoding error",
		}
	}
}

/**
 * Validates if a JWT token is expired
 * @param token - The JWT token to validate
 * @returns Object containing validation status and expiration info
 */
export const validateJwtExpiration = (
	token: string,
): {
	isValid: boolean
	isExpired?: boolean
	exp?: number
} => {
	const decodeResult = decodeJwtPayload<{ exp?: number }>(token)

	if (!decodeResult.success || !decodeResult.payload) {
		return { isValid: false }
	}

	const { exp } = decodeResult.payload

	if (!exp) {
		return { isValid: true } // No expiration claim means token doesn't expire
	}

	const now = Math.floor(Date.now() / 1000)
	const isExpired = now > exp

	return {
		isValid: true,
		isExpired,
		exp,
	}
}

/**
 * Extracts user information from a JWT token
 * @param token - The JWT token to extract user info from
 * @returns Object containing user information or error
 */
export const extractUserFromJwt = (
	token: string,
): { success: boolean; user?: Record<string, unknown>; error?: string } => {
	const decodeResult = decodeJwtPayload(token)

	if (!decodeResult.success) {
		return {
			success: false,
			error: decodeResult.error,
		}
	}

	const payload = decodeResult.payload

	// Check for required fields
	if (!payload?.sub || !payload?.email) {
		return {
			success: false,
			error: "JWT missing required fields (sub, email)",
		}
	}

	return {
		success: true,
		user: payload,
	}
}
