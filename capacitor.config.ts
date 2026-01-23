import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.profacerta.app',
  appName: 'Prof. Acerta+',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
    allowNavigation: [
      '*.supabase.co',
      '*.supabase.in',
      '*.google.com',
      '*.googleapis.com',
      '*.gstatic.com'
    ]
  },
  android: {
    // Configurações padrão do Android
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    }
  }
};

export default config;
