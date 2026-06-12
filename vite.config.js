import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  base: '/NFL_Platinum_Rose/platinum-rose-app/',

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    chunkSizeWarningLimit: 600,   // kB — warn if any chunk exceeds 600 kB
    rollupOptions: {
      output: {
        manualChunks: {
          // Charting library — large, rarely updated
          'vendor-recharts': ['recharts'],
          // Icon library
          'vendor-lucide':   ['lucide-react'],
          // Supabase client
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
})