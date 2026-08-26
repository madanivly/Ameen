import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  // Load all env vars (from .env files and process.env) so the proxy port
  // can never drift away from the backend — both sides read the same variable.
  const env = loadEnv(mode, process.cwd(), '')
  const backendPort = env.VITE_BACKEND_PORT || '8080'

  return {
    base: '/',
    plugins: [
      tailwindcss(),
      react(),
      tsconfigPaths(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: false, // Using public/manifest.json already linked in index.html
        workbox: {
          cacheId: `grt-pwa-${Date.now()}`,
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024, // 6 MiB limit to handle ExcelJS / PDF bundles
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        },
      }),
    ],
    build: {
      outDir: 'dist',
      minify: false,
      rollupOptions: {
        output: {
          entryFileNames: `assets/[name]-[hash].js`,
          chunkFileNames: `assets/[name]-[hash].js`,
          assetFileNames: `assets/[name]-[hash].[ext]`,
        },
      },
    },
    server: {
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${backendPort}`,
          changeOrigin: true,
        },
      },
    },
  }
})

