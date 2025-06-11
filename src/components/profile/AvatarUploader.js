import { motion } from 'framer-motion';
import { Camera } from 'lucide-react';
import React, { useRef } from 'react';

const AvatarUploader = ({
  user,
  localAvatar,
  forceRefresh,
  isUploadingPhoto,
  onPhotoUpload,
  darkMode = false,
}) => {
  const fileInputRef = useRef(null);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoUpload = async event => {
    const file = event.target.files?.[0];
    if (file && onPhotoUpload) {
      await onPhotoUpload(file);
      // Réinitialiser l'input file pour permettre de re-sélectionner le même fichier
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Déterminer quelle image afficher
  const avatarToDisplay = localAvatar || user.avatar;

  return (
    <div className="relative">
      {/* Avatar */}
      <div
        className={`w-20 h-20 rounded-full overflow-hidden ${
          darkMode ? 'bg-gray-700' : 'bg-gray-200'
        } flex items-center justify-center`}
      >
        {avatarToDisplay ? (
          <img
            key={`${avatarToDisplay}-${forceRefresh}`}
            src={avatarToDisplay}
            alt="Avatar"
            className="w-full h-full object-cover"
            onError={e => {
              console.error('Erreur chargement avatar:', e);
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div
            className={`w-12 h-12 rounded-full ${
              darkMode ? 'bg-gray-600' : 'bg-gray-300'
            } flex items-center justify-center`}
          >
            <span
              className={`text-lg font-semibold ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}
            >
              {user.name?.charAt(0)?.toUpperCase() ||
                user.email?.charAt(0)?.toUpperCase() ||
                '?'}
            </span>
          </div>
        )}
      </div>

      {/* Bouton de changement de photo */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={triggerFileInput}
        disabled={isUploadingPhoto}
        className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full ${
          darkMode
            ? 'bg-blue-600 hover:bg-blue-700'
            : 'bg-blue-500 hover:bg-blue-600'
        } text-white flex items-center justify-center shadow-lg transition-colors`}
        title="Changer la photo"
      >
        {isUploadingPhoto ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
        ) : (
          <Camera size={16} />
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
  );
};

export default AvatarUploader;
