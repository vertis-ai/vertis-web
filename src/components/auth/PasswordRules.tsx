import type { PasswordRule } from "../../hooks/auth/usePasswordValidation"
import { Check } from "./icons/Check"

interface PasswordRulesProps {
	rules: PasswordRule[]
	showRules: boolean
}

export const PasswordRules = ({ rules, showRules }: PasswordRulesProps) => {
	if (!showRules) return null

	return (
		<div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
			<p className="text-sm font-medium text-gray-700 mb-3">
				Your password must contain:
			</p>

			<div className="space-y-2">
				{/* Length rule */}
				<div className="flex items-center">
					<div
						className={`flex items-center justify-center w-4 h-4 mr-3 rounded-full ${
							rules.find((r) => r.id === "length")?.isMatching
								? "bg-success-400"
								: "bg-gray-300"
						}`}
					>
						{rules.find((r) => r.id === "length")?.isMatching && (
							<Check className="w-3 h-3 text-white" />
						)}
					</div>
					<span
						className={`text-sm ${
							rules.find((r) => r.id === "length")?.isMatching
								? "text-success-700 font-medium"
								: "text-gray-600"
						}`}
					>
						At least 8 characters
					</span>
				</div>

				<p className="text-sm font-medium text-gray-700 mt-4 mb-3">
					At least 3 of the following:
				</p>

				{/* Character type rules */}
				{rules
					.filter((rule) => rule.id !== "length")
					.map((rule) => (
						<div key={rule.id} className="flex items-center">
							<div
								className={`flex items-center justify-center w-4 h-4 mr-3 rounded-full ${
									rule.isMatching ? "bg-success-400" : "bg-gray-300"
								}`}
							>
								{rule.isMatching && <Check className="w-3 h-3 text-white" />}
							</div>
							<span
								className={`text-sm ${
									rule.isMatching
										? "text-success-700 font-medium"
										: "text-gray-600"
								}`}
							>
								{rule.message}
							</span>
						</div>
					))}
			</div>
		</div>
	)
}
