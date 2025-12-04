import { hasuraKeys } from "@/data/hasura/queryKeys"
import { createHasuraQueryOptions } from "@/integrations/hasura/query-options"
import type {
	GetCurrentUserDetailsQuery,
	GetCurrentUserDetailsQueryVariables,
} from "@/data/hasura/__generated__/index"
import { GetCurrentUserDetailsDocument } from "@/data/hasura/__generated__/index"

export function getCurrentUserDetailsQuery(
	vertisUserId: string,
	request?: Request,
) {
	return createHasuraQueryOptions<
		GetCurrentUserDetailsQuery,
		GetCurrentUserDetailsQueryVariables
	>({
		document: GetCurrentUserDetailsDocument,
		variables: { vertisUserId },
		request,
		queryKey: hasuraKeys.users.detail(vertisUserId),
	})
}
