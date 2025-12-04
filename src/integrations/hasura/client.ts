import type { TypedDocumentString } from "@/data/hasura/__generated__/index"
import { AuthService } from "@/services/authService"
import type { TypedDocumentNode } from "@graphql-typed-document-node/core"

export class HasuraGraphQLError extends Error {
	errors: readonly HasuraGraphQLErrorItem[]

	constructor(message: string, errors: readonly HasuraGraphQLErrorItem[]) {
		super(message)
		this.name = "HasuraGraphQLError"
		this.errors = errors
	}
}

export interface HasuraGraphQLErrorItem {
	message: string
	extensions?: Record<string, unknown>
}

// biome-ignore format: Prettier keeps reformatting this on save
export type DocumentLike<TData, TVariables> = string | TypedDocumentNode<TData, TVariables> | TypedDocumentString<TData, TVariables>

export interface ExecuteHasuraOptions<TData, TVariables> {
	document: DocumentLike<TData, TVariables>
	variables?: TVariables
	request?: Request
	token?: string | null
	headers?: Record<string, string>
	requireAuth?: boolean
	signal?: AbortSignal
}

interface GraphQLResponse<TData> {
	data?: TData
	errors?: readonly HasuraGraphQLErrorItem[]
}

function resolveDocument<TData, TVariables>(
	document: DocumentLike<TData, TVariables>,
): string {
	if (typeof document === "string") return document

	if (document instanceof String) return document.toString()

	if ("loc" in document && document.loc?.source.body)
		return document.loc.source.body

	// Fallback: should not happen with properly generated TypedDocumentNodes
	throw new Error(
		"Unable to extract GraphQL document string. Ensure documents are generated via graphql-codegen.",
	)
}

export function documentToString<TData, TVariables>(
	document: DocumentLike<TData, TVariables>,
): string {
	return resolveDocument(document)
}

function resolveToken(options: {
	token?: string | null
	request?: Request
}): string | null {
	if (typeof options.token === "string") {
		return options.token
	}

	return AuthService.getAccessToken(options.request)
}

export async function executeHasura<
	TData,
	TVariables extends Record<string, unknown> = Record<string, never>,
>(options: ExecuteHasuraOptions<TData, TVariables>): Promise<TData> {
	const hasuraUrl = getHasuraUrl()
	const document = resolveDocument(options.document)
	const token = resolveToken(options)

	if (!token && options.requireAuth !== false) {
		throw new Error("Missing access token for Hasura request")
	}

	const response = await fetch(hasuraUrl, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			...options.headers,
		},
		body: JSON.stringify({
			query: document,
			variables: options.variables ?? null,
		}),
		signal: options.signal,
	})

	if (!response.ok) {
		const text = await response.text()
		throw new Error(
			`Hasura request failed with ${response.status}: ${text || "Unknown error"}`,
		)
	}

	const payload = (await response.json()) as GraphQLResponse<TData>

	if (payload.errors?.length) {
		throw new HasuraGraphQLError("Hasura returned errors", payload.errors)
	}

	if (!payload.data) {
		throw new Error("Hasura response did not include data")
	}

	return payload.data
}

export function createHasuraClient(request?: Request) {
	return {
		query: <
			TData,
			TVariables extends Record<string, unknown> = Record<string, never>,
		>(
			options: Omit<ExecuteHasuraOptions<TData, TVariables>, "request">,
		) => executeHasura<TData, TVariables>({ ...options, request }),
	}
}

export type HasuraClient = ReturnType<typeof createHasuraClient>

function getHasuraUrl(): string {
	const url =
		(typeof import.meta !== "undefined" && import.meta.env?.VITE_HASURA_URL) ||
		(typeof process !== "undefined" ? process.env?.VITE_HASURA_URL : undefined)
	if (!url) {
		throw new Error("VITE_HASURA_URL is not configured")
	}
	return url
}
