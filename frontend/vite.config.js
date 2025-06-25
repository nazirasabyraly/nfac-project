import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    // allowedHosts: ['all', '9a9d-95-56-238-194.ngrok-free.app'],
    allowedHosts: ['joy-brian-behaviour-amanda.trycloudflare.com'],
    cors: true,
    hmr: {
      clientPort: 443,
      host: 'joy-brian-behaviour-amanda.trycloudflare.com'
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true
  }
})

