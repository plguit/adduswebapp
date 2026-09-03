import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx'
import { backgroundSync } from './utils/BackgroundSyncService.js';

backgroundSync.start();;
import { LanguageProvider } from './utils/i18n.js';
import './index.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      console.log('[PWA] Service Worker registered:', registration.scope);
    }).catch((err) => {
      console.log('[PWA] Service Worker registration failed:', err);
    });
  });
}

if (window.location.search.includes('reset=true')) {
  localStorage.clear();
  sessionStorage.clear();
  window.history.replaceState({}, document.title, window.location.pathname);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </React.StrictMode>
);
