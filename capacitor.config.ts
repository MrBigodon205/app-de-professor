import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.profacerta.app',
  appName: 'Prof. Acerta+',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // ⚠️ MODO ESPELHO (WEBVIEW)
    // Se quiser que o app ja abra direto no seu site (igual ao PC),
    // descomente a linha abaixo e coloque o link do seu site:
    url: 'https://www.profacerta.com.br',
    cleartext: true,
    allowNavigation: [
      'www.profacerta.com.br',
      '*.supabase.co',
      'accounts.google.com'
    ]
  }
};

export default config;
