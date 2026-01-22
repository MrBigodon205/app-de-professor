import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.profacerta.app',
  appName: 'Prof. Acerta+',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
