import { AuthButton } from "@/components/auth/AuthButton"
import { EyeOff } from "@/components/auth/icons/EyeOff"
import { EyeOn } from "@/components/auth/icons/EyeOn"
import { VertisLogo } from "@/components/auth/icons/VertisLogo"
import { PasswordRules } from "@/components/auth/PasswordRules"
import { TextInput } from "@/components/auth/TextInput"
import { useEmbeddedAuth } from "@/hooks/auth/useEmbeddedAuth"
import { useOktaSso } from "@/hooks/auth/useOktaSso"
import { usePasswordValidation } from "@/hooks/auth/usePasswordValidation"
import { AuthService } from "@/services/authService"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect, useId, useState } from "react"
import { z } from "zod"

// Email validation schema
const emailSchema = z.string().email("Please enter a valid email address")

export const Route = createFileRoute("/login")({
	component: Login,
})

function Login() {
	const {
		loginWithEmailPassword,
		loginWithGoogle,
		signupWithEmailPassword,
		resetPassword,
		error: authError,
		clearError,
	} = useEmbeddedAuth()

	const { initiateOktaSso } = useOktaSso()
	const navigate = useNavigate()

	// Generate unique IDs for form inputs
	const oktaEmailId = useId()
	const signupEmailId = useId()
	const signupPasswordId = useId()
	const forgotEmailId = useId()
	const loginEmailId = useId()
	const loginPasswordId = useId()

	const [showPassword, setShowPassword] = useState(false)
	const [showOktaFlow, setShowOktaFlow] = useState(false)
	const [showSignupFlow, setShowSignupFlow] = useState(false)
	const [showForgotPasswordFlow, setShowForgotPasswordFlow] = useState(false)
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [errors, setErrors] = useState<{
		email?: string
		password?: string
		general?: string
		success?: string
	}>({})
	const [isLoading, setIsLoading] = useState(false)

	// Prefill error state and email if redirected with error params
	useEffect(() => {
		const params = new URLSearchParams(window.location.search)
		const urlError = params.get("error")
		const errorDescription = params.get("error_description")
		const flow = params.get("flow")
		const prefillEmail = params.get("email") || ""

		if (urlError) {
			setErrors({ general: errorDescription || "Authentication error" })
			if (flow === "okta") {
				setShowOktaFlow(true)
				if (prefillEmail) setEmail(prefillEmail)
			}
			// Clean up params once shown, to avoid stale state on refresh
			params.delete("error")
			params.delete("error_description")
			params.delete("flow")
			if (prefillEmail) params.delete("email")
			const newSearch = params.toString()
			const url = `${window.location.pathname}${newSearch ? `?${newSearch}` : ""}${window.location.hash}`
			window.history.replaceState({}, document.title, url)
		}
	}, [])

	// Redirect if already authenticated
	useEffect(() => {
		if (AuthService.isAuthenticated()) {
			const params = new URLSearchParams(window.location.search)
			const redirectTo = params.get("redirect") || "/"
			navigate({ to: redirectTo })
		}
	}, [navigate])

	// Password validation for signup
	const passwordValidation = usePasswordValidation(password)

	const handleEmailPasswordLogin = async (e: React.FormEvent) => {
		e.preventDefault()
		setErrors({})
		clearError()

		// Validate email
		try {
			emailSchema.parse(email)
		} catch (_) {
			setErrors({ email: "Please enter a valid email address" })
			return
		}

		if (!password) {
			setErrors({ password: "Password is required" })
			return
		}

		try {
			await loginWithEmailPassword(email, password)
			// On successful login, redirect
			const params = new URLSearchParams(window.location.search)
			const redirectTo = params.get("redirect") || "/"
			navigate({ to: redirectTo })
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: "Login failed. Please try again."
			setErrors({ general: errorMessage })
		}
	}

	const handleGoogleLogin = async (e?: React.MouseEvent) => {
		// Prevent any default button behavior
		if (e) {
			e.preventDefault()
			e.stopPropagation()
		}

		try {
			await loginWithGoogle()
		} catch (error) {
			console.error("Google login error:", error)
			const errorMessage =
				error instanceof Error
					? error.message
					: "Google login failed. Please try again."
			setErrors({ general: errorMessage })
		}
	}

	const handleOktaLogin = async () => {
		if (!email) {
			setErrors({ email: "Email is required" })
			return
		}

		try {
			emailSchema.parse(email)
		} catch (_) {
			setErrors({ email: "Please enter a valid email address" })
			return
		}

		try {
			setIsLoading(true)
			setErrors({}) // Clear any previous errors

			// initiateOktaSso now does a form submission and browser redirect
			// It will return a success message but the page will redirect
			await initiateOktaSso(email)

			// If we reach here, the form submission worked
			// The page should redirect shortly
			setErrors({
				success: `Redirecting to Okta SSO for ${email}...`,
			})
		} catch (error) {
			console.error("Okta SSO error:", error)
			const errorMessage =
				error instanceof Error
					? error.message
					: "Okta login failed. Please try again."
			setErrors({ general: errorMessage })
			setIsLoading(false)
		}
	}

	const handleBackToMainLogin = () => {
		setShowOktaFlow(false)
		setShowSignupFlow(false)
		setShowForgotPasswordFlow(false)
		setEmail("")
		setPassword("")
		setErrors({})
		clearError()
	}

	const handleSignup = async (e: React.FormEvent) => {
		e.preventDefault()
		setErrors({})
		clearError()

		// Validate email
		try {
			emailSchema.parse(email)
		} catch (_) {
			setErrors({ email: "Please enter a valid email address" })
			return
		}

		if (!password) {
			setErrors({ password: "Password is required" })
			return
		}

		// Check password validation
		if (!passwordValidation.isValid) {
			setErrors({ password: "Please meet all password requirements" })
			return
		}

		try {
			const result = await signupWithEmailPassword(email, password)
			// Show success message and stay on signup page
			setErrors({ success: result.message })
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: "Signup failed. Please try again."
			setErrors({ general: errorMessage })
		}
	}

	const handleForgotPassword = async (e: React.FormEvent) => {
		e.preventDefault()
		setErrors({})
		clearError()

		// Validate email
		try {
			emailSchema.parse(email)
		} catch (_) {
			setErrors({ email: "Please enter a valid email address" })
			return
		}

		try {
			setIsLoading(true)

			// Check if environment variables are set
			if (
				!import.meta.env.VITE_AUTH_0_DOMAIN_URL ||
				!import.meta.env.VITE_AUTH_0_CLIENT_ID
			) {
				throw new Error(
					"Auth0 configuration is missing. Please check environment variables.",
				)
			}

			try {
				// First try the AuthService.resetPassword method
				await resetPassword(email)
				setErrors({
					general: "Password reset email sent. Please check your inbox.",
				})
			} catch (sdkError) {
				console.warn(
					"Auth0 SDK method failed, trying direct HTTP approach:",
					sdkError,
				)

				// Fallback to direct HTTP approach
				const resetResponse = await fetch(
					`https://${import.meta.env.VITE_AUTH_0_DOMAIN_URL}/dbconnections/change_password`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							client_id: import.meta.env.VITE_AUTH_0_CLIENT_ID,
							email: email,
							connection: "Username-Password-Authentication",
						}),
					},
				)

				if (resetResponse.status === 200) {
					setErrors({
						general: "Password reset email sent. Please check your inbox.",
					})
				} else {
					throw new Error("Password reset failed with unexpected response")
				}
			}
		} catch (error) {
			console.error("Password reset error:", error)
			const errorMessage =
				error instanceof Error
					? error.message
					: "Password reset failed. Please try again."
			setErrors({
				general: errorMessage,
			})
		} finally {
			setIsLoading(false)
		}
	}

	if (showOktaFlow) {
		return (
			<div className="min-h-screen bg-purple-800 flex items-center justify-center p-4">
				<div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
					{/* Logo and Header */}
					<div className="text-center mb-8">
						<div className="flex justify-center mb-4">
							<VertisLogo className="h-8 w-auto" />
						</div>
						<h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome</h1>
						<p className="text-gray-600">Log in with your Okta account</p>
					</div>

					{/* Back Button */}
					<AuthButton
						variant="tertiary"
						onClick={handleBackToMainLogin}
						className="mb-6"
						disabled={isLoading}
					>
						← Back to login options
					</AuthButton>

					{/* Okta Email Input */}
					<form
						onSubmit={(e) => {
							e.preventDefault()
							handleOktaLogin()
						}}
					>
						<TextInput
							id={oktaEmailId}
							label="Email address*"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="Enter your email address"
							error={errors.email}
							disabled={isLoading}
							className="mb-6"
						/>

						{(errors.general || authError) && (
							<div className="mb-4 p-3 bg-red-100 border border-red-200 rounded-lg">
								<p className="text-sm text-red-300 font-medium">
									{errors.general || authError}
								</p>
							</div>
						)}
						{errors.success && (
							<div className="mb-4 p-3 bg-green-100 border border-green-400 rounded-lg">
								<p className="text-sm text-green-700 font-medium">
									{errors.success}
								</p>
							</div>
						)}

						<AuthButton
							type="submit"
							variant="primary"
							onClick={handleOktaLogin}
							disabled={isLoading}
							rightLoadingSpinner={isLoading}
							className="w-full mb-4"
						>
							Continue with Okta
						</AuthButton>
					</form>
				</div>
			</div>
		)
	}

	if (showSignupFlow) {
		return (
			<div className="min-h-screen bg-purple-800 flex items-center justify-center p-4">
				<div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
					{/* Logo and Header */}
					<div className="text-center mb-8">
						<div className="flex justify-center mb-4">
							<VertisLogo className="h-8 w-auto" />
						</div>
						<h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome</h1>
						<p className="text-gray-600">Sign Up to continue to Vertis.</p>
					</div>

					{/* Back Button */}
					<AuthButton
						variant="tertiary"
						onClick={handleBackToMainLogin}
						className="mb-6"
						disabled={isLoading}
					>
						← Back to login options
					</AuthButton>

					{/* Signup Form */}
					<form onSubmit={handleSignup}>
						<TextInput
							id={signupEmailId}
							label="Email address*"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="Enter your email address"
							error={errors.email}
							disabled={isLoading}
							className="mb-4"
						/>

						<TextInput
							id={signupPasswordId}
							label="Password*"
							type={showPassword ? "text" : "password"}
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="Create a password"
							error={errors.password}
							disabled={isLoading}
							iconRight={
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="text-gray-400 hover:text-gray-600"
								>
									{showPassword ? (
										<EyeOff className="h-5 w-5" />
									) : (
										<EyeOn className="h-5 w-5" />
									)}
								</button>
							}
							className="mb-4"
						/>

						{/* Password Rules */}
						<PasswordRules
							rules={passwordValidation.rules}
							showRules={passwordValidation.showRules}
						/>

						{(errors.general || authError) && (
							<div className="mb-4 p-3 bg-red-100 border border-red-200 rounded-lg">
								<p className="text-sm text-red-300 font-medium">
									{errors.general || authError}
								</p>
							</div>
						)}
						{errors.success && (
							<div className="mb-4 p-3 bg-green-100 border border-green-400 rounded-lg">
								<p className="text-sm text-green-700 font-medium">
									{errors.success}
								</p>
							</div>
						)}

						<AuthButton
							type="submit"
							variant="primary"
							disabled={
								isLoading || !passwordValidation.isValid || !!errors.success
							}
							rightLoadingSpinner={isLoading}
							className="w-full mb-4"
						>
							Continue
						</AuthButton>
					</form>

					{/* Sign Up Link */}
					<div className="text-center mt-4">
						<span className="text-gray-600 text-sm">
							Already have an account?{" "}
						</span>
						<button
							type="button"
							onClick={handleBackToMainLogin}
							className="text-blue-600 hover:text-blue-800 underline text-sm font-medium transition-colors duration-200"
							disabled={isLoading}
						>
							Log in
						</button>
					</div>
				</div>
			</div>
		)
	}

	if (showForgotPasswordFlow) {
		return (
			<div className="min-h-screen bg-purple-800 flex items-center justify-center p-4">
				<div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
					{/* Logo and Header */}
					<div className="text-center mb-8">
						<div className="flex justify-center mb-4">
							<VertisLogo className="h-8 w-auto" />
						</div>
						<h1 className="text-2xl font-bold text-gray-900 mb-2">
							Reset Password
						</h1>
						<p className="text-gray-600">
							Enter your email to receive a reset link
						</p>
					</div>

					{/* Back Button */}
					<AuthButton
						variant="tertiary"
						onClick={handleBackToMainLogin}
						className="mb-6"
						disabled={isLoading}
					>
						← Back to login options
					</AuthButton>

					{/* Forgot Password Form */}
					<form onSubmit={handleForgotPassword}>
						<TextInput
							id={forgotEmailId}
							label="Email address*"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="Enter your email address"
							error={errors.email}
							disabled={isLoading}
							className="mb-6"
						/>

						{(errors.general || authError) && (
							<div className="mb-4 p-3 bg-red-100 border border-red-200 rounded-lg">
								<p className="text-sm text-red-300 font-medium">
									{errors.general || authError}
								</p>
							</div>
						)}

						<AuthButton
							type="submit"
							variant="primary"
							disabled={isLoading}
							rightLoadingSpinner={isLoading}
							className="w-full mb-4"
						>
							Send Reset Link
						</AuthButton>
					</form>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-purple-800 flex items-center justify-center p-4">
			<div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
				{/* Logo and Header */}
				<div className="text-center mb-8">
					<div className="flex justify-center mb-4">
						<VertisLogo className="h-8 w-auto" />
					</div>
					<h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome</h1>
					<p className="text-gray-600">Log in to continue to Vertis.</p>
				</div>

				{/* Email/Password Form */}
				<form onSubmit={handleEmailPasswordLogin} className="mb-2">
					<TextInput
						id={loginEmailId}
						label="Email address*"
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="Enter your email address"
						error={errors.email}
						disabled={isLoading}
						className="mb-4"
					/>

					<TextInput
						id={loginPasswordId}
						label="Password*"
						type={showPassword ? "text" : "password"}
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder="Enter your password"
						error={errors.password}
						disabled={isLoading}
						iconRight={
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="text-gray-400 hover:text-gray-600"
							>
								{showPassword ? (
									<EyeOff className="h-5 w-5" />
								) : (
									<EyeOn className="h-5 w-5" />
								)}
							</button>
						}
						className="mb-4"
					/>

					{(errors.general || authError) && (
						<div className="mb-4 p-3 bg-red-100 border border-red-200 rounded-lg">
							<p className="text-sm text-red-300 font-medium">
								{errors.general || authError}
							</p>
						</div>
					)}

					<AuthButton
						type="submit"
						variant="primary"
						disabled={isLoading}
						rightLoadingSpinner={isLoading}
						className="w-full mb-2"
					>
						Continue
					</AuthButton>
				</form>

				{/* Forgot Password Link */}
				<div className="text-left mb-4">
					<button
						type="button"
						onClick={() => setShowForgotPasswordFlow(true)}
						className="text-blue-600 hover:text-blue-800 underline text-sm font-medium transition-colors duration-200"
						disabled={isLoading}
					>
						Forgot password?
					</button>
				</div>

				{/* Separator */}
				<div className="relative mb-4">
					<div className="absolute inset-0 flex items-center">
						<div className="w-full border-t border-gray-300" />
					</div>
					<div className="relative flex justify-center text-sm">
						<span className="px-2 bg-white text-gray-500">OR</span>
					</div>
				</div>

				{/* Google Login Button */}
				<AuthButton
					variant="line"
					onClick={handleGoogleLogin}
					disabled={isLoading}
					className="w-full mb-4"
					iconLeft={
						<svg
							className="w-5 h-5"
							viewBox="0 0 24 24"
							aria-label="Google logo"
							role="img"
						>
							<path
								fill="#4285F4"
								d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
							/>
							<path
								fill="#34A853"
								d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
							/>
							<path
								fill="#FBBC05"
								d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
							/>
							<path
								fill="#EA4335"
								d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
							/>
						</svg>
					}
				>
					Continue with Google
				</AuthButton>

				{/* Okta Login Button */}
				<AuthButton
					variant="line"
					onClick={() => setShowOktaFlow(true)}
					disabled={isLoading}
					className="w-full mb-6"
					iconLeft={
						<svg
							className="w-5 h-5"
							viewBox="0 0 24 24"
							fill="currentColor"
							aria-label="Checkmark"
							role="img"
						>
							<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
						</svg>
					}
				>
					Continue with Okta
				</AuthButton>

				{/* Sign Up Link */}
				<div className="text-center">
					<span className="text-gray-600 text-sm">Don't have an account? </span>
					<button
						type="button"
						onClick={() => setShowSignupFlow(true)}
						className="text-blue-600 hover:text-blue-800 underline text-sm font-medium transition-colors duration-200"
						disabled={isLoading}
					>
						Sign up
					</button>
				</div>
			</div>
		</div>
	)
}
