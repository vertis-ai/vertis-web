import { cn } from "@/lib/utils"
import type { ButtonHTMLAttributes, ReactNode } from "react"

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	children: ReactNode
	size?: "sm" | "md" | "lg"
	variant?: "default" | "ghost"
}

const sizeClasses = {
	sm: "w-8 h-8",
	md: "w-10 h-10",
	lg: "w-12 h-12",
}

export function IconButton({
	children,
	size = "md",
	variant = "default",
	className,
	...props
}: IconButtonProps) {
	return (
		<button
			type="button"
			className={cn(
				// Base styles
				"rounded-full flex items-center justify-center",
				"transition-colors cursor-pointer",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--action-blue) focus-visible:ring-offset-2",
				"disabled:pointer-events-none disabled:opacity-50",
				// Size
				sizeClasses[size],
				// Variant
				variant === "default" &&
					"hover:bg-(--color-purple-100) active:bg-(--color-purple-200)",
				variant === "ghost" && "hover:bg-(--color-purple-100)/50",
				className,
			)}
			{...props}
		>
			{children}
		</button>
	)
}
