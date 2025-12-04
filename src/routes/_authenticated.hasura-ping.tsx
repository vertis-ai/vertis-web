import { hasuraKeys } from "@/data/hasura/queryKeys"
import { createHasuraQueryOptions } from "@/integrations/hasura/query-options"
import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

const hasuraPingDocument = /* GraphQL */ `
	query HasuraPing {
		__typename
	}
`

type HasuraPingResponse = {
	__typename: string
}

const hasuraPingQuery = (request?: Request) =>
	createHasuraQueryOptions<HasuraPingResponse>({
		document: hasuraPingDocument,
		request,
		queryKey: hasuraKeys.system.ping(), // Optional: explicit key for easier invalidation
		// Omit queryKey to use auto-generated key (document + variables)
	})

export const Route = createFileRoute("/_authenticated/hasura-ping")({
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(hasuraPingQuery(context.request))
	},
	component: HasuraPing,
})

function HasuraPing() {
	const query = useSuspenseQuery(hasuraPingQuery())

	return (
		<div className="p-8 space-y-4">
			<h1 className="text-2xl font-semibold text-(--color-vertis-purple)">
				Hasura connectivity
			</h1>
			<p className="text-base text-(--color-body-text)">
				GraphQL root responded with <strong>{query.data.__typename}</strong>,
				which confirms the new Hasura client is configured end-to-end for SSR +
				CSR via TanStack Query.
			</p>
		</div>
	)
}
