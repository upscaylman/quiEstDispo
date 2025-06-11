import { motion } from 'framer-motion';
import { Camera, Check, Edit2, Phone, Save, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { AuthService, FriendsService } from '../services/firebaseService';

const ProfileEditor = ({ user, onProfileUpdate, darkMode = false }) => {
  const { refreshUserData } = useAuth();
  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(user.phone || '');
  const [userName, setUserName] = useState(user.name || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // État local pour l'avatar pour mise à jour immédiate
  const [localAvatar, setLocalAvatar] = useState(null);
  const [forceRefresh, setForceRefresh] = useState(0);

  // Synchroniser l'avatar local avec les changements de user.avatar
  useEffect(() => {
    setLocalAvatar(null); // Réinitialiser l'avatar local quand user change
  }, [user.avatar]);

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

  const handleCancelName = () => {
    setUserName(user.name || '');
    setIsEditingName(false);
    setError('');
  };

  const handleSaveName = async () => {
    if (!userName.trim()) {
      setError('Veuillez saisir un nom');
      return;
    }

    if (userName.trim().length < 2) {
      setError('Le nom doit contenir au moins 2 caractères');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await AuthService.updateUserName(user.uid, userName.trim());

      setSuccess('Nom mis à jour avec succès ! 🎉');
      setIsEditingName(false);

      setTimeout(() => setSuccess(''), 3000);
      await refreshUserData();

      if (onProfileUpdate) {
        await onProfileUpdate({ ...user, name: userName.trim() });
      }
    } catch (error) {
      console.error('Erreur mise à jour nom:', error);
      setError(error.message || 'Erreur lors de la mise à jour');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = async event => {
    const file = event.target.files?.[0];
    if (!file) {
      console.log('❌ Aucun fichier sélectionné');
      return;
    }

    // Éviter les uploads multiples
    if (isUploadingPhoto) {
      console.log('❌ Upload déjà en cours, ignoré');
      return;
    }

    // Vérifications du fichier
    if (!file.type.startsWith('image/')) {
      console.log('❌ Type de fichier invalide:', file.type);
      setError('Veuillez sélectionner une image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      console.log('❌ Fichier trop volumineux:', file.size);
      setError("L'image doit faire moins de 5MB");
      return;
    }

    setIsUploadingPhoto(true);
    setError('');
    console.log('🚀 Début handlePhotoUpload...', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      userId: user.uid,
      currentAvatar: user.avatar,
      localAvatar: localAvatar,
    });

    try {
      console.log('📞 Appel AuthService.uploadUserPhoto...');
      const photoURL = await AuthService.uploadUserPhoto(user.uid, file);
      console.log(
        '✅ Upload terminé, URL:',
        photoURL.substring(0, 100) + '...'
      );

      // Mettre à jour immédiatement l'avatar local
      setLocalAvatar(photoURL);
      setForceRefresh(prev => prev + 1); // Forcer un re-render

      setSuccess('Photo de profil mise à jour ! 🎉');
      setTimeout(() => setSuccess(''), 3000);

      // Mettre à jour l'état parent immédiatement
      if (onProfileUpdate) {
        await onProfileUpdate({ ...user, avatar: photoURL });
      }

      // Rafraîchir les données Firebase
      try {
        await refreshUserData();
      } catch (error) {
        console.warn('Erreur refresh userData:', error);
      }
    } catch (error) {
      console.error('❌ Erreur dans handlePhotoUpload:', error);
      setError(error.message || "Erreur lors de l'upload");
    } finally {
      setIsUploadingPhoto(false);
      // Réinitialiser l'input file pour permettre de re-sélectionner le même fichier
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      console.log('🏁 Fin handlePhotoUpload, isUploadingPhoto:', false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleDebug = async () => {
    if (process.env.NODE_ENV === 'development') {
      try {
        console.log('🔍 Debug: Vérification des données utilisateur...');
        console.log('User ID:', user.uid);
        await AuthService.debugUserData(user.uid);
      } catch (error) {
        console.error('❌ Erreur debug:', error);
      }
    }
  };

  const handleRemovePhone = async () => {
    if (
      !window.confirm(
        'Êtes-vous sûr de vouloir supprimer votre numéro de téléphone ?'
      )
    ) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('🗑️ Suppression du numéro de téléphone...');
      await AuthService.removeUserPhone(user.uid);

      setSuccess('✅ Numéro de téléphone supprimé !');
      setPhoneNumber('');
      setIsEditing(false);

      // Effacer le message de succès après 3 secondes
      setTimeout(() => setSuccess(''), 3000);

      // Recharger les données utilisateur depuis Firebase
      await refreshUserData();

      // Mettre à jour l'état local si la fonction est fournie
      if (onProfileUpdate) {
        await onProfileUpdate({ ...user, phone: '' });
      }
    } catch (error) {
      console.error('❌ Erreur suppression numéro:', error);
      setError(error.message || 'Erreur lors de la suppression');
    } finally {
      setIsLoading(false);
    }
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
      <div className="mb-6">
        {/* Photo de profil */}
        <div className="flex items-center mb-4">
          <div className="relative group">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mr-4 overflow-hidden">
              {(() => {
                const avatarToShow = localAvatar || user.avatar;
                const isImageURL =
                  avatarToShow &&
                  (avatarToShow.startsWith('http') ||
                    avatarToShow.startsWith('data:'));

                if (isImageURL) {
                  return (
                    <img
                      key={`avatar-${forceRefresh}-${avatarToShow.substring(0, 20)}`} // Key unique pour forcer re-render
                      src={avatarToShow}
                      alt="Avatar"
                      className="w-20 h-20 rounded-full object-cover"
                      onLoad={() => console.log('✅ Avatar affiché')}
                      onError={e => {
                        console.log(
                          '❌ Erreur avatar:',
                          e.target.src.substring(0, 50)
                        );
                        setLocalAvatar(null); // Reset en cas d'erreur
                      }}
                    />
                  );
                }

                // Emoji ou icône par défaut
                return <span className="text-4xl">{avatarToShow || '👤'}</span>;
              })()}
            </div>
            {/* Overlay d'upload au centre avec transparence */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={triggerFileInput}
              disabled={isUploadingPhoto}
              className="absolute inset-0 w-20 h-20 mr-4 rounded-full flex items-center justify-center transition-all duration-200 bg-black/0 hover:bg-black/50 text-transparent hover:text-white group-hover:bg-black/40 group-hover:text-white"
              title="Changer la photo"
            >
              {isUploadingPhoto ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
              ) : (
                <Camera size={20} />
              )}
            </motion.button>
            {/* Input file caché */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>

          {/* Nom et email */}
          <div className="flex-1">
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
          </div>
        </div>

        {/* Edition du nom */}
        {isEditingName && (
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
                onClick={handleSaveName}
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
                onClick={handleCancelName}
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
        )}
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
                  onClick={handleRemovePhone}
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

        {/* Bouton de debug en développement */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-gray-100 border border-gray-300 rounded-lg">
            <p className="text-xs text-gray-600 mb-2">
              Mode développement - Debug :
            </p>
            <div className="space-y-2">
              <button
                onClick={handleDebug}
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
                    // Utiliser votre propre numéro pour tester le conflit
                    await AuthService.updateUserPhone(user.uid, '+33677982529');
                  } catch (error) {
                    console.log(
                      '✅ Test réussi - Erreur attendue:',
                      error.message
                    );
                    setError(error.message);
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
    </div>
  );
};

export default ProfileEditor;
