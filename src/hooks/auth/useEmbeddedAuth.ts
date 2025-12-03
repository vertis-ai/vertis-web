import { useCallback, useEffect, useRef, useState } from "react"
import type { User } from "../../config/auth0Client"
import { AuthService } from "../../services/authService"

const REFRESH_THRESHOLD_MS = 5 * 60 * 1000 // 5 minutes
const REFRESH_CHECK_INTERVAL_MS = 60 * 1000 // 1 minute

export const useEmbeddedAuth = () => {
	const [isAuthenticated, setIsAuthenticated] = useState(false)
	const [user, setUser] = useState<User | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	// isBootstrapping should be false on server (no effects run), true on client until first check completes
	const [isBootstrapping, setIsBootstrapping] = useState(
		typeof window !== "undefined",
	)
	const [error, setError] = useState<string | null>(null)
	const initializedRef = useRef(false)

	const initializeAuth = useCallback(() => {
		try {
			const hasToken = AuthService.getAccessToken() !== null
			const userInfo = AuthService.getUserInfo()
			const hasUserInfo = userInfo !== null

			const newIsAuthenticated = hasToken && hasUserInfo

			setIsAuthenticated(newIsAuthenticated)
			setUser(userInfo)
			setIsLoading(false)
			setIsBootstrapping(false)
		} catch (err) {
			console.error("[AUTH INIT] Auth initialization error:", err)
			setIsAuthenticated(false)
			setUser(null)
			setIsLoading(false)
			setIsBootstrapping(false)
		}
	}, [])

	const refreshAuth = useCallback(() => {
		initializeAuth()
	}, [initializeAuth])

	useEffect(() => {
		if (!initializedRef.current) {
			initializedRef.current = true
			initializeAuth()
		}

		// Listen for OAuth callback completion
		const handleTokensStored = () => {
			refreshAuth()
		}

		window.addEventListener(
			"auth:tokens-stored",
			handleTokensStored as EventListener,
		)

		return () => {
			window.removeEventListener(
				"auth:tokens-stored",
				handleTokensStored as EventListener,
			)
		}
	}, [initializeAuth, refreshAuth])

	const loginWithEmailPassword = async (email: string, password: string) => {
		try {
			setIsLoading(true)
			setError(null)
			const result = await AuthService.loginWithEmailPassword(email, password)
			setIsAuthenticated(true)
			setUser(result.user)
			return result
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : "Login failed"
			setError(errorMessage)
			throw err
		} finally {
			setIsLoading(false)
		}
	}

	const loginWithGoogle = async () => {
		try {
			// Don't set loading state since this will redirect and not return
			setError(null)
			// This will redirect to Google OAuth and not return
			await AuthService.loginWithGoogle()
			// This line will never be reached due to redirect
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Google login failed"
			setError(errorMessage)
			throw err
		}
	}

	const loginWithRedirect = async () => {
		try {
			// Don't set loading state since this will redirect and not return
			setError(null)
			// This will redirect to Google OAuth and not return
			await AuthService.loginWithGoogle()
			// This line will never be reached due to redirect
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Redirect login failed"
			setError(errorMessage)
			throw err
		}
	}

	const signupWithEmailPassword = async (email: string, password: string) => {
		try {
			setIsLoading(true)
			setError(null)
			const result = await AuthService.signupWithEmailPassword(email, password)
			return result
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : "Signup failed"
			setError(errorMessage)
			throw err
		} finally {
			setIsLoading(false)
		}
	}

	const resetPassword = async (email: string) => {
		try {
			setIsLoading(true)
			setError(null)
			await AuthService.resetPassword(email)
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Password reset failed"
			setError(errorMessage)
			throw err
		} finally {
			setIsLoading(false)
		}
	}

	const logout = useCallback(() => {
		try {
			AuthService.logout()
			// Note: The logout method will handle the redirect, so we don't need to update state here
			// The page will redirect to the appropriate logout endpoint
		} catch (logoutError) {
			console.error("Logout error:", logoutError)
			// Fallback logout
			AuthService.clearTokens()
			setIsAuthenticated(false)
			setUser(null)
			window.location.href = "/"
		}
	}, [])

	const clearError = () => {
		setError(null)
	}

	const getAccessTokenSilently = async () => {
		return AuthService.getAccessToken()
	}

	// Automatic token refresh logic
	useEffect(() => {
		if (!isAuthenticated) return

		let isMounted = true

		const maintainSession = async () => {
			if (!isMounted) return

			const token = AuthService.getAccessToken()
			if (!token) {
				logout()
				return
			}

			const provider = AuthService.getAuthProvider()
			if (provider !== "auth0") {
				return
			}

			const expiry = AuthService.getTokenExpiry()
			if (!expiry) {
				logout()
				return
			}

			const timeRemaining = expiry - Date.now()
			if (timeRemaining <= REFRESH_THRESHOLD_MS) {
				try {
					const refreshed = await AuthService.refreshToken()
					if (refreshed) {
						setIsAuthenticated(true)
						setUser(refreshed.user)
					}
				} catch (err) {
					console.error("Auth0 token refresh failed:", err)
					logout()
				}
			}
		}

		const interval = window.setInterval(() => {
			void maintainSession()
		}, REFRESH_CHECK_INTERVAL_MS)

		const handleFocus = () => {
			void maintainSession()
		}

		window.addEventListener("focus", handleFocus)
		void maintainSession()

		return () => {
			isMounted = false
			window.clearInterval(interval)
			window.removeEventListener("focus", handleFocus)
		}
	}, [isAuthenticated, logout])

	return {
		isAuthenticated,
		user,
		isLoading,
		isBootstrapping,
		error,
		loginWithEmailPassword,
		loginWithGoogle,
		loginWithRedirect,
		signupWithEmailPassword,
		resetPassword,
		logout,
		clearError,
		getAccessTokenSilently,
		refreshAuth,
	}
}
