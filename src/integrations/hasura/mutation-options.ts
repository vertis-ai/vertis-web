import type { MutationOptions } from "@tanstack/react-query"
import { executeHasura, type DocumentLike } from "./client"

type MutationOptionsInput<TData, TVariables> = {
	document: DocumentLike<TData, TVariables>
	headers?: Record<string, string>
	requireAuth?: boolean
}

export function createHasuraMutationOptions<
	TData,
	TVariables extends Record<string, unknown> = Record<string, never>,
>(
	options: MutationOptionsInput<TData, TVariables>,
): MutationOptions<TData, Error, TVariables> {
	return {
		mutationFn: (variables: TVariables) =>
			executeHasura<TData, TVariables>({
				document: options.document,
				variables,
				headers: options.headers,
				requireAuth: options.requireAuth,
			}),
	}
}
