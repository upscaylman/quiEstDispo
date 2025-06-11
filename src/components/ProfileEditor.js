import React from 'react';
import AvatarUploader from './profile/AvatarUploader';
import ProfileForm from './profile/ProfileForm';
import { useProfileEditor } from './profile/useProfileEditor';

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
          <AvatarUploader
            user={user}
            localAvatar={localAvatar}
            forceRefresh={forceRefresh}
            isUploadingPhoto={isUploadingPhoto}
            onPhotoUpload={handlePhotoUpload}
            onAvatarError={() => setError('')}
            darkMode={darkMode}
          />

          {/* Nom et email */}
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
              showOnlyNameSection={true}
            />
          </div>
        </div>

        {/* Edition du nom (si en cours) */}
        {isEditingName && (
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
            showOnlyNameEdit={true}
          />
        )}
      </div>

      {/* Section numéro de téléphone */}
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
        showOnlyPhoneSection={true}
        error={error}
        success={success}
      />
    </div>
  );
};

export default ProfileEditor;
