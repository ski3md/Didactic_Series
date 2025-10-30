import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import process from 'process'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    base: '/pathology-learning-module/',
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    },
    resolve: {
      alias: {
        // Explicitly resolve OpenSeadragon if installed via npm
        openseadragon: 'openseadragon/build/openseadragon/openseadragon.js'
      }
    },
    optimizeDeps: {
      include: ['openseadragon']
    },
    build: {
      rollupOptions: {
        // Prevent Rollup from failing to resolve it
        external: ['openseadragon']
      }
    }
  }
})