import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import process from 'process'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '')
  const basePath = env.VITE_BASE_PATH || '/Didactic_Series/'
  const outDir = env.VITE_OUT_DIR || 'dist'
  const buildId = (env.VITE_BUILD_ID || 'local').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 12) || 'local'

  return {
    plugins: [react()],

    // Default keeps the historical GitHub Pages path; production can mount at /didactics/.
    base: basePath,

    // Define API key for client use (read-only)
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
    },

    // Explicit alias for OpenSeadragon (fixes Vite import resolution)
    resolve: {
      alias: {
        openseadragon: 'openseadragon/build/openseadragon/openseadragon.js',
      },
    },

    // Ensure dependencies are pre-bundled correctly
    optimizeDeps: {
      include: ['openseadragon'],
      exclude: ['@google/genai'],
    },

    build: {
      outDir,

      // Raise warning threshold from 500 kB → 1 MB
      chunkSizeWarningLimit: 1000,

      rollupOptions: {
        // Split vendor libraries into separate chunks automatically
        output: {
          entryFileNames: `assets/[name]-${buildId}-[hash].js`,
          chunkFileNames: `assets/[name]-${buildId}-[hash].js`,
          assetFileNames: `assets/[name]-${buildId}-[hash][extname]`,
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return id.toString().split('node_modules/')[1].split('/')[0];
            }
          },
        },

        // Prevent unresolved imports from breaking build
        external: [
          '@google/genai',
        ],
      },
    },
  };
});
