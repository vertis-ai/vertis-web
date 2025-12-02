import type { SVGProps } from "react"

type Props = SVGProps<SVGSVGElement>

export const EyeOff = (props: Props) => (
	<svg
		width="17"
		height="16"
		viewBox="0 0 17 16"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		aria-label="Hide password"
		role="img"
		{...props}
	>
		<path
			d="M1.75 1L15.25 14.5"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
		<path
			d="M7.43785 6.69031C7.15639 6.97157 6.99819 7.35312 6.99805 7.75103C6.99791 8.14893 7.15584 8.5306 7.4371 8.81206C7.71836 9.09352 8.09991 9.25172 8.49782 9.25186C8.89573 9.252 9.27739 9.09407 9.55885 8.81281"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
		<path
			d="M12.5178 11.7618C11.2945 12.5868 9.9565 13 8.5 13C5.5 13 3.00025 11.2503 1 7.75004C2.02675 5.95379 3.18475 4.61879 4.474 3.74429M6.52225 2.77379C7.16531 2.58984 7.83115 2.49768 8.5 2.50004C11.5 2.50004 13.9997 4.24979 16 7.75004C15.4165 8.77079 14.791 9.64304 14.1227 10.366L6.52225 2.77379Z"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
)
