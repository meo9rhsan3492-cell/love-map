import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  server: {
    host: true, // Expose to local network (0.0.0.0)
    port: 3000,
  },
  build: {
    rollupOptions: {
      output: {
        // Validation: Removing manualChunks to let Vite handle chunking automatically
        // This fixes the "Minified React error #321" (Invalid Hook Call) caused by multiple React instances
      },
    },
  },
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },
})
