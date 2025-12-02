import type { SVGProps } from "react"

type Props = SVGProps<SVGSVGElement>

export const EyeOn = (props: Props) => (
	<svg
		width="17"
		height="17"
		viewBox="0 0 17 17"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		aria-label="Show password"
		role="img"
		{...props}
	>
		<path
			d="M8.50004 9.91665C9.28244 9.91665 9.91671 9.28238 9.91671 8.49998C9.91671 7.71758 9.28244 7.08331 8.50004 7.08331C7.71764 7.08331 7.08337 7.71758 7.08337 8.49998C7.08337 9.28238 7.71764 9.91665 8.50004 9.91665Z"
			stroke={props.stroke ? props.stroke : "currentColor"}
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
		<path
			d="M15.5833 8.50002C13.6942 11.8058 11.3333 13.4584 8.49996 13.4584C5.66663 13.4584 3.30575 11.8058 1.41663 8.50002C3.30575 5.19423 5.66663 3.54169 8.49996 3.54169C11.3333 3.54169 13.6942 5.19423 15.5833 8.50002Z"
			stroke={props.stroke ? props.stroke : "currentColor"}
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
)
