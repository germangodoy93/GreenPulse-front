import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'https://greenpulse-back-production.up.railway.app',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
