import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    // Laravel backend hazır olduğunda /api, /sanctum, /login vb. istekleri oraya yönlendirir.
    // Böylece cookie tabanlı Sanctum auth aynı origin üzerinden sorunsuz çalışır.
    proxy: {
      '/api': 'http://localhost:8000',
      '/sanctum': 'http://localhost:8000',
      '/login': 'http://localhost:8000',
      '/logout': 'http://localhost:8000',
      '/forgot-password': 'http://localhost:8000',
      '/reset-password': 'http://localhost:8000',
    },
  },
})
