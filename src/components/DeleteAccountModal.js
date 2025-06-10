import { motion } from 'framer-motion';
import React, { useState } from 'react';

const DeleteAccountModal = ({ isOpen, onClose, onConfirm, darkMode }) => {
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleConfirm = () => {
    if (deleteConfirmText !== 'DELETE') {
      alert('Veuillez taper exactement "DELETE" pour confirmer');
      return;
    }
    onConfirm();
    setDeleteConfirmText('');
  };

  const handleClose = () => {
    setDeleteConfirmText('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 w-full max-w-md border shadow-xl`}
      >
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              className="text-red-600"
            >
              <path
                d="M6 6l12 12M6 18L18 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h3
            className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}
          >
            Supprimer votre compte
          </h3>
          <p
            className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}
          >
            Cette action est <strong>irréversible</strong>. Toutes vos données,
            amis, disponibilités et notifications seront définitivement
            supprimées.
          </p>
        </div>

        <div className="mb-6">
          <label
            className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
          >
            Pour confirmer, tapez{' '}
            <span className="font-mono bg-gray-100 px-1 rounded text-red-600">
              DELETE
            </span>
          </label>
          <input
            type="text"
            value={deleteConfirmText}
            onChange={e => setDeleteConfirmText(e.target.value)}
            placeholder="Tapez DELETE ici..."
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
          />
        </div>

        <div className="flex space-x-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleClose}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
              darkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Annuler
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleConfirm}
            disabled={deleteConfirmText !== 'DELETE'}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
              deleteConfirmText === 'DELETE'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Supprimer définitivement
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default DeleteAccountModal;
