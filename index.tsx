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
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#f8fafc', color: '#334155'
    }}>
      <div style={{ padding: '2rem', backgroundColor: 'white', borderRadius: '1rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#ef4444' }}>Configuração Necessária</h1>
        <p style={{ marginBottom: '1rem' }}>As variáveis de ambiente do Supabase não foram detectadas.</p>
        <code style={{ display: 'block', padding: '1rem', backgroundColor: '#f1f5f9', borderRadius: '0.5rem', marginBottom: '1rem', fontFamily: 'monospace' }}>
          VITE_SUPABASE_URL<br />
          VITE_SUPABASE_ANON_KEY
        </code>
        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Verifique se o arquivo <b>.env</b> existe (local) ou se as variáveis foram adicionadas no painel de deploy (Vercel/Netlify).</p>
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