import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ClassProvider } from './contexts/ClassContext';


import { HashRouter } from 'react-router-dom';

import { OfflineProvider } from './contexts/OfflineContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <HashRouter>
        <ThemeProvider>
          <ClassProvider>
            <OfflineProvider>
              <App />
            </OfflineProvider>
          </ClassProvider>
        </ThemeProvider>
      </HashRouter>
    </AuthProvider>
  </React.StrictMode>
);