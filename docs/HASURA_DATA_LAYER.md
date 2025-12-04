# Hasura Data Layer

This document captures the canonical pattern for calling our Hasura Cloud
instance from the TanStack Start application. It covers runtime fetchers,
TanStack Query usage, GraphQL Code Generator, and subscriptions.

## Environment

| Variable | Purpose | Required |
| --- | --- | --- |
| `VITE_HASURA_URL` | HTTPS endpoint for Hasura GraphQL API | ✅ Runtime |
| `VITE_HASURA_WS_URL` | Websocket endpoint (defaults to `VITE_HASURA_URL` with `ws(s)` scheme) | Optional |
| `HASURA_GRAPHQL_URL` | Schema URL for `pnpm codegen` (falls back to `VITE_HASURA_URL`) | Optional |
| `HASURA_ADMIN_SECRET` | Admin/metadata secret used only for `pnpm codegen` | Optional |

> **Security reminder:** Runtime requests always include the logged-in user's
> access token so Hasura Row Level Security policies are enforced everywhere.

## HTTP client + TanStack Query

All networking goes through `src/integrations/hasura/client.ts`:

```ts
const result = await executeHasura<MyQuery>({
	document: MyQueryDocument,
	variables: { id },
	request, // optional – use inside loaders for cookie-based SSR auth
})
```

Route loaders and components should *not* call `executeHasura` directly.
Instead wrap the document with `createHasuraQueryOptions` so the same cache key
is shared across SSR + CSR:

```ts
const myQuery = (request?: Request) =>
	createHasuraQueryOptions<MyQuery, MyQueryVariables>({
		document: MyQueryDocument,
		variables: { id },
		request,
	})
```

- Loaders call `context.queryClient.ensureQueryData(myQuery(context.request))`.
- Components use `useSuspenseQuery(myQuery())`.
- Query keys are **auto-generated** from the GraphQL document text + variables by default,
  ensuring no leakage between users.
- **Optional:** Use explicit query keys from `src/data/hasura/queryKeys.ts` when you need
  centralized invalidation or better control over cache keys.

`src/routes/_authenticated.hasura-ping.tsx` is the reference implementation that
demonstrates loader prefetch + `useSuspenseQuery` (currently using an explicit key).

## GraphQL Code Generator

- Documents live under `src/data/hasura/queries/**/*.graphql`.
- Generated output is written to `src/data/hasura/__generated__/index.ts`.
- Run `pnpm codegen` after updating schema or documents (requires
  `HASURA_GRAPHQL_URL` and optionally `HASURA_ADMIN_SECRET`).
- Generated `TypedDocumentNode`s plug directly into
  `createHasuraQueryOptions`, so no extra wrappers are needed.

## Subscriptions

`src/integrations/hasura/subscriptions.ts` encapsulates the `graphql-ws`
client. Usage:

```ts
const unsubscribe = subscribeToHasura({
	document: MySubscriptionDocument,
	variables,
	handlers: {
		onData: (next) => {
			queryClient.setQueryData(myQueryKey, next)
		},
	},
})
```

`syncSubscriptionToQuery` bridges subscription payloads into a TanStack Query
cache entry with a custom reducer – use it for chat/live dashboards.

## tRPC vs. Hasura

The existing tRPC router is demo-only. Feature work should prefer Hasura +
TanStack Query for server data. Keep tRPC around for internal procedures if we
introduce them later, but do not add new GraphQL functionality there.


