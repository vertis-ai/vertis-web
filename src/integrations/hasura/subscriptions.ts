import { AuthService } from "@/services/authService"
import type { TypedDocumentNode } from "@graphql-typed-document-node/core"
import type { QueryClient, QueryKey } from "@tanstack/react-query"
import { createClient, type Client, type ClientOptions } from "graphql-ws"
import {
	documentToString,
	HasuraGraphQLError,
	type DocumentLike,
} from "./client"

type SubscriptionDocument<TData, TVariables> =
	| DocumentLike<TData, TVariables>
	| TypedDocumentNode<TData, TVariables>

let sharedClient: Client | null = null

function inferWsUrl(): string {
	const explicit = import.meta.env.VITE_HASURA_WS_URL
	if (explicit) {
		return explicit
	}

	const httpUrl = import.meta.env.VITE_HASURA_URL
	if (!httpUrl) {
		throw new Error(
			"Set VITE_HASURA_WS_URL or VITE_HASURA_URL to use Hasura subscriptions",
		)
	}

	if (httpUrl.startsWith("https://")) {
		return httpUrl.replace("https://", "wss://")
	}

	if (httpUrl.startsWith("http://")) {
		return httpUrl.replace("http://", "ws://")
	}

	throw new Error("Unable to derive websocket URL from Hasura HTTP endpoint")
}

function ensureClient(options?: Partial<ClientOptions>): Client {
	if (typeof window === "undefined") {
		throw new Error("Hasura subscriptions are only available in the browser")
	}

	if (sharedClient) {
		return sharedClient
	}

	const wsUrl = inferWsUrl()

	sharedClient = createClient({
		url: wsUrl,
		connectionParams: () => {
			const token = AuthService.getAccessToken()
			if (!token) {
				throw new Error("Authentication required for Hasura subscriptions")
			}

			return {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			}
		},
		lazy: true,
		...options,
	})

	return sharedClient
}

export type SubscriptionHandlers<TData> = {
	onData: (data: TData) => void
	onError?: (error: unknown) => void
	onComplete?: () => void
}

export function subscribeToHasura<
	TData,
	TVariables extends Record<string, unknown> = Record<string, never>,
>({
	document,
	variables,
	handlers,
	client,
}: {
	document: SubscriptionDocument<TData, TVariables>
	variables?: TVariables
	handlers: SubscriptionHandlers<TData>
	client?: Client
}) {
	const wsClient = client ?? ensureClient()

	const unsubscribe = wsClient.subscribe(
		{
			query: documentToString(document),
			variables: variables ?? undefined,
		},
		{
			next: (payload) => {
				if (payload.errors?.length) {
					handlers.onError?.(
						new HasuraGraphQLError("Hasura subscription error", payload.errors),
					)
					return
				}

				if (payload.data) {
					handlers.onData(payload.data as TData)
				}
			},
			error: (err) => {
				handlers.onError?.(err)
			},
			complete: () => {
				handlers.onComplete?.()
			},
		},
	)

	return unsubscribe
}

export function syncSubscriptionToQuery<
	TData,
	TVariables extends Record<string, unknown> = Record<string, never>,
>(params: {
	queryClient: QueryClient
	queryKey: QueryKey
	document: SubscriptionDocument<TData, TVariables>
	variables?: TVariables
	reducer: (current: TData | undefined, incoming: TData) => TData | undefined
	client?: Client
}) {
	return subscribeToHasura<TData, TVariables>({
		document: params.document,
		variables: params.variables,
		client: params.client,
		handlers: {
			onData: (incoming) => {
				params.queryClient.setQueryData(params.queryKey, (current) =>
					params.reducer(current as TData | undefined, incoming),
				)
			},
			onError: (error) => {
				console.error("Hasura subscription error", error)
			},
		},
	})
}
