import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'CrypticMechanic',
        short_name: 'CrypticMechanic',
        description: 'Translate cryptic developer error logs into human-readable diagnoses and actionable fixes.',
        theme_color: '#0a0b10',
        background_color: '#0a0b10',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})
