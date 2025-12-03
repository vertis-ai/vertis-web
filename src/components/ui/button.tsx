import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import type * as React from "react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all disabled:pointer-events-none disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
	{
		variants: {
			variant: {
				default:
					"bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-[#C5C5E8] disabled:text-purple-400",
				destructive:
					"bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 disabled:bg-[#C5C5E8] disabled:text-purple-400",
				outline:
					"border border-primary bg-background text-primary hover:bg-primary/10 dark:bg-input/30 dark:border-primary dark:hover:bg-primary/20 disabled:bg-[#C5C5E8] disabled:text-purple-400 disabled:border-[#C5C5E8]",
				secondary:
					"bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:bg-[#C5C5E8] disabled:text-purple-400",
				ghost:
					"hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 disabled:bg-[#C5C5E8] disabled:text-purple-400",
				link: "text-primary underline-offset-4 hover:underline disabled:bg-[#C5C5E8] disabled:text-purple-400",
			},
			size: {
				default: "h-[46px] px-4 py-3 has-[>svg]:px-3",
				sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
				lg: "h-12 rounded-md px-6 has-[>svg]:px-4",
				icon: "size-9",
				"icon-sm": "size-8",
				"icon-lg": "size-10",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
)

function Button({
	className,
	variant,
	size,
	asChild = false,
	type = "button",
	...props
}: React.ComponentProps<"button"> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean
	}) {
	const Comp = asChild ? Slot : "button"

	return (
		<Comp
			{...(asChild ? {} : { type })}
			data-slot="button"
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	)
}

export { Button, buttonVariants }
