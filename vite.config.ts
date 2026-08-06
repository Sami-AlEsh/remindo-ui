import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const API_TARGET = process.env.VITE_API_TARGET ?? 'http://localhost:3000';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5173,
    // The API lives under /api, so SPA routes never collide with it. Sharing
    // an origin is required: the refresh token is a sameSite=strict cookie.
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: false },
      '/docs': { target: API_TARGET, changeOrigin: false },
    },
  },
});
