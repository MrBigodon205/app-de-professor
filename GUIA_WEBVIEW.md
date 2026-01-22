# Guia de Atualização do APK (Modo WebView)

Este guia explica como transformar seu aplicativo mobile em um "visualizador" da versão web. Isso garante que o app tenha todas as funcionalidades mais recentes (incluindo o modo offline via Dexie e o novo design) sem precisar reescrever código nativo.

## 1. Instalar Dependências

Abra o terminal na pasta `mobile-app` e execute:

```bash
cd mobile-app
npx expo install react-native-webview
```

## 2. Configurar a URL

Eu já atualizei o arquivo `mobile-app/app/index.tsx` para usar o WebView.
No entanto, você precisa definir a URL correta da sua aplicação publicada.

1. Abra `mobile-app/app/index.tsx`.
2. Procure a linha:
   ```typescript
   const WEB_APP_URL = 'https://app-de-professor.vercel.app';
   ```
3. Substitua `'https://app-de-professor.vercel.app'` pela URL onde você hospedou a versão web (ex: Vercel, Netlify ou GitHub Pages).

## 3. Gerar o APK

Agora, gere o novo build Android:

```bash
eas build --platform android --profile preview
```

Ou, se for para produção (Google Play):

```bash
eas build --platform android --profile production
```

## 4. Testar Localmente (Opcional)

Se quiser testar no seu celular antes de gerar o APK:

1. Certifique-se de que a versão Web está rodando localmente (`npm run dev` na pasta raiz).
2. Mude a `WEB_APP_URL` para o endereço do seu PC na rede (ex: `http://192.168.1.5:3000`).
3. Rode `npx expo start --android` na pasta `mobile-app`.

---
**Nota:** Com essa abordagem, o app mobile será um espelho exato do site. Se o site funcionar offline no Chrome do celular, o app também funcionará!
