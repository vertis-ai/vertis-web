import { describe, expect, it } from "vitest"
import { isPublicRoute } from "./routeGuards"

describe("isPublicRoute", () => {
	it("allows known public endpoints", () => {
		expect(isPublicRoute("/login")).toBe(true)
		expect(isPublicRoute("/forgot-password")).toBe(true)
		expect(isPublicRoute("/reset-password/token123")).toBe(true)
		expect(isPublicRoute("/auth/callback")).toBe(true)
	})

	it("rejects authenticated routes", () => {
		expect(isPublicRoute("/dashboard")).toBe(false)
		expect(isPublicRoute("/settings/profile")).toBe(false)
		expect(isPublicRoute("/mcp")).toBe(false)
	})
})
