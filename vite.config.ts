import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import process from 'process'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file for the specified mode (e.g. .env.production)
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    base: '/Didactic_Series/', // GitHub Pages base path
    define: {
      // Safely expose only needed env vars
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
    },
    build: {
      rollupOptions: {
        // Prevent unresolved imports from breaking build
        external: [
          '@google/genai',          // ignore the deprecated module
          '@google/generative-ai'   // optional: if installed separately
        ],
      },
    },
    optimizeDeps: {
      // Helps avoid dependency scanning issues
      exclude: ['@google/genai'],
    },
  }
})