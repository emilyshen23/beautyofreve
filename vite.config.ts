import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Served from a GitHub Pages project site (/beautyofreve/) in production,
  // from the root in dev.
  base: process.env.GITHUB_PAGES ? '/beautyofreve/' : '/',
  plugins: [react()],
  server: {
    port: 5176,
    strictPort: true,
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
})
