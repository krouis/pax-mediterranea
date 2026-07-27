import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/pax-mediterranea/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png'],
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
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
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
