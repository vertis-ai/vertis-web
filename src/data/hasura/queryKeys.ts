/**
 * Centralized Hasura query key factories
 *
 * This file provides a hierarchical structure for all Hasura query keys.
 * Using these factories ensures consistency across loaders, components,
 * and cache invalidation logic.
 *
 * Pattern:
 * - Top level: ['hasura']
 * - Feature level: ['hasura', 'users']
 * - Operation level: ['hasura', 'users', 'detail', id]
 *
 * Benefits:
 * - Type-safe query keys
 * - Easy to invalidate entire feature domains
 * - Clear dependency tracking
 * - Prevents typos and mismatches
 *
 * Usage:
 * ```ts
 * // In query options
 * const userDetailQuery = (id: string, request?: Request) =>
 *   createHasuraQueryOptions({
 *     document: UserDetailDocument,
 *     variables: { id },
 *     request,
 *     queryKey: hasuraKeys.users.detail(id), // explicit key
 *   })
 *
 * // For invalidation
 * queryClient.invalidateQueries({ queryKey: hasuraKeys.users.all() })
 * queryClient.invalidateQueries({ queryKey: hasuraKeys.users.detail(userId) })
 * ```
 */

export const hasuraKeys = {
	/**
	 * Root key for all Hasura queries
	 * Use this to invalidate ALL Hasura data at once (rare)
	 */
	all: ["hasura"] as const,

	/**
	 * System/health queries
	 */
	system: {
		all: () => [...hasuraKeys.all, "system"] as const,
		ping: () => [...hasuraKeys.system.all(), "ping"] as const,
	},

	/**
	 * User-related queries
	 * Example structure - expand as needed
	 */
	users: {
		all: () => [...hasuraKeys.all, "users"] as const,
		lists: () => [...hasuraKeys.users.all(), "list"] as const,
		list: (filters?: { role?: string; status?: string; search?: string }) =>
			[...hasuraKeys.users.lists(), filters] as const,
		details: () => [...hasuraKeys.users.all(), "detail"] as const,
		detail: (id: string) => [...hasuraKeys.users.details(), id] as const,
	},

	/**
	 * Chat/messaging queries
	 * Example structure - expand as needed
	 */
	chat: {
		all: () => [...hasuraKeys.all, "chat"] as const,
		rooms: () => [...hasuraKeys.chat.all(), "rooms"] as const,
		room: (roomId: string) => [...hasuraKeys.chat.rooms(), roomId] as const,
		messages: (roomId: string) =>
			[...hasuraKeys.chat.room(roomId), "messages"] as const,
	},

	/**
	 * Organization/tenant queries
	 * Example structure - expand as needed
	 */
	organizations: {
		all: () => [...hasuraKeys.all, "organizations"] as const,
		lists: () => [...hasuraKeys.organizations.all(), "list"] as const,
		list: (filters?: { search?: string }) =>
			[...hasuraKeys.organizations.lists(), filters] as const,
		details: () => [...hasuraKeys.organizations.all(), "detail"] as const,
		detail: (id: string) =>
			[...hasuraKeys.organizations.details(), id] as const,
	},

	/**
	 * Add more feature domains as needed:
	 *
	 * products: {
	 *   all: () => [...hasuraKeys.all, 'products'] as const,
	 *   list: (filters?: ProductFilters) => [...hasuraKeys.products.all(), 'list', filters] as const,
	 *   detail: (id: string) => [...hasuraKeys.products.all(), 'detail', id] as const,
	 * },
	 *
	 * reports: {
	 *   all: () => [...hasuraKeys.all, 'reports'] as const,
	 *   list: () => [...hasuraKeys.reports.all(), 'list'] as const,
	 *   detail: (id: string) => [...hasuraKeys.reports.all(), 'detail', id] as const,
	 * },
	 */
}

/**
 * Helper type to extract query key from a factory function
 * Useful for typing queryClient.invalidateQueries calls
 */
export type HasuraQueryKey = ReturnType<
	(typeof hasuraKeys)[keyof typeof hasuraKeys] extends (
		...args: unknown[]
	) => unknown
		? (typeof hasuraKeys)[keyof typeof hasuraKeys]
		: never
>
