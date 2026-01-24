const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '../dist/index.html');

if (fs.existsSync(distPath)) {
  let content = fs.readFileSync(distPath, 'utf8');

  // 1. Force all paths to be relative (Electron requirement)
  content = content.replace(/(src|href|content)="\/(_expo|assets)/g, '$1="./$2');

  // 2. Clean up corrupted paths
  content = content.replace(/src="\.\/\.\//g, 'src="./');

  // 3. Robust routing fix: Inject at the very beginning of the body
  // This ensures Expo Router sees a # route before it hydrates.
  const bootstrapScript = `
    <script>
      (function() {
        // Force Hash routing if on file:// protocol
        if (window.location.protocol === 'file:') {
          if (!window.location.hash || window.location.hash === '#/') {
            console.log("Electron Bootstrap: Force routing to #/");
            window.location.hash = '#/';
          }
        }
      })();
    </script>
    `;

  if (!content.includes('Electron Bootstrap')) {
    content = content.replace('<body>', '<body>' + bootstrapScript);
  }

  fs.writeFileSync(distPath, content);
  console.log('✅ index.html otimizado para Electron.');
} else {
  console.error('❌ Erro: dist/index.html não encontrado.');
}
