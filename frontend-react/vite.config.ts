import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// @ts-ignore
import { fileURLToPath } from 'url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2015', // Transpiles modern features (optional chaining, nullish coalescing) for old iOS Safari compatibility
    cssTarget: 'chrome61', // Ensures CSS properties are also cross-compatible
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
