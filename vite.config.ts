import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png', 'pwa-icon.svg', 'logo.svg'],
        manifest: {
          id: '/',
          name: 'Maestro Arena',
          short_name: 'Maestro',
          description: 'Live scores, football news, quizzes and tips.',
          theme_color: '#EAF7ED',
          background_color: '#EAF7ED',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          categories: ['sports', 'news', 'entertainment'],
          icons: [
            {
              src: '/pwa-icon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any'
            },
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        },
        injectManifest: {
          globPatterns: ['**/*.{js,css,html}'],
          maximumFileSizeToCacheInBytes: 3000000,
        },
        devOptions: {
          enabled: true,
          type: 'module'
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'lucide-react', 'sonner', 'clsx', 'tailwind-merge'],
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
