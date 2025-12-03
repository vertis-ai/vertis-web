import { VertisLogo } from "@/components/auth/icons/VertisLogo"
import { IconButton } from "@/components/common/IconButton"
import { BentoBoxIcon, SettingsIcon } from "@/components/icons"
import { Link } from "@tanstack/react-router"

export default function Header() {
	return (
		<header className="w-full h-16 bg-(--color--white) shadow-[0px_2px_8px_0px_rgba(0,0,0,0.05)] relative flex items-center justify-between px-4">
			{/* Left Section: Menu Icon + Logo */}
			<div className="flex items-center gap-3">
				<IconButton aria-label="Menu">
					<BentoBoxIcon className="w-10 h-10 text-(--color-purple-300)" />
				</IconButton>
				<Link to="/" className="flex items-center" aria-label="Vertis Home">
					<VertisLogo className="h-8" />
				</Link>
			</div>

			{/* Right Section: Settings Icon */}
			<div className="flex items-center">
				<IconButton aria-label="Settings">
					<SettingsIcon className="w-8 h-8 text-(--color-purple-300)" />
				</IconButton>
			</div>
		</header>
	)
}
