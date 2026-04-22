import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'favicon-16.png',
        'favicon-32.png',
        'apple-touch-icon.png',
        'icons.svg',
      ],
      manifest: {
        id: '/',
        name: 'Ma Liste de Courses',
        short_name: 'Courses',
        description: 'Gérez vos listes de courses avec des règles intelligentes.',
        theme_color: '#f6f1e6',
        background_color: '#f6f1e6',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'fr',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        categories: ['productivity', 'lifestyle', 'shopping'],
        icons: [
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-192-maskable.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'apple-touch-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any' },
        ],
      },
      workbox: {
        // App shell: pre-cache everything the build outputs.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Navigations fall back to index.html so deep links work offline.
        navigateFallback: '/index.html',
        // Never serve PocketBase requests from the SW — data must be live
        // or fail; stale shopping state would be worse than an error toast.
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // Google Fonts CSS — stale-while-revalidate so the page text
            // renders immediately on second load, then refreshes in the bg.
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*$/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-css' },
          },
          {
            // Google Fonts files — cache-first with a long expiry.
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-files',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  build: {
    target: 'es2022',
    cssCodeSplit: true,
    sourcemap: false,
    // Keep every asset a separately-cacheable file. Vite's default (4 KB
    // inline threshold) was base64-inlining 69 of 91 food SVGs into the
    // FoodIcon chunk — ~165 KB of base64 that re-downloads on every chunk
    // hash bump and blocks the PWA from caching icons individually.
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('pocketbase')) return 'vendor-pb'
          if (
            id.includes('/vue/') ||
            id.includes('/@vue/') ||
            id.includes('/vue-router/') ||
            id.includes('/pinia/')
          ) {
            return 'vendor-vue'
          }
        },
      },
    },
  },
})
