import { useCallback, useEffect, useRef, useState } from "react"
import type { User } from "../../config/auth0Client"
import { AuthService } from "../../services/authService"

export const useEmbeddedAuth = () => {
	const [isAuthenticated, setIsAuthenticated] = useState(false)
	const [user, setUser] = useState<User | null>(null)
	const [isLoading, setIsLoading] = useState(true)
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
		} catch (_) {
			setIsAuthenticated(false)
			setUser(null)
			setIsLoading(false)
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

		const checkTokenExpiry = () => {
			const token = AuthService.getAccessToken()
			if (!token) {
				// Token expired or invalid, logout user
				logout()
				return
			}
		}

		// Check token every 5 minutes
		const interval = setInterval(checkTokenExpiry, 5 * 60 * 1000)

		// Also check on window focus (user returns to tab)
		const handleFocus = () => {
			checkTokenExpiry()
		}

		window.addEventListener("focus", handleFocus)

		return () => {
			clearInterval(interval)
			window.removeEventListener("focus", handleFocus)
		}
	}, [isAuthenticated, logout])

	return {
		isAuthenticated,
		user,
		isLoading,
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
