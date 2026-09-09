import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import { spawn } from 'node:child_process'

// Auto-launches the local Platinum Rose AI inbox/ledger server (scripts/official-pick-inbox-server.js,
// normally started manually via "Launch Platinum Rose Inbox.cmd" or `npm run official:picks:serve`)
// as a background child process alongside `vite dev`, so the Picks & Inbox tab works out of the box
// without a second terminal. It's killed automatically when the Vite dev server stops.
function officialPicksInboxServerPlugin() {
  let child;
  return {
    name: 'official-picks-inbox-server',
    apply: 'serve', // dev server only — not part of `vite build`
    configureServer(server) {
      const scriptPath = path.resolve(process.cwd(), 'scripts', 'official-pick-inbox-server.js');
      child = spawn(process.execPath, [scriptPath], {
        cwd: process.cwd(),
        env: process.env,
        stdio: 'inherit',
        windowsHide: true,
      });
      child.on('error', (err) => {
        console.warn('[official-picks-inbox-server] failed to start:', err.message);
      });

      const shutdown = () => {
        if (child && !child.killed) child.kill();
      };
      server.httpServer?.once('close', shutdown);
      process.once('exit', shutdown);
      process.once('SIGINT', shutdown);
      process.once('SIGTERM', shutdown);
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), officialPicksInboxServerPlugin()],

  base: '/platinum-rose-app/',

  server: {
    host: '0.0.0.0',
    port: 5180,
  },

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
