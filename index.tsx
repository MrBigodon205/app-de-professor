import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { TutorialProvider } from './contexts/TutorialContext';

// ... imports ...

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        <ThemeProvider>
          <ClassProvider>
            <TutorialProvider>
              <App />
            </TutorialProvider>
          </ClassProvider>
        </ThemeProvider>
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>
);