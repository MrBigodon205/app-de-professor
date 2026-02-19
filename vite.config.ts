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
              // CORE VENDOR (React + Router + Framer) - Keep together for stability
              if (id.includes('react/') || id.includes('react-dom') || id.includes('react-router') || id.includes('scheduler')) {
                return 'vendor-react';
              }
              if (id.includes('framer-motion')) {
                return 'vendor-motion';
              }

              // HEAVY LIBS (Split efficiently)
              if (id.includes('@supabase')) return 'vendor-supabase';
              if (id.includes('dexie')) return 'vendor-dexie';
              if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('canvg')) return 'vendor-pdf';
              if (id.includes('react-pdf') || id.includes('pdfjs-dist')) return 'vendor-pdf-viewer';
              if (id.includes('tesseract')) return 'vendor-ocr';
              if (id.includes('docx') || id.includes('file-saver')) return 'vendor-docs';
              if (id.includes('react-quill-new')) return 'vendor-editor';
              if (id.includes('recharts')) return 'vendor-charts';
              if (id.includes('lucide-react')) return 'vendor-icons';
              if (id.includes('lottie')) return 'vendor-lottie';

              // UTILS
              if (id.includes('date-fns') || id.includes('dayjs') || id.includes('moment')) return 'vendor-date';
              if (id.includes('lodash') || id.includes('ramda')) return 'vendor-utils';

              // EVERYTHING ELSE
              return 'vendor-missc';
            }
          }
        }
      },
      minify: 'esbuild', // Faster than Terser (20-40x)
      sourcemap: false
    }
  };
});
