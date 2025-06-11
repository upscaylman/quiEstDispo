import { motion } from 'framer-motion';
import { Check, Edit2, Phone, Save, X } from 'lucide-react';
import React from 'react';
import { AuthService } from '../../services/firebaseService';

const ProfileForm = ({
  user,
  isEditing,
  setIsEditing,
  isEditingName,
  setIsEditingName,
  phoneNumber,
  setPhoneNumber,
  userName,
  setUserName,
  isLoading,
  onSavePhone,
  onRemovePhone,
  onCancel,
  onSaveName,
  onCancelName,
  onDebug,
  darkMode = false,
  showOnlyNameSection = false,
  showOnlyNameEdit = false,
  showOnlyPhoneSection = false,
  error = '',
  success = '',
}) => {
  // Si on veut seulement la section nom (header avec bouton édition)
  if (showOnlyNameSection) {
    return (
      <>
        {/* Section nom avec édition */}
        <div className="flex items-center justify-between mb-1">
          <h4
            className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}
          >
            {user.name || 'Utilisateur'}
          </h4>
          {!isEditingName && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsEditingName(true)}
              className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
              title="Modifier le nom"
            >
              <Edit2
                size={16}
                className={darkMode ? 'text-gray-300' : 'text-gray-600'}
              />
            </motion.button>
          )}
        </div>
        <p
          className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} truncate`}
          title={user.email}
        >
          {user.email}
        </p>
      </>
    );
  }

  // Si on veut seulement le formulaire d'édition du nom
  if (showOnlyNameEdit) {
    return (
      <div className="mt-4 space-y-3">
        <div>
          <input
            type="text"
            value={userName}
            onChange={e => setUserName(e.target.value)}
            placeholder="Votre nom"
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
            Choisissez un nom que vos amis pourront facilement reconnaître
          </p>
        </div>

        <div className="flex space-x-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onSaveName}
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
            onClick={onCancelName}
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
    );
  }

  // Si on veut seulement la section téléphone
  if (showOnlyPhoneSection) {
    return (
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
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditing(true)}
                className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
                title={user.phone ? 'Modifier le numéro' : 'Ajouter un numéro'}
              >
                <Edit2
                  size={16}
                  className={darkMode ? 'text-gray-300' : 'text-gray-600'}
                />
              </motion.button>

              {user.phone && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onRemovePhone}
                  disabled={isLoading}
                  className={`p-2 rounded-full ${darkMode ? 'bg-red-700 hover:bg-red-600' : 'bg-red-100 hover:bg-red-200'} transition-colors`}
                  title="Supprimer le numéro"
                >
                  <X
                    size={16}
                    className={darkMode ? 'text-red-300' : 'text-red-600'}
                  />
                </motion.button>
              )}
            </div>
          )}
        </div>

        <p
          className={`text-xs mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
        >
          Nécessaire pour que vos amis puissent vous trouver et vous ajouter.
          {user.phone ? ' Vous pouvez le modifier ou le supprimer.' : ''}
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
                onClick={onSavePhone}
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
                onClick={onCancel}
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

        {/* Bouton de debug en développement */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-gray-100 border border-gray-300 rounded-lg">
            <p className="text-xs text-gray-600 mb-2">
              Mode développement - Debug :
            </p>
            <div className="space-y-2">
              <button
                onClick={onDebug}
                className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-xs font-medium mr-2"
              >
                🔍 Vérifier données Firebase
              </button>
              <button
                onClick={async () => {
                  try {
                    console.log(
                      "🧪 Test: Tentative d'ajout d'un numéro déjà utilisé..."
                    );
                    await AuthService.updateUserPhone(user.uid, '+33677982529');
                  } catch (error) {
                    console.log(
                      '✅ Test réussi - Erreur attendue:',
                      error.message
                    );
                  }
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-xs font-medium"
              >
                🧪 Tester conflit numéro
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Version complète (fallback)
  return (
    <div className="space-y-4">
      {/* Contenu complet comme avant... */}
      <p className="text-gray-500">Utilisation complète du composant</p>
    </div>
  );
};

export default ProfileForm;
