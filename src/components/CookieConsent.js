import { AnimatePresence, motion } from 'framer-motion';
import { Cookie, Settings, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { CookieService } from '../services/cookieService';

const CookieConsent = ({ darkMode = false }) => {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true, // Toujours true, non modifiable
    functional: false,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà donné son consentement
    const consent = CookieService.getConsent();
    if (!consent) {
      setShowBanner(true);
    } else {
      setPreferences(consent.preferences);
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    };

    CookieService.setConsent(allAccepted);
    setPreferences(allAccepted);
    setShowBanner(false);
    setShowPreferences(false);
  };

  const handleAcceptNecessary = () => {
    const necessaryOnly = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    };

    CookieService.setConsent(necessaryOnly);
    setPreferences(necessaryOnly);
    setShowBanner(false);
    setShowPreferences(false);
  };

  const handleSavePreferences = () => {
    CookieService.setConsent(preferences);
    setShowBanner(false);
    setShowPreferences(false);
  };

  const togglePreference = type => {
    if (type === 'necessary') return; // Ne peut pas être désactivé

    setPreferences(prev => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const cookieTypes = [
    {
      id: 'necessary',
      name: 'Cookies nécessaires',
      description:
        "Indispensables au fonctionnement du site. Permettent la navigation, l'authentification et les fonctions de base.",
      required: true,
    },
    {
      id: 'functional',
      name: 'Cookies fonctionnels',
      description:
        "Améliorent l'expérience utilisateur en mémorisant vos préférences (thème, langue, etc.).",
      required: false,
    },
    {
      id: 'analytics',
      name: 'Cookies analytiques',
      description:
        "Nous aident à comprendre comment vous utilisez le site pour l'améliorer (anonymisés).",
      required: false,
    },
    {
      id: 'marketing',
      name: 'Cookies marketing',
      description:
        "Utilisés pour personnaliser la publicité et mesurer l'efficacité des campagnes.",
      required: false,
    },
  ];

  if (!showBanner && !showPreferences) return null;

  return (
    <AnimatePresence>
      {/* Banner de consentement */}
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg"
        >
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
              <div className="flex items-start gap-3 flex-1">
                <Cookie
                  className="text-blue-500 mt-1 flex-shrink-0"
                  size={24}
                />
                <div>
                  <h3
                    className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}
                  >
                    🍪 Nous utilisons des cookies
                  </h3>
                  <p
                    className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                  >
                    Nous utilisons des cookies pour améliorer votre expérience,
                    analyser le trafic et personnaliser le contenu. En
                    continuant, vous acceptez notre utilisation des cookies.{' '}
                    <button
                      onClick={() => setShowPreferences(true)}
                      className="text-blue-500 hover:text-blue-600 underline"
                    >
                      Personnaliser
                    </button>
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                <button
                  onClick={handleAcceptNecessary}
                  className={`px-4 py-2 rounded-lg border font-medium transition-colors ${
                    darkMode
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Nécessaires uniquement
                </button>
                <button
                  onClick={() => setShowPreferences(true)}
                  className={`px-4 py-2 rounded-lg border font-medium transition-colors flex items-center gap-2 ${
                    darkMode
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Settings size={16} />
                  Personnaliser
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                >
                  Accepter tout
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Modal de préférences */}
      {showPreferences && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={e =>
            e.target === e.currentTarget && setShowPreferences(false)
          }
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            {/* Header */}
            <div
              className={`sticky top-0 p-6 border-b ${
                darkMode
                  ? 'border-gray-700 bg-gray-800'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Cookie className="text-blue-500" size={24} />
                  <h2
                    className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}
                  >
                    Préférences des cookies
                  </h2>
                </div>
                <button
                  onClick={() => setShowPreferences(false)}
                  className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <p
                className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
              >
                Nous respectons votre vie privée. Vous pouvez choisir quels
                types de cookies accepter. Notez que désactiver certains cookies
                peut affecter le fonctionnement du site.
              </p>

              <div className="space-y-4">
                {cookieTypes.map(cookieType => (
                  <div
                    key={cookieType.id}
                    className={`p-4 rounded-lg border ${
                      darkMode
                        ? 'border-gray-700 bg-gray-750'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3
                            className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}
                          >
                            {cookieType.name}
                          </h3>
                          {cookieType.required && (
                            <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                              Requis
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                        >
                          {cookieType.description}
                        </p>
                      </div>

                      <div className="flex-shrink-0">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferences[cookieType.id]}
                            onChange={() => togglePreference(cookieType.id)}
                            disabled={cookieType.required}
                            className="sr-only peer"
                          />
                          <div
                            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out ${
                              preferences[cookieType.id]
                                ? 'bg-blue-500'
                                : darkMode
                                  ? 'bg-gray-600'
                                  : 'bg-gray-300'
                            } ${cookieType.required ? 'opacity-50' : ''}`}
                          >
                            <div
                              className={`absolute top-0.5 left-0.5 bg-white rounded-full h-5 w-5 transition-transform duration-200 ease-in-out ${
                                preferences[cookieType.id]
                                  ? 'translate-x-5'
                                  : 'translate-x-0'
                              }`}
                            />
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div
              className={`sticky bottom-0 p-6 border-t ${
                darkMode
                  ? 'border-gray-700 bg-gray-800'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <button
                  onClick={handleAcceptNecessary}
                  className={`px-4 py-2 rounded-lg border font-medium transition-colors ${
                    darkMode
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Nécessaires uniquement
                </button>
                <button
                  onClick={handleSavePreferences}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                >
                  Sauvegarder les préférences
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                >
                  Accepter tout
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;
