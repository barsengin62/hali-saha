import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
   base: '/hali-saha/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    // Geliştirmede /api istekleri yerel Laravel'e gider (VITE_API_URL boşken).
    // Canlıda VITE_API_URL backend adresidir; token (Bearer) auth olduğu için farklı alan adı sorun değil.
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
