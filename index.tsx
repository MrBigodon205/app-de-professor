import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ClassProvider } from './contexts/ClassContext';


import { HashRouter } from 'react-router-dom';


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// --- SAFETY CHECK FOR PRODUCTION ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // If config is missing, render a setup screen immediately without crashing
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <div className="setup-container">
      <div className="setup-card">
        <h1 className="setup-title">Configuração Necessária</h1>
        <p className="setup-text">As variáveis de ambiente do Supabase não foram detectadas.</p>
        <code className="setup-code">
          VITE_SUPABASE_URL<br />
          VITE_SUPABASE_ANON_KEY
        </code>
        <p className="setup-footer">Verifique se o arquivo <b>.env</b> existe (local) ou se as variáveis foram adicionadas no painel de deploy (Vercel/Netlify).</p>
      </div>
    </div>
  );
} else {
  // Config exists, mount the app
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <AuthProvider>
        <HashRouter>
          <ThemeProvider>
            <ClassProvider>
              <App />
            </ClassProvider>
          </ThemeProvider>
        </HashRouter>
      </AuthProvider>
    </React.StrictMode>
  );
}