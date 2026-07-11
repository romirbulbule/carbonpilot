import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/motion')) return 'motion'
          if (id.includes('node_modules/react-markdown') || id.includes('node_modules/remark-gfm')) return 'markdown'
          if (
            id.includes('node_modules/d3-geo') ||
            id.includes('node_modules/topojson-client') ||
            id.includes('node_modules/world-atlas')
          ) {
            return 'geo'
          }
        },
      },
    },
  },
})
