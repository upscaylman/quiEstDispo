import { motion } from 'framer-motion';
import { Camera } from 'lucide-react';
import React, { useRef } from 'react';

const AvatarUploader = ({
  user,
  localAvatar,
  forceRefresh,
  isUploadingPhoto,
  onPhotoUpload,
  onAvatarError,
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

  return (
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
                  // Reset en cas d'erreur
                  if (onAvatarError) {
                    onAvatarError();
                  }
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
  );
};

export default AvatarUploader;
