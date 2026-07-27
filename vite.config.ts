import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/pax-mediterranea/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/icon.svg'],
      manifest: {
        name: 'Pax Mediterranea',
        short_name: 'Pax',
        description: 'A fast, historically inspired Mediterranean strategy game.',
        theme_color: '#261c3b',
        background_color: '#f2d9a6',
        display: 'standalone',
        orientation: 'any',
        start_url: '/pax-mediterranea/',
        icons: [
          { src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      workbox: {
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
      },
    }),
  ],
  build: { sourcemap: true, chunkSizeWarningLimit: 650 },
});
