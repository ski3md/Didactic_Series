// FIX: Add a triple-slash directive to include Node.js types, which fixes a TypeScript error on 'process.cwd()'.
/// <reference types="node" />

import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file for the specified mode
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    // Replace 'pathology-learning-module' with your repo name if it's different
    base: '/pathology-learning-module/',
    define: {
      // Expose environment variables to the client
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    },
  }
})
