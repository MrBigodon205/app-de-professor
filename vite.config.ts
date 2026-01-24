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
      target: 'es2020',
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-ui-core': ['framer-motion', 'lucide-react'],
            'vendor-charts': ['recharts'],
            'vendor-editor': ['react-quill-new'],
            'vendor-db': ['@supabase/supabase-js', 'dexie'],
            'vendor-utils': ['canvas-confetti', 'dompurify', 'react-joyride']
          }
        }
      }
    }
  };
});
