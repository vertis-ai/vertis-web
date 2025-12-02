import { cn } from "@/lib/utils"
import { forwardRef, type ReactNode } from "react"

export type TextInputProps = {
	label: string | ReactNode
	showLabel?: boolean
	id: string
	iconRight?: ReactNode
	iconLeft?: ReactNode
	error?: string
	prefix?: string
} & React.ComponentPropsWithoutRef<"input">

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
	(
		{
			label,
			showLabel,
			id,
			iconRight,
			iconLeft,
			error,
			prefix,
			className,
			...props
		},
		ref,
	) => {
		return (
			<div className={cn("flex w-full flex-col gap-2", className)}>
				<label
					htmlFor={id}
					className={cn(
						"text-xs text-purple-800 text-left",
						showLabel ? "block" : "sr-only",
					)}
				>
					{label}
				</label>
				<span className="relative box-border w-full">
					{iconLeft && (
						<span
							style={{
								transform: "translateY(-50%)",
							}}
							className="absolute left-3 top-1/2 flex text-purple-300"
						>
							{iconLeft}
						</span>
					)}
					{prefix && (
						<span
							style={{
								transform: "translateY(-50%)",
							}}
							className={`absolute left-3 top-1/2 mt-px flex ${
								props.disabled ? "text-neutral-500" : "text-purple-800"
							}`}
						>
							{prefix}
						</span>
					)}
					<input
						id={id}
						className={cn(
							"focus:not(:focus-visible):outline-none w-full rounded-lg border border-solid border-purple-200 placeholder:text-purple-300 focus:outline-none",
							iconLeft ? "py-3 pr-2.5 pl-10" : "py-3 px-2.5",
							prefix ? "py-3 pr-2.5 pl-5" : "py-3 px-2.5",
							error
								? "border-red-400 focus:outline-red-400"
								: "focus:outline-blue-400",
							props.disabled
								? "cursor-not-allowed text-neutral-500"
								: "text-purple-800",
						)}
						ref={ref}
						{...props}
					/>
					{iconRight && (
						<span
							style={{
								transform: "translateY(-50%)",
							}}
							className="absolute right-3 top-1/2 flex text-purple-300"
						>
							{iconRight}
						</span>
					)}
				</span>
				{error && <p className="text-xs text-red-400 text-left">{error}</p>}
			</div>
		)
	},
)

TextInput.displayName = "TextInput"
