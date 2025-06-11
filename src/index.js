import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import reportWebVitals from './reportWebVitals';

// Importer le gestionnaire d'erreurs Firebase en premier
import './utils/errorHandler';

// Enregistrement du Service Worker avec détection automatique des mises à jour
// Désactivé temporairement en développement pour éviter les erreurs de cache
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(registration => {
        console.log('✅ Service Worker enregistré:', registration);

        // Vérifier immédiatement s'il y a des mises à jour
        registration.update();

        // Vérifier périodiquement les mises à jour
        setInterval(() => {
          registration.update();
        }, 30000); // Toutes les 30 secondes
      })
      .catch(registrationError => {
        console.log('❌ Erreur Service Worker:', registrationError);
      });
  });
} else if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Service Worker désactivé en développement');
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
