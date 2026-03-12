import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), VitePWA({
    strategies: 'generateSW',
    registerType: 'autoUpdate',
    includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'sw-push.js'],
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
      importScripts: ['/sw-push.js'],
      runtimeCaching: [
        {
          urlPattern: ({ url }) => url.hostname.includes('supabase.co'),
          handler: 'NetworkFirst',
          options: {
            cacheName: 'supabase-api-cache',
            expiration: { maxEntries: 50, maxAgeSeconds: 86400 },
            networkTimeoutSeconds: 10,
          },
        },
      ],
    },
    manifest: {
      name: 'Dr. Murilo do Valle — Gestão Clínica',
      short_name: 'Clínica Murilo',
      description: 'Gestão clínica Dr. Murilo do Valle',
      theme_color: '#1B4B56',
      background_color: '#DDEBF1',
      display: 'standalone',
      orientation: 'portrait',
      scope: '/',
      start_url: '/',
      icons: [
        { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any' },
      ],
    },
    devOptions: { enabled: false },
  }), cloudflare()],
})