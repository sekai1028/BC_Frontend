import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** SPA fallback: serve index.html for /play, /admin, etc. so direct links and refresh work (dev + preview). */
const spaFallbackHandler = (req: { url?: string; method?: string }, _res: unknown, next: () => void) => {
  if (req.url?.startsWith('/api') || req.url?.startsWith('/socket.io')) return next()
  if (req.method !== 'GET' && req.method !== 'HEAD') return next()
  const path = req.url?.split('?')[0] ?? ''
  if (path === '' || path === '/') return next()
  if (/\.[a-zA-Z0-9]+$/.test(path)) return next()
  // Don't rewrite Vite internal paths (HMR client, react-refresh, etc.) or they 404
  if (path.startsWith('/@') || path.startsWith('/node_modules/')) return next()
  req.url = '/index.html'
  next()
}

function spaFallback() {
  return {
    name: 'spa-fallback',
    configureServer(server: { middlewares: { use: (fn: (req: unknown, res: unknown, next: () => void) => void) => void } }) {
      server.middlewares.use(spaFallbackHandler as (req: unknown, res: unknown, next: () => void) => void)
    },
    configurePreviewServer(server: { middlewares: { use: (fn: (req: unknown, res: unknown, next: () => void) => void) => void } }) {
      server.middlewares.use(spaFallbackHandler as (req: unknown, res: unknown, next: () => void) => void)
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  appType: 'spa',
  plugins: [react(), spaFallback()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
      },
    },
  },
  preview: {
    port: 3000,
  },
})
