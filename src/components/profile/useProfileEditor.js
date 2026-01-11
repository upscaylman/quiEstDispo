import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { AuthService, FriendsService } from '../../services/firebaseService';

export const useProfileEditor = (user, onProfileUpdate) => {
  const { refreshUserData } = useAuth();

  // États
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(user.phone || '');
  const [userName, setUserName] = useState(user.name || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [localAvatar, setLocalAvatar] = useState(null);
  const [forceRefresh, setForceRefresh] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false); // Flag pour empêcher override pendant suppression

  // Synchroniser l'avatar local avec les changements de user.avatar
  useEffect(() => {
    setLocalAvatar(null);
  }, [user.avatar]);

  // Synchroniser les états locaux avec les changements de user
  useEffect(() => {
    console.log('🔄 Synchronisation phoneNumber:', user.phone);
    if (!isDeleting) {
      // Ne pas override si on supprime
      setPhoneNumber(user.phone || '');
    }
  }, [user.phone, isDeleting]);

  useEffect(() => {
    console.log('🔄 Synchronisation userName:', user.name);
    setUserName(user.name || '');
  }, [user.name]);

  // Debug des changements de l'objet user
  useEffect(() => {
    console.log('👤 User object changed:', user);
  }, [user]);

  // Fonctions de gestion du téléphone
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

      setSuccess('Numéro de téléphone ajouté avec succès !');
      setIsEditing(false);

      // Mettre à jour immédiatement l'état local
      setPhoneNumber(normalizedPhone);

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
    setIsDeleting(true); // Empêcher les useEffect de override

    try {
      console.log('🗑️ Suppression du numéro de téléphone...');
      await AuthService.removeUserPhone(user.uid);

      setSuccess('Numéro de téléphone supprimé !');
      setIsEditing(false);

      // Mettre à jour immédiatement l'état local AVANT refreshUserData
      setPhoneNumber('');

      // Effacer le message de succès après 3 secondes
      setTimeout(() => setSuccess(''), 3000);

      // Mettre à jour l'état parent si la fonction est fournie
      if (onProfileUpdate) {
        await onProfileUpdate({ ...user, phone: '' });
      }

      // Recharger les données utilisateur depuis Firebase (en dernier)
      await refreshUserData();

      // Attendre un peu puis réautoriser les synchronisations
      setTimeout(() => {
        setIsDeleting(false);
      }, 1000);
    } catch (error) {
      console.error('❌ Erreur suppression numéro:', error);
      setError(error.message || 'Erreur lors de la suppression');
      setIsDeleting(false); // Réinitialiser en cas d'erreur
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setPhoneNumber(user.phone || '');
    setIsEditing(false);
    setError('');
  };

  // Fonctions de gestion du nom
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

      setSuccess('Nom mis à jour avec succès !');
      setIsEditingName(false);

      // Mettre à jour immédiatement l'état local
      setUserName(userName.trim());

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

  const handleCancelName = () => {
    setUserName(user.name || '');
    setIsEditingName(false);
    setError('');
  };

  // Fonctions de gestion de l'avatar
  const handlePhotoUpload = async file => {
    if (!file) {
      console.log('❌ Aucun fichier sélectionné');
      return;
    }

    if (isUploadingPhoto) {
      console.log('❌ Upload déjà en cours, ignoré');
      return;
    }

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

      setLocalAvatar(photoURL);
      setForceRefresh(prev => prev + 1);

      setSuccess('Photo de profil mise à jour !');
      setTimeout(() => setSuccess(''), 3000);

      if (onProfileUpdate) {
        await onProfileUpdate({ ...user, avatar: photoURL });
      }

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
      console.log('🏁 Fin handlePhotoUpload, isUploadingPhoto:', false);
    }
  };

  // Fonction de debug
  const handleDebug = async () => {
    if (process.env.NODE_ENV === 'development') {
      try {
        console.log('🔍 Debug: Vérification des données utilisateur...');
        console.log('User actuel:', user);
        console.log('États locaux:', {
          phoneNumber,
          userName,
          isEditing,
          isEditingName,
          localAvatar,
        });
      } catch (error) {
        console.error('Erreur debug:', error);
      }
    }
  };

  return {
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
    isDeleting,

    // Actions
    handleSavePhone,
    handleRemovePhone,
    handleCancel,
    handleSaveName,
    handleCancelName,
    handlePhotoUpload,
    handleDebug,
  };
};
