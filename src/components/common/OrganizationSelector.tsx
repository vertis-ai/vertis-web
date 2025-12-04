import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { getCurrentUserDetailsQuery } from "@/data/hasura/queries/users/getCurrentUserDetails-options"
import { updateCurrentUserDetailsMutationOptions } from "@/data/hasura/queries/users/updateCurrentUserDetails-options"
import { useIsVertisAdmin } from "@/hooks/auth/useIsVertisAdmin"
import { AuthService } from "@/services/authService"
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query"
import { useCallback } from "react"

function OrganizationSelectorContent({
	vertisUserId,
}: {
	vertisUserId: string
}) {
	// Call all hooks at the top (React rules of hooks)
	const isVertisAdmin = useIsVertisAdmin(vertisUserId)
	const queryClient = useQueryClient()
	const { data } = useSuspenseQuery(getCurrentUserDetailsQuery(vertisUserId))
	const { mutate: updateOrganization, isPending } = useMutation({
		...updateCurrentUserDetailsMutationOptions(),
		onSuccess: () => {
			// Invalidate the query cache to refetch user details
			queryClient.invalidateQueries({
				queryKey: getCurrentUserDetailsQuery(vertisUserId).queryKey,
			})
		},
	})

	const user = data?.core_user_by_pk
	const assignedOrganizations =
		user?.assigned_orgs?.map((ao) => ({
			id: ao.organization?.id ?? "",
			name: ao.organization?.name ?? "",
		})) ?? []

	const selectedOrganizationId = user?.selected_organization_id
	const currentOrganization = assignedOrganizations.find(
		(org) => org.id === selectedOrganizationId,
	)

	const handleOrganizationChange = useCallback(
		(value: string) => {
			if (value === selectedOrganizationId || isPending) return

			updateOrganization({
				vertisUserId,
				userDetails: {
					selected_organization_id: value,
				},
			})
		},
		[selectedOrganizationId, isPending, updateOrganization, vertisUserId],
	)

	// Only show to Vertis admins (after all hooks are called)
	if (!isVertisAdmin) {
		return null
	}

	if (!currentOrganization && assignedOrganizations.length === 0) {
		return (
			<button
				type="button"
				className="text-sm text-purple-600 hover:text-purple-700"
			>
				Create Organization
			</button>
		)
	}

	return (
		<Select
			value={selectedOrganizationId ?? ""}
			onValueChange={handleOrganizationChange}
			disabled={isPending}
		>
			<SelectTrigger className="w-[200px]">
				<SelectValue placeholder="No Org Selected">
					{isPending
						? "Switching..."
						: (currentOrganization?.name ?? "No Org Selected")}
				</SelectValue>
			</SelectTrigger>
			<SelectContent>
				{assignedOrganizations.map((org) => (
					<SelectItem key={org.id} value={org.id}>
						{org.name}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	)
}

export function OrganizationSelector() {
	const userInfo = AuthService.getUserInfo()
	const vertisUserId =
		userInfo?.vertis_user_id ||
		(userInfo?.hasura_claims?.["x-hasura-vertis-user-id"] as string) ||
		""

	if (!vertisUserId) {
		return null
	}

	return <OrganizationSelectorContent vertisUserId={vertisUserId} />
}
