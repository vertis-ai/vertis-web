import { queryOptions, type QueryKey } from "@tanstack/react-query"
import {
	documentToString,
	executeHasura,
	type ExecuteHasuraOptions,
} from "./client"

type QueryOptionsInput<TData, TVariables> = Omit<
	ExecuteHasuraOptions<TData, TVariables>,
	"signal"
> & {
	queryKey?: QueryKey
}

export function createHasuraQueryOptions<
	TData,
	TVariables extends Record<string, unknown> = Record<string, never>,
>(options: QueryOptionsInput<TData, TVariables>) {
	const key: QueryKey = options.queryKey ?? [
		documentToString(options.document),
		options.variables ?? null,
	]

	return queryOptions({
		queryKey: key,
		queryFn: ({ signal }) =>
			executeHasura<TData, TVariables>({
				...options,
				signal,
			}),
	})
}
