import type {
	UpdateCurrentUserDetailsMutation,
	UpdateCurrentUserDetailsMutationVariables,
} from "@/data/hasura/__generated__/index"
import { UpdateCurrentUserDetailsDocument } from "@/data/hasura/__generated__/index"
import { createHasuraMutationOptions } from "@/integrations/hasura/mutation-options"

export function updateCurrentUserDetailsMutationOptions() {
	return createHasuraMutationOptions<
		UpdateCurrentUserDetailsMutation,
		UpdateCurrentUserDetailsMutationVariables
	>({
		document: UpdateCurrentUserDetailsDocument,
		requireAuth: true,
	})
}
