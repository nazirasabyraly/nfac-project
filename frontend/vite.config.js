import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    allowedHosts: ['all', 'ce80-95-56-238-194.ngrok-free.app'],
    cors: true
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true
  }
})

