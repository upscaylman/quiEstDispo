import { motion } from 'framer-motion';
import { Check, Edit2, Phone, Save, X } from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { AuthService, FriendsService } from '../services/firebaseService';

const ProfileEditor = ({ user, onProfileUpdate, darkMode = false }) => {
  const { refreshUserData } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(user.phone || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSavePhone = async () => {
    if (!phoneNumber.trim()) {
      setError('Veuillez saisir un numéro de téléphone');
      return;
    }

    // Validation basique du numéro de téléphone
    const phoneRegex = /^(\+33|0)[1-9](\d{8})$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
      setError('Format invalide. Utilisez 06 12 34 56 78 ou +33 6 12 34 56 78');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Normaliser le numéro
      const normalizedPhone = FriendsService.normalizePhoneNumber(phoneNumber);

      // Vérifier que le numéro n'est pas déjà utilisé par un autre utilisateur
      await AuthService.updateUserPhone(user.uid, normalizedPhone);

      setSuccess('Numéro de téléphone ajouté avec succès ! 🎉');
      setIsEditing(false);

      // Effacer le message de succès après 3 secondes
      setTimeout(() => setSuccess(''), 3000);

      // Recharger les données utilisateur depuis Firebase
      await refreshUserData();

      // Mettre à jour l'état local si la fonction est fournie
      if (onProfileUpdate) {
        await onProfileUpdate({ ...user, phone: normalizedPhone });
      }
    } catch (error) {
      console.error('Erreur mise à jour téléphone:', error);
      setError(error.message || 'Erreur lors de la mise à jour');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setPhoneNumber(user.phone || '');
    setIsEditing(false);
    setError('');
  };

  return (
    <div
      className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 shadow mb-4`}
    >
      <h3
        className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}
      >
        Mon Profil
      </h3>

      {/* Informations de base */}
      <div className="flex items-center mb-6">
        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mr-4">
          {user.avatar && user.avatar.startsWith('http') ? (
            <img
              src={user.avatar}
              alt="Avatar"
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <span className="text-4xl">{user.avatar || '👤'}</span>
          )}
        </div>
        <div>
          <h4
            className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}
          >
            {user.name || 'Utilisateur'}
          </h4>
          <p
            className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
          >
            {user.email}
          </p>
        </div>
      </div>

      {/* Section numéro de téléphone */}
      <div
        className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} pt-4`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <Phone
              size={18}
              className={`mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
            />
            <h5
              className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}
            >
              Numéro de téléphone
            </h5>
          </div>

          {!isEditing && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsEditing(true)}
              className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
              title="Modifier le numéro"
            >
              <Edit2
                size={16}
                className={darkMode ? 'text-gray-300' : 'text-gray-600'}
              />
            </motion.button>
          )}
        </div>

        <p
          className={`text-xs mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
        >
          Nécessaire pour que vos amis puissent vous trouver et vous ajouter
        </p>

        {isEditing ? (
          <div className="space-y-3">
            <div>
              <input
                type="tel"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                placeholder="06 12 34 56 78"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                disabled={isLoading}
              />
              <p
                className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
              >
                Formats acceptés : 06 12 34 56 78, +33 6 12 34 56 78
              </p>
            </div>

            <div className="flex space-x-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSavePhone}
                disabled={isLoading}
                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    Enregistrer
                  </>
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCancel}
                disabled={isLoading}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
                  darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                <X size={16} />
              </motion.button>
            </div>
          </div>
        ) : (
          <div
            className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
          >
            {user.phone ? (
              <div className="flex items-center">
                <Check size={16} className="text-green-500 mr-2" />
                <span
                  className={`font-mono ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}
                >
                  {user.phone}
                </span>
                <span
                  className={`ml-2 text-xs ${darkMode ? 'text-green-400' : 'text-green-600'}`}
                >
                  ✓ Vos amis peuvent vous trouver
                </span>
              </div>
            ) : (
              <div className="flex items-center">
                <div
                  className={`w-4 h-4 rounded-full bg-orange-500 mr-2 flex items-center justify-center`}
                >
                  <span className="text-white text-xs">!</span>
                </div>
                <span
                  className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                >
                  Aucun numéro de téléphone
                </span>
                <span
                  className={`ml-2 text-xs ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}
                >
                  Vos amis ne peuvent pas vous trouver
                </span>
              </div>
            )}
          </div>
        )}

        {/* Messages d'erreur et de succès */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-3 bg-red-100 border border-red-300 rounded-lg"
          >
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-3 bg-green-100 border border-green-300 rounded-lg"
          >
            <p className="text-green-700 text-sm font-medium">{success}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ProfileEditor;
