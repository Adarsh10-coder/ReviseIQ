import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const target = process.env.VITE_API_URL || 'https://reviseiq.onrender.com';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target,
        changeOrigin: true,
        secure: false,
      },
      '/auth': {
        target,
        changeOrigin: true,
        secure: false,
      },
      '/webhooks': {
        target,
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target,
        changeOrigin: true,
        ws: true,
        secure: false,
      },
    },
  },
})
