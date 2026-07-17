import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': new URL('./src', import.meta.url).pathname },
  },
  build: {
    // Emit source maps for the production build so minified stack traces
    // (e.g. "n is not a function") decode back to real files/lines. "hidden"
    // writes the .map files but does NOT reference them from the shipped JS,
    // so they aren't exposed to end users unless you serve/upload them yourself.
    sourcemap: 'hidden',
  },
  server: {
    port: 5173,
    proxy: {
      // Proxy API calls to the Spring Boot backend during dev.
      '/api': 'http://localhost:8090',
    },
  },
})
