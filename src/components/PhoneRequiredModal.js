import { AnimatePresence, motion } from 'framer-motion';
import { Phone, Settings, X } from 'lucide-react';
import React from 'react';

const PhoneRequiredModal = ({ isOpen, onClose, onGoToSettings, darkMode }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className={`${
            darkMode ? 'bg-gray-800' : 'bg-white'
          } rounded-xl p-6 max-w-md w-full shadow-xl`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <Phone size={20} className="text-blue-600" />
              </div>
              <h3
                className={`text-lg font-semibold ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}
              >
                Numéro requis
              </h3>
            </div>
            <button
              onClick={onClose}
              className={`p-1 rounded-lg transition-colors ${
                darkMode
                  ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <X size={20} />
            </button>
          </div>

          {/* Contenu */}
          <div className="mb-6">
            <p
              className={`${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              } mb-4 leading-relaxed`}
            >
              Pour inviter des amis, vous devez d'abord ajouter votre numéro de
              téléphone.
            </p>

            <div
              className={`${
                darkMode ? 'bg-gray-700' : 'bg-gray-50'
              } rounded-lg p-4 mb-4`}
            >
              <h4
                className={`font-medium mb-2 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}
              >
                Pourquoi un numéro de téléphone ?
              </h4>
              <ul
                className={`text-sm space-y-1 ${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                <li>• Vos amis pourront vous retrouver facilement</li>
                <li>• Vous pourrez rechercher des amis par leur numéro</li>
                <li>• Améliore la sécurité de votre compte</li>
              </ul>
            </div>

            <p
              className={`text-sm ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              Votre numéro ne sera partagé qu'avec vos amis confirmés.
            </p>
          </div>

          {/* Boutons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                darkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Plus tard
            </button>
            <button
              onClick={onGoToSettings}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <Settings size={18} />
              <span>Ajouter mon numéro</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PhoneRequiredModal;
