import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // SPA fallback: serve index.html for routes like /payment so refresh and direct open work
    {
      name: 'spa-fallback',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const path = (req.url ?? '').split('?')[0]
          const hasExtension = /\.[a-z0-9]+$/i.test(path)
          const isViteInternal = path.startsWith('/@') || path.startsWith('/node_modules') || path === '/'
          if (!hasExtension && !isViteInternal) {
            req.url = '/index.html'
          }
          next()
        })
      },
    },
  ],
  appType: 'spa',
})
