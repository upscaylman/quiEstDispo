import { motion } from 'framer-motion';
import React from 'react';
import AvatarUploader from './AvatarUploader';
import ProfileForm from './ProfileForm';
import { useProfileEditor } from './useProfileEditor';

const ProfileEditor = ({ user, onProfileUpdate, darkMode = false }) => {
  const {
    // États
    isEditing,
    setIsEditing,
    isEditingName,
    setIsEditingName,
    phoneNumber,
    setPhoneNumber,
    userName,
    setUserName,
    isLoading,
    isUploadingPhoto,
    error,
    setError,
    success,
    localAvatar,
    forceRefresh,

    // Actions
    handleSavePhone,
    handleRemovePhone,
    handleCancel,
    handleSaveName,
    handleCancelName,
    handlePhotoUpload,
    handleDebug,
  } = useProfileEditor(user, onProfileUpdate);

  return (
    <div
      className={`p-6 rounded-xl shadow-lg ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      } w-full max-w-md mx-auto`}
    >
      {/* Header avec avatar et nom */}
      <div className="flex items-start space-x-4 mb-6">
        <AvatarUploader
          user={user}
          localAvatar={localAvatar}
          forceRefresh={forceRefresh}
          isUploadingPhoto={isUploadingPhoto}
          onPhotoUpload={handlePhotoUpload}
          darkMode={darkMode}
        />

        {/* Section nom/email - contenu principal */}
        <div className="flex-1">
          <ProfileForm
            user={user}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            isEditingName={isEditingName}
            setIsEditingName={setIsEditingName}
            phoneNumber={phoneNumber}
            setPhoneNumber={setPhoneNumber}
            userName={userName}
            setUserName={setUserName}
            isLoading={isLoading}
            onSavePhone={handleSavePhone}
            onRemovePhone={handleRemovePhone}
            onCancel={handleCancel}
            onSaveName={handleSaveName}
            onCancelName={handleCancelName}
            onDebug={handleDebug}
            darkMode={darkMode}
          />
        </div>
      </div>

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
  );
};

export default ProfileEditor;
