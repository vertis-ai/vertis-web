import type { CodegenConfig } from "@graphql-codegen/cli"

const schemaUrl =
	process.env.HASURA_GRAPHQL_URL ??
	process.env.HASURA_SCHEMA_URL ??
	process.env.VITE_HASURA_URL

if (!schemaUrl) {
	throw new Error(
		"Missing Hasura schema URL. Set HASURA_GRAPHQL_URL or VITE_HASURA_URL before running codegen.",
	)
}

const adminSecret = process.env.HASURA_ADMIN_SECRET

const config: CodegenConfig = {
	schema: [
		{
			[schemaUrl]: {
				headers: adminSecret
					? {
							"x-hasura-admin-secret": adminSecret,
						}
					: {},
			},
		},
	],
	documents: "src/data/hasura/queries/**/*.{graphql,gql}",
	generates: {
		"src/data/hasura/__generated__/index.ts": {
			plugins: [
				"typescript",
				"typescript-operations",
				"typed-document-node",
			],
			config: {
				useTypeImports: true,
				documentMode: "documentNode",
			},
		},
	},
	ignoreNoDocuments: true,
}

export default config

