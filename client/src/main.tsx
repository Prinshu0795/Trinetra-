// client/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register TRINETRA PWA Service Worker for zero-internet offline emergency operation
if ('serviceWorker' in navigator && (Boolean((import.meta as any)?.env?.PROD) || window.location.hostname === 'localhost')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[TRINETRA] PWA Service Worker registered successfully for offline survival mode:', reg.scope);
      })
      .catch((err) => {
        console.warn('[TRINETRA] Service Worker registration skipped:', err);
      });
  });
}
