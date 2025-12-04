import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { executeHasura, HasuraGraphQLError } from "./client"

const { getAccessTokenMock } = vi.hoisted(() => ({
	getAccessTokenMock: vi.fn<(request?: Request) => string | null>(),
}))

vi.mock("@/services/authService", () => ({
	AuthService: {
		getAccessToken: getAccessTokenMock,
	},
}))

describe("executeHasura", () => {
	const fetchMock = vi.fn<typeof fetch>()

	beforeEach(() => {
		process.env.VITE_HASURA_URL = "http://localhost:8080/v1/graphql"
		getAccessTokenMock.mockReturnValue("token-123")
		fetchMock.mockResolvedValue(
			new Response(
				JSON.stringify({
					data: { __typename: "query_root" },
				}),
				{
					status: 200,
					headers: {
						"Content-Type": "application/json",
					},
				},
			),
		)

		vi.stubGlobal("fetch", fetchMock)
	})

	afterEach(() => {
		fetchMock.mockReset()
		getAccessTokenMock.mockReset()
		vi.unstubAllEnvs()
		vi.unstubAllGlobals()
	})

	it("sends authenticated GraphQL requests", async () => {
		const result = await executeHasura<{ __typename: string }>({
			document: /* GraphQL */ `
				query Ping {
					__typename
				}
			`,
		})

		expect(result.__typename).toBe("query_root")
		expect(fetchMock).toHaveBeenCalledWith(
			"http://localhost:8080/v1/graphql",
			expect.objectContaining({
				headers: expect.objectContaining({
					Authorization: "Bearer token-123",
				}),
			}),
		)
	})

	it("throws HasuraGraphQLError when response contains errors", async () => {
		fetchMock.mockResolvedValueOnce(
			new Response(JSON.stringify({ errors: [{ message: "boom" }] }), {
				status: 200,
				headers: {
					"Content-Type": "application/json",
				},
			}),
		)

		await expect(
			executeHasura<{ __typename: string }>({
				document: "query Ping { __typename }",
			}),
		).rejects.toBeInstanceOf(HasuraGraphQLError)
	})
})
