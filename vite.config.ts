import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig, loadEnv } from 'vite'
import viteTsConfigPaths from 'vite-tsconfig-paths'

export default defineConfig(({ mode }) => {
  // Load env vars (Vite only exposes VITE_ prefixed vars to client, but we need them in config)
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [
      devtools(),
      nitro(),
      // this is the plugin that enables path aliases
      viteTsConfigPaths({
        projects: ['./tsconfig.json'],
      }),
      tailwindcss(),
      tanstackStart(),
      viteReact(),
    ],
    server: {
      port: 3000,
      proxy: {
        // Proxy /dev/* requests to the serverless backend (for local development)
        // This matches the legacy app's behavior exactly
        // Note: The path is forwarded as-is (with /dev prefix) for AWS API Gateway
        //       or rewritten (removing /dev) for local serverless offline
        '/dev': {
          // Priority order:
          // 1. SERVERLESS_URL_LOCAL - for local serverless offline (e.g., http://localhost:3001)
          // 2. VITE_VERTIS_SERVERLESS_BASE_URL - for AWS API Gateway (e.g., https://xv8ny0pep9.execute-api.us-east-1.amazonaws.com)
          // 3. Fallback to localhost:3001
          target: env.SERVERLESS_URL_LOCAL || env.VITE_VERTIS_SERVERLESS_BASE_URL || 'http://localhost:3001',
          changeOrigin: true,
          // Conditionally rewrite path:
          // - For local serverless offline: Remove /dev prefix (backend doesn't expect it)
          // - For AWS API Gateway: Keep /dev prefix (it's the stage name)
          rewrite: (path) => {
            // Check whichever URL is actually being used, not just one variable
            const actualTarget = env.SERVERLESS_URL_LOCAL || env.VITE_VERTIS_SERVERLESS_BASE_URL || 'http://localhost:3001'
            const isAwsApiGateway = actualTarget.includes('execute-api')
            
            // If target already includes /dev stage, remove it from path to avoid duplication
            const targetHasDevStage = actualTarget.endsWith('/dev') || actualTarget.includes('/dev/')
            
            let rewritten = path
            if (isAwsApiGateway && !targetHasDevStage) {
              // AWS API Gateway without /dev in target - keep /dev in path
              rewritten = path
            } else if (!isAwsApiGateway) {
              // Local serverless offline - remove /dev from path
              rewritten = path.replace(/^\/dev/, '')
            } else if (targetHasDevStage) {
              // Target already has /dev stage - remove it from path to avoid double /dev
              rewritten = path.replace(/^\/dev/, '')
            }
          
            return rewritten
          },
          configure: (proxy, _options) => {
            // Normalize target URL (remove trailing slash to avoid double slashes)
            const targetStr = typeof _options.target === 'string' ? _options.target : _options.target?.toString() || ''
            const normalizedTarget = targetStr.replace(/\/+$/, '')
            
            proxy.on('proxyReq', (_proxyReq, req, _res) => {
              console.log('[VITE PROXY] Proxying request:', {
                method: req.method,
                url: req.url,
                target: normalizedTarget,
                fullUrl: `${normalizedTarget}${req.url}`,
              })
            })
            proxy.on('error', (err, _req, _res) => {
              console.error('[VITE PROXY] Proxy error:', {
                message: err.message,
                code: (err as NodeJS.ErrnoException).code,
                target: normalizedTarget,
                hint: 'Make sure the serverless backend is running. If using serverless offline, set SERVERLESS_URL_LOCAL=http://localhost:3001',
              })
            })
          },
        },
      },
    },
  }
})
