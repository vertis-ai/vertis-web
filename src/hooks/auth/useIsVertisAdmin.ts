import { getCurrentUserDetailsQuery } from "@/data/hasura/queries/users/getCurrentUserDetails-options"
import { useSuspenseQuery } from "@tanstack/react-query"

/**
 * Hook to check if the current user is a Vertis admin
 * Reads from the prefetched user data cache (no additional network request)
 *
 * @param vertisUserId - The Vertis user ID to check (required)
 * @returns boolean - true if user is Vertis admin, false otherwise
 *
 * @example
 * function MyComponent() {
 *   const vertisUserId = getUserIdSomehow()
 *   if (!vertisUserId) return null
 *
 *   const isVertisAdmin = useIsVertisAdmin(vertisUserId)
 *   if (!isVertisAdmin) return null
 *   return <AdminOnlyFeature />
 * }
 */
export function useIsVertisAdmin(vertisUserId: string): boolean {
	const { data } = useSuspenseQuery(getCurrentUserDetailsQuery(vertisUserId))

	return data?.core_user_by_pk?.is_vertis_admin ?? false
}
