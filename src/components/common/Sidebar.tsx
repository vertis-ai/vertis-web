import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion"
import { Link } from "@tanstack/react-router"
import { ChevronRight } from "lucide-react"

export function Sidebar() {
	return (
		<aside className="w-72 h-full bg-(--color--white) border-r border-(--color-purple-200) flex flex-col overflow-y-auto">
			{/* Sidebar Content */}
			<div className="pt-[1.4375rem] px-5">
				{/* Top Action Links - 10px spacing */}
				<div className="space-y-[0.625rem]">
					<Link
						to="/"
						className="block text-sm text-(--color-vertis-purple-lt) hover:text-(--action-blue) transition-colors"
					>
						New Chat
					</Link>
					<Link
						to="/"
						className="block text-sm text-(--color-vertis-purple-lt) hover:text-(--action-blue) transition-colors"
					>
						Persona Chat
					</Link>
				</div>

				{/* Chats Section Title - 34px spacing */}
				<h2 className="mt-[2.125rem] text-lg font-bold text-(--color-vertis-purple)">
					Chats
				</h2>

				{/* Search Chats Link */}
				<Link
					to="/"
					className="block mt-4 text-sm text-(--color-vertis-purple-lt) hover:text-(--action-blue) transition-colors"
				>
					Search Chats
				</Link>

				{/* Accordions Section - 34px spacing between sections */}
				<Accordion type="multiple" className="mt-[2.125rem] space-y-[2.125rem]">
					{/* Workplace Persona Accordion */}
					<AccordionItem value="workplace" className="border-none">
						<AccordionTrigger className="py-0 px-0 hover:no-underline text-xs font-bold text-(--color-vertis-purple-lt) hover:text-(--action-blue) [&[data-state=open]>svg]:rotate-90 [&>svg:last-child]:hidden">
							<div className="flex items-center justify-between w-full">
								<span>Workplace Persona</span>
								<ChevronRight size={14} className="text-(--action-blue)" />
							</div>
						</AccordionTrigger>
						<AccordionContent className="pt-2 pb-0 space-y-2">
							<Link
								to="/"
								className="block text-sm text-(--color-vertis-purple-lt) hover:text-(--action-blue) transition-colors leading-5"
							>
								Office Commutes
							</Link>
							<Link
								to="/"
								className="block text-sm text-(--color-vertis-purple-lt) hover:text-(--action-blue) transition-colors leading-5"
							>
								Office Commute Insights
							</Link>
							<Link
								to="/"
								className="block text-sm text-(--color-vertis-purple-lt) hover:text-(--action-blue) transition-colors leading-5"
							>
								Pittsburgh Workforce
							</Link>
							<Link
								to="/"
								className="block text-sm text-(--color-vertis-purple-lt) hover:text-(--action-blue) transition-colors leading-5"
							>
								Florida Office Leases
							</Link>
							<Link
								to="/"
								className="block text-sm text-(--color-vertis-purple-lt) hover:text-(--action-blue) transition-colors leading-5"
							>
								California Office Closures
							</Link>
							<Link
								to="/"
								className="block text-sm text-(--action-blue) hover:underline transition-colors leading-5"
							>
								View all
							</Link>
						</AccordionContent>
					</AccordionItem>

					{/* Workforce Persona Accordion */}
					<AccordionItem value="workforce" className="border-none">
						<AccordionTrigger className="py-0 px-0 hover:no-underline text-xs font-bold text-(--color-vertis-purple-lt) hover:text-(--action-blue) [&[data-state=open]>svg]:rotate-90 [&>svg:last-child]:hidden">
							<div className="flex items-center justify-between w-full">
								<span>Workforce Persona</span>
								<ChevronRight size={14} className="text-(--action-blue)" />
							</div>
						</AccordionTrigger>
						<AccordionContent className="pt-2 pb-0 space-y-2">
							<Link
								to="/"
								className="block text-sm text-(--color-vertis-purple-lt) hover:text-(--action-blue) transition-colors leading-5"
							>
								Workplace 2025 Outlook
							</Link>
							<Link
								to="/"
								className="block text-sm text-(--color-vertis-purple-lt) hover:text-(--action-blue) transition-colors leading-5"
							>
								Workplace Chat Dec 2024
							</Link>
						</AccordionContent>
					</AccordionItem>

					{/* Vertis Chats Accordion */}
					<AccordionItem value="vertis" className="border-none">
						<AccordionTrigger className="py-0 px-0 hover:no-underline text-xs font-bold text-(--color-vertis-purple-lt) hover:text-(--action-blue) [&[data-state=open]>svg]:rotate-90 [&>svg:last-child]:hidden">
							<div className="flex items-center justify-between w-full">
								<span>Vertis Chats</span>
								<ChevronRight size={14} className="text-(--action-blue)" />
							</div>
						</AccordionTrigger>
						<AccordionContent className="pt-2 pb-0 space-y-2">
							<Link
								to="/"
								className="block text-sm text-(--color-vertis-purple-lt) hover:text-(--action-blue) transition-colors leading-5"
							>
								Charting Phila
							</Link>
							<Link
								to="/"
								className="block text-sm text-(--color-vertis-purple-lt) hover:text-(--action-blue) transition-colors leading-5"
							>
								Boston CSV
							</Link>
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			</div>
		</aside>
	)
}
