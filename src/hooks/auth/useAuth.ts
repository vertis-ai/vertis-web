import { useEmbeddedAuth } from "./useEmbeddedAuth"

export const useAuth = () => {
	const embeddedAuth = useEmbeddedAuth()

	return embeddedAuth
}
