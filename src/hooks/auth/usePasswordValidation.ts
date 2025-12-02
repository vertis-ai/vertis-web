import { useMemo } from "react"

export interface PasswordRule {
	id: string
	message: string
	regex: RegExp
	isMatching: boolean
}

export interface PasswordValidationResult {
	rules: PasswordRule[]
	isValid: boolean
	showRules: boolean
}

export const usePasswordValidation = (
	password: string,
): PasswordValidationResult => {
	const rules = useMemo<PasswordRule[]>(
		() => [
			{
				id: "length",
				message: "At least 8 characters",
				regex: /.{8,}/,
				isMatching: false,
			},
			{
				id: "lowercase",
				message: "Lower case letters (a-z)",
				regex: /[a-z]/,
				isMatching: false,
			},
			{
				id: "uppercase",
				message: "Upper case letters (A-Z)",
				regex: /[A-Z]/,
				isMatching: false,
			},
			{
				id: "numbers",
				message: "Numbers (0-9)",
				regex: /[0-9]/,
				isMatching: false,
			},
			{
				id: "special",
				message: "Special characters (e.g. !@#$%^&*)",
				regex: /[~!@#$%^&*()_+{}|:"<>?`\-=[\]\\;',./]/,
				isMatching: false,
			},
		],
		[],
	)

	const validationResult = useMemo(() => {
		// Only show rules when user starts typing
		const showRules = password.length > 0

		// Update rule matching status
		const updatedRules = rules.map((rule) => ({
			...rule,
			isMatching: rule.regex.test(password),
		}))

		// Check if at least 3 of the 4 character type rules are met (excluding length)
		const characterRules = updatedRules.filter((rule) => rule.id !== "length")
		const metCharacterRules = characterRules.filter(
			(rule) => rule.isMatching,
		).length
		const lengthRule = updatedRules.find((rule) => rule.id === "length")

		const isValid = Boolean(lengthRule?.isMatching) && metCharacterRules >= 3

		return {
			rules: updatedRules,
			isValid,
			showRules,
		}
	}, [password, rules])

	return validationResult
}
