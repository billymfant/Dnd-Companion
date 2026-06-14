import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Vite config: React plugin + Tailwind v4 plugin.
// `host: true` lets phones on the same Wi-Fi reach the dev server.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
  },
})
