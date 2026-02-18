import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    base: './',
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          maximumFileSizeToCacheInBytes: 5000000 // Increase to 5MB to be safe
        },
        manifest: {
          name: 'Prof. Acerta+ 3.1',
          short_name: 'Acerta+',
          description: 'Gestão Escolar Inteligente',
          theme_color: '#4f46e5',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          icons: [
            {
              src: 'logo.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'logo.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      target: 'esnext',
      chunkSizeWarningLimit: 1600,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              // 1. Core React ecosystem - Keep strictly minimal to avoid circular deps
              if (/node_modules[\\/](react|react-dom|react-router-dom|scheduler|prop-types|use-sync-external-store)[\\/]/.test(id)) {
                return 'vendor-core';
              }
              // 2. Framer Motion (Heavy UI lib)
              if (id.includes('framer-motion')) {
                return 'vendor-framer';
              }
              // 3. Database & Auth
              if (id.includes('@supabase') || id.includes('dexie')) {
                return 'vendor-db';
              }
              // 4. PDF Generation (Heavy)
              if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('react-pdf') || id.includes('pdfjs-dist')) {
                return 'vendor-pdf';
              }
              // 5. OCR & Docs (Heavy)
              if (id.includes('tesseract') || id.includes('docx') || id.includes('file-saver')) {
                return 'vendor-docs';
              }
              // 6. UI Libraries (Charts, Editors, Components)
              if (id.includes('recharts') || id.includes('react-quill-new') || id.includes('lucide-react') || id.includes('react-joyride') || id.includes('react-easy-crop') || id.includes('react-image-crop') || id.includes('react-webcam')) {
                return 'vendor-ui-libs';
              }

              // 7. Everything else goes to vendor-libs
              return 'vendor-libs';
            }
          }
        }
      },
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      },
      sourcemap: false
    }
  };
});
