import { useCallback } from "react"
import { decodeJwtPayload, validateJwtExpiration } from "../../lib/jwtUtils"

interface JwtPayload {
	sub: string
	email: string
	email_verified: boolean
	name?: string
	picture?: string
	oktaId?: string // Add Okta ID for provider detection
	vertis_user_id?: string
	auth_database_user_id?: string
	login_count?: number
	hasura_claims?: Record<string, unknown>
	exp?: number
	iat?: number
}

interface JwtExtractionResult {
	isValid: boolean
	payload?: JwtPayload
	error?: string
}

export const useJwtExtraction = () => {
	const extractJwtFromUrl = useCallback((): string | null => {
		// Check for JWT in URL fragment (as returned by Okta backend)
		const hash = window.location.hash
		if (!hash) return null

		const urlParams = new URLSearchParams(hash.substring(1))
		const jwt = urlParams.get("jwt")

		return jwt
	}, [])

	const validateJwt = useCallback((jwt: string): JwtExtractionResult => {
		// Use the centralized JWT decoding utility
		const decodeResult = decodeJwtPayload<JwtPayload>(jwt)

		if (!decodeResult.success) {
			return {
				isValid: false,
				error: decodeResult.error,
			}
		}

		const payload = decodeResult.payload

		if (!payload) {
			return {
				isValid: false,
				error: "No payload found in JWT",
			}
		}

		// Check if JWT is expired using utility function
		const expirationValidation = validateJwtExpiration(jwt)
		if (expirationValidation.isValid && expirationValidation.isExpired) {
			return {
				isValid: false,
				error: "JWT token has expired",
			}
		}

		// Validate required fields
		if (!payload.sub || !payload.email) {
			return {
				isValid: false,
				error: "JWT missing required fields (sub, email)",
			}
		}

		return {
			isValid: true,
			payload,
		}
	}, [])

	const extractAndValidateJwt = useCallback((): JwtExtractionResult => {
		const jwt = extractJwtFromUrl()

		if (!jwt) {
			return {
				isValid: false,
				error: "No JWT found in URL",
			}
		}

		return validateJwt(jwt)
	}, [extractJwtFromUrl, validateJwt])

	return {
		extractJwtFromUrl,
		validateJwt,
		extractAndValidateJwt,
	}
}
