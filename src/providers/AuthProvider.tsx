import { createContext, useContext, type ReactNode } from "react"
import type { AuthResult, User } from "../config/auth0Client"
import { useEmbeddedAuth } from "../hooks/auth/useEmbeddedAuth"

interface AuthContextType {
	isAuthenticated: boolean
	user: User | null
	isLoading: boolean
	error: string | null
	loginWithEmailPassword: (
		email: string,
		password: string,
	) => Promise<AuthResult>
	loginWithGoogle: () => Promise<void>
	loginWithRedirect: () => Promise<void>
	signupWithEmailPassword: (
		email: string,
		password: string,
		name?: string,
	) => Promise<{ success: boolean; message: string }>
	resetPassword: (email: string) => Promise<void>
	logout: () => void
	clearError: () => void
	getAccessTokenSilently: () => Promise<string | null>
	refreshAuth: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const auth = useEmbeddedAuth()

	return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

export const useAuthContext = () => {
	const context = useContext(AuthContext)
	if (context === undefined) {
		throw new Error("useAuthContext must be used within an AuthProvider")
	}
	return context
}
