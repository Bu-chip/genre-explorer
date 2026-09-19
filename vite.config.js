import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    rollupOptions: {
      output: {
        // Split the heavy vendors out of the app chunk. They change far less
        // often than our own code, so a redeploy no longer invalidates them
        // in returning visitors' caches. (rolldown's API, not rollup's
        // manualChunks — Vite 8 builds with rolldown.)
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
            { name: 'motion', test: /node_modules[\\/]framer-motion[\\/]/ },
            { name: 'supabase', test: /node_modules[\\/]@supabase[\\/]/ },
          ],
        },
      },
    },
  },
  server: {
    port: parseInt(process.env.PORT || '5173'),
  },
})
