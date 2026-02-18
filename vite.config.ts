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
              // SAFE CHUNKING STRATEGY: 
              // Only split truly independent, heavy libraries. 
              // Let Vite handle React core and shared dependencies automatically to prevent circular deps.

              // 1. Database & Auth (Stand-alone)
              if (id.includes('@supabase') || id.includes('dexie')) {
                return 'vendor-db';
              }
              // 2. PDF Generation (Very Heavy & Independent)
              if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('react-pdf') || id.includes('pdfjs-dist')) {
                return 'vendor-pdf';
              }
              // 3. OCR (Very Heavy & Independent)
              if (id.includes('tesseract')) {
                return 'vendor-ocr';
              }
              // 4. Docs Generation (Heavy & Independent)
              if (id.includes('docx') || id.includes('file-saver')) {
                return 'vendor-docs';
              }
              // 5. Rich Text Editor (Heavy)
              if (id.includes('react-quill-new')) {
                return 'vendor-editor';
              }
              // 6. Charts & Visuals (Heavy)
              if (id.includes('recharts')) {
                return 'vendor-charts';
              }
              // 7. Animations (Common)
              if (id.includes('framer-motion')) {
                return 'vendor-motion';
              }
              // 8. Icons (Common)
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }

              // CRITICAL: Do NOT bundle React or UI libs manually. 
              // Leaving them to default ensures correct loading order and shared chunks.
            }
          }
        }
      },
      minify: 'esbuild', // Faster than Terser (20-40x)
      sourcemap: false
    }
  };
});
