import type { SVGProps } from "react"

type Props = SVGProps<SVGSVGElement>

export const Check = (props: Props) => (
	<svg
		width="12"
		height="12"
		viewBox="0 0 12 12"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		aria-label="Check"
		role="img"
		{...props}
	>
		<path
			d="M10 3L4.5 8.5L2 6"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
)
