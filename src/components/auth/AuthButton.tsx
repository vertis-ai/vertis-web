import { cn } from "@/lib/utils"
import { forwardRef, type ReactNode } from "react"

export type ButtonVariant =
	| "primary"
	| "secondary"
	| "tertiary"
	| "line"
	| "white"
	| "whiteWithOutline"

interface BaseButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	iconLeft?: ReactNode
	iconRight?: ReactNode
	variant?: ButtonVariant
	destructive?: boolean
	narrow?: boolean
	children: string | ReactNode
	noPadding?: boolean
	rightLoadingSpinner?: boolean
	leftLoadingSpinner?: boolean
	bold?: boolean
	pulse?: boolean
	innerClassName?: string
}

interface SubmitButtonProps extends Omit<BaseButtonProps, "onClick"> {
	onClick?: BaseButtonProps["onClick"]
}

type ButtonProps = BaseButtonProps | SubmitButtonProps

export const AuthButton = forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{
			iconLeft,
			iconRight,
			variant = "primary",
			children,
			destructive,
			narrow = false,
			className,
			innerClassName,
			noPadding,
			rightLoadingSpinner,
			leftLoadingSpinner,
			pulse = false,
			bold = true,
			...props
		},
		ref,
	) => {
		const isDisabled = props.disabled

		const disabledStyles =
			"bg-neutral-300 text-neutral-500 hover:cursor-not-allowed"

		const destructiveStyles = {
			primary: "bg-red-400 text-white hover:bg-red-300 group-focus:bg-red-300",
			secondary:
				"bg-red-100 text-red-400 hover:bg-red-200 group-focus:bg-red-200",
			tertiary:
				"bg-transparent text-red-400 hover:bg-red-200 group-focus:bg-red-200",
			line: "bg-red-100 text-red-400 hover:bg-red-200 group-focus:bg-red-200 border border-solid border-red-400",
			white: "bg-white text-blue-400 hover:bg-blue-200 group-focus:bg-blue-200",
			whiteWithOutline:
				"bg-red-400 text-white hover:bg-red-300 group-focus:bg-red-300",
		}

		const spanStyles = {
			primary:
				"text-white bg-blue-400 group-focus:bg-blue-300 hover:bg-blue-300",
			secondary:
				"bg-blue-100 text-blue-400 hover:bg-blue-200 group-focus:bg-blue-200",
			tertiary:
				"bg-transparent text-blue-400 hover:bg-blue-200 group-focus:bg-blue-200",
			line: "bg-transparent text-blue-400 hover:bg-blue-200 group-focus:bg-blue-200 border border-solid border-blue-400",
			white: "bg-white text-blue-400 hover:bg-blue-200 group-focus:bg-blue-200",
			whiteWithOutline:
				"text-blue-400 bg-white group-focus:bg-blue-300 hover:bg-blue-200 group-focus:bg-blue-200 border border-solid border-blue-400",
		}

		const borderFocusStyles = destructive
			? "focus:border-red-400 focus:outline-none"
			: "focus:border-blue-400 focus:outline-none"

		const padding = {
			primary: "py-3 px-4",
			secondary: "py-3 px-4",
			tertiary: "py-1.5 px-2",
			line: "px-4 py-3",
			white: "py-1.5 px-2",
			whiteWithOutline: "py-1.5 px-2",
		}

		const destructiveLineSpanStyles =
			destructive && variant === "line" && "border-red-400"

		return (
			<button
				ref={ref}
				className={cn(
					`group h-fit rounded-lg bg-transparent text-sm ${
						narrow ? "" : "p-0.5 border-solid border-transparent border-2"
					} hover:cursor-pointer`,
					borderFocusStyles,
					pulse ? "animate-pulse" : "",
					className,
				)}
				type="button"
				{...props}
			>
				<span
					className={cn(
						"flex items-center justify-center gap-2.5 rounded-lg my-auto",
						!noPadding ? padding[variant] : "",
						isDisabled
							? disabledStyles
							: destructive
								? destructiveStyles[variant]
								: spanStyles[variant],
						destructiveLineSpanStyles,
						bold ? "font-bold" : "font-normal",
						innerClassName,
					)}
				>
					{leftLoadingSpinner && (
						<div className="relative top-[3px] w-fit">
							<div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
						</div>
					)}
					{iconLeft && <span className="flex">{iconLeft}</span>}
					<span className="flex w-fit">{children}</span>
					{iconRight && <span className="flex">{iconRight}</span>}
					{rightLoadingSpinner && (
						<div className="relative top-[3px] w-fit">
							<div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
						</div>
					)}
				</span>
			</button>
		)
	},
)

AuthButton.displayName = "AuthButton"
