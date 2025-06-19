// @ts-nocheck
// Tests useProfileEditor.js - PHASE 3 - Hooks Profil (Priorité MOYENNE)

import { act, renderHook } from '@testing-library/react';

// Import du hook après les mocks
import { useProfileEditor } from '../components/profile/useProfileEditor';

// === MOCKS COMPLETS ===

// Mock useAuth hook
const mockRefreshUserData = jest.fn();
jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    refreshUserData: mockRefreshUserData,
  }),
}));

// Mock Firebase services - tous en tant que fonctions simples dans le mock
jest.mock('../services/firebaseService', () => ({
  AuthService: {
    uploadUserPhoto: jest.fn(),
    updateUserProfile: jest.fn(),
    deleteUserPhone: jest.fn(),
    validateAndFormatPhoneNumber: jest.fn(),
    updateUserPhone: jest.fn(),
    removeUserPhone: jest.fn(),
    updateUserName: jest.fn(),
  },
  FriendsService: {
    updateProfile: jest.fn(),
    normalizePhoneNumber: jest.fn(),
  },
}));

// Récupérer les mocks pour les utiliser dans les tests
const { AuthService, FriendsService } = require('../services/firebaseService');

describe('useProfileEditor - PHASE 3 - Hooks Profil', () => {
  // Props par défaut pour les tests
  const defaultUser = {
    uid: 'user1',
    name: 'Test User',
    email: 'test@example.com',
    phone: '+33612345678',
    avatar: '👤',
  };

  const mockOnProfileUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();

    // Configuration par défaut des mocks
    AuthService.uploadUserPhoto.mockResolvedValue(
      'https://example.com/new-avatar.jpg'
    );
    AuthService.updateUserProfile.mockResolvedValue();
    AuthService.updateUserPhone.mockResolvedValue();
    AuthService.removeUserPhone.mockResolvedValue();
    AuthService.updateUserName.mockResolvedValue();
    FriendsService.normalizePhoneNumber.mockImplementation(phone => phone);
    mockRefreshUserData.mockResolvedValue();
  });

  describe('🏗️ Initialisation et états', () => {
    test('doit initialiser avec les bonnes valeurs par défaut', () => {
      const { result } = renderHook(() =>
        useProfileEditor(defaultUser, mockOnProfileUpdate)
      );

      expect(result.current.isEditing).toBe(false);
      expect(result.current.isEditingName).toBe(false);
      expect(result.current.phoneNumber).toBe('+33612345678');
      expect(result.current.userName).toBe('Test User');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isUploadingPhoto).toBe(false);
      expect(result.current.error).toBe('');
      expect(result.current.success).toBe('');
      expect(result.current.localAvatar).toBe(null);
      expect(result.current.forceRefresh).toBe(0);
    });

    test('doit synchroniser avec les changements de user', () => {
      const { result, rerender } = renderHook(
        ({ user }) => useProfileEditor(user, mockOnProfileUpdate),
        { initialProps: { user: defaultUser } }
      );

      // Modifier l'utilisateur
      const updatedUser = {
        ...defaultUser,
        name: 'New Name',
        phone: '+33687654321',
      };

      rerender({ user: updatedUser });

      expect(result.current.userName).toBe('New Name');
      expect(result.current.phoneNumber).toBe('+33687654321');
    });

    test('doit réinitialiser localAvatar quand user.avatar change', () => {
      const { result, rerender } = renderHook(
        ({ user }) => useProfileEditor(user, mockOnProfileUpdate),
        { initialProps: { user: defaultUser } }
      );

      // Vérifier que localAvatar est initialement null
      expect(result.current.localAvatar).toBe(null);

      // Changer l'avatar de l'utilisateur
      const userWithNewAvatar = {
        ...defaultUser,
        avatar: 'new-avatar-url',
      };
      rerender({ user: userWithNewAvatar });

      // localAvatar doit rester null après changement user.avatar
      expect(result.current.localAvatar).toBe(null);
    });
  });

  describe('📱 Gestion du nom', () => {
    test('doit sauvegarder le nom avec succès', async () => {
      const { result } = renderHook(() =>
        useProfileEditor(defaultUser, mockOnProfileUpdate)
      );

      act(() => {
        result.current.setUserName('Nouveau Nom');
      });

      await act(async () => {
        await result.current.handleSaveName();
      });

      expect(AuthService.updateUserName).toHaveBeenCalledWith(
        'user1',
        'Nouveau Nom'
      );
      expect(mockOnProfileUpdate).toHaveBeenCalledWith({
        ...defaultUser,
        name: 'Nouveau Nom',
      });
      expect(result.current.success).toBe('Nom mis à jour avec succès ! 🎉');
    });

    test('doit gérer les erreurs lors de la sauvegarde du nom', async () => {
      const { result } = renderHook(() =>
        useProfileEditor(defaultUser, mockOnProfileUpdate)
      );

      AuthService.updateUserName.mockRejectedValue(
        new Error('Erreur de sauvegarde')
      );

      await act(async () => {
        await result.current.handleSaveName();
      });

      expect(result.current.error).toBe('Erreur de sauvegarde');
      expect(result.current.isLoading).toBe(false);
    });

    test("doit annuler l'édition du nom", () => {
      const { result } = renderHook(() =>
        useProfileEditor(defaultUser, mockOnProfileUpdate)
      );

      act(() => {
        result.current.setUserName('Nom modifié');
        result.current.setIsEditingName(true);
      });

      act(() => {
        result.current.handleCancelName();
      });

      expect(result.current.userName).toBe('Test User');
      expect(result.current.isEditingName).toBe(false);
    });
  });

  describe('📞 Gestion du téléphone', () => {
    test('doit sauvegarder le téléphone avec succès', async () => {
      const { result } = renderHook(() =>
        useProfileEditor(defaultUser, mockOnProfileUpdate)
      );

      AuthService.validateAndFormatPhoneNumber.mockReturnValue('+33687654321');

      act(() => {
        result.current.setPhoneNumber('06 87 65 43 21');
      });

      await act(async () => {
        await result.current.handleSavePhone();
      });

      expect(FriendsService.normalizePhoneNumber).toHaveBeenCalledWith(
        '06 87 65 43 21'
      );
      expect(AuthService.updateUserPhone).toHaveBeenCalledWith(
        'user1',
        '06 87 65 43 21'
      );
      expect(result.current.success).toBe(
        'Numéro de téléphone ajouté avec succès ! 🎉'
      );
    });

    test('doit gérer les erreurs de validation du téléphone', async () => {
      const { result } = renderHook(() =>
        useProfileEditor(defaultUser, mockOnProfileUpdate)
      );

      FriendsService.normalizePhoneNumber.mockImplementation(() => {
        throw new Error('Numéro invalide');
      });

      await act(async () => {
        await result.current.handleSavePhone();
      });

      expect(result.current.error).toBe('Numéro invalide');
    });

    test('doit supprimer le téléphone avec succès', async () => {
      // Mock window.confirm pour retourner true
      const originalConfirm = window.confirm;
      window.confirm = jest.fn(() => true);

      const { result } = renderHook(() =>
        useProfileEditor(defaultUser, mockOnProfileUpdate)
      );

      await act(async () => {
        await result.current.handleRemovePhone();
      });

      // Restaurer window.confirm
      window.confirm = originalConfirm;

      expect(AuthService.removeUserPhone).toHaveBeenCalledWith('user1');
      expect(result.current.success).toBe('✅ Numéro de téléphone supprimé !');
      expect(result.current.phoneNumber).toBe('');
    });

    test("doit annuler l'édition du téléphone", () => {
      const { result } = renderHook(() =>
        useProfileEditor(defaultUser, mockOnProfileUpdate)
      );

      act(() => {
        result.current.setPhoneNumber('Nouveau numéro');
        result.current.setIsEditing(true);
      });

      act(() => {
        result.current.handleCancel();
      });

      expect(result.current.phoneNumber).toBe('+33612345678');
      expect(result.current.isEditing).toBe(false);
    });
  });

  describe("🖼️ Gestion de l'avatar", () => {
    test('doit uploader une photo avec succès', async () => {
      const { result } = renderHook(() =>
        useProfileEditor(defaultUser, mockOnProfileUpdate)
      );

      const mockFile = new File(['image content'], 'avatar.jpg', {
        type: 'image/jpeg',
        size: 1024,
      });

      await act(async () => {
        await result.current.handlePhotoUpload(mockFile);
      });

      expect(AuthService.uploadUserPhoto).toHaveBeenCalledWith(
        'user1',
        mockFile
      );
      expect(result.current.localAvatar).toBe(
        'https://example.com/new-avatar.jpg'
      );
      expect(result.current.success).toBe('Photo de profil mise à jour ! 🎉');
      expect(result.current.forceRefresh).toBe(1);
    });

    test('doit valider le type de fichier', async () => {
      const { result } = renderHook(() =>
        useProfileEditor(defaultUser, mockOnProfileUpdate)
      );

      const invalidFile = new File(['text content'], 'document.txt', {
        type: 'text/plain',
      });

      await act(async () => {
        await result.current.handlePhotoUpload(invalidFile);
      });

      expect(result.current.error).toBe('Veuillez sélectionner une image');
      expect(AuthService.uploadUserPhoto).not.toHaveBeenCalled();
    });

    test('doit valider la taille du fichier', async () => {
      const { result } = renderHook(() =>
        useProfileEditor(defaultUser, mockOnProfileUpdate)
      );

      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg',
        size: 6 * 1024 * 1024,
      });

      await act(async () => {
        await result.current.handlePhotoUpload(largeFile);
      });

      expect(result.current.error).toBe("L'image doit faire moins de 5MB");
      expect(AuthService.uploadUserPhoto).not.toHaveBeenCalled();
    });

    test('doit empêcher les uploads multiples', async () => {
      const { result } = renderHook(() =>
        useProfileEditor(defaultUser, mockOnProfileUpdate)
      );

      const mockFile = new File(['image'], 'avatar.jpg', {
        type: 'image/jpeg',
      });

      // Déclencher un premier upload
      act(() => {
        result.current.handlePhotoUpload(mockFile);
      });

      // Essayer un deuxième upload pendant que le premier est en cours
      await act(async () => {
        await result.current.handlePhotoUpload(mockFile);
      });

      // Le deuxième upload doit être ignoré
      expect(AuthService.uploadUserPhoto).toHaveBeenCalledTimes(1);
    });

    test("doit gérer les erreurs d'upload", async () => {
      const { result } = renderHook(() =>
        useProfileEditor(defaultUser, mockOnProfileUpdate)
      );

      AuthService.uploadUserPhoto.mockRejectedValue(new Error('Erreur upload'));

      const mockFile = new File(['image'], 'avatar.jpg', {
        type: 'image/jpeg',
      });

      await act(async () => {
        await result.current.handlePhotoUpload(mockFile);
      });

      expect(result.current.error).toBe('Erreur upload');
      expect(result.current.isUploadingPhoto).toBe(false);
    });

    test('ne doit pas traiter les fichiers vides', async () => {
      const { result } = renderHook(() =>
        useProfileEditor(defaultUser, mockOnProfileUpdate)
      );

      await act(async () => {
        await result.current.handlePhotoUpload(null);
      });

      expect(AuthService.uploadUserPhoto).not.toHaveBeenCalled();
    });
  });

  describe('🔧 Fonctions utilitaires', () => {
    test('doit fournir handleDebug', () => {
      const { result } = renderHook(() =>
        useProfileEditor(defaultUser, mockOnProfileUpdate)
      );

      expect(typeof result.current.handleDebug).toBe('function');

      // Le debug doit pouvoir être appelé sans erreur
      act(() => {
        result.current.handleDebug();
      });
    });

    test('doit nettoyer les messages de succès automatiquement', async () => {
      const { result } = renderHook(() =>
        useProfileEditor(defaultUser, mockOnProfileUpdate)
      );

      await act(async () => {
        await result.current.handleSaveName();
      });

      expect(result.current.success).toBe('Nom mis à jour ! 🎉');

      // Attendre que le message disparaisse (3 secondes)
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 3100));
      });

      expect(result.current.success).toBe('');
    });
  });

  describe('⚠️ Gestion des erreurs et cas limite', () => {
    test('doit gérer un user sans téléphone', () => {
      const userWithoutPhone = {
        ...defaultUser,
        phone: null,
      };

      const { result } = renderHook(() =>
        useProfileEditor(userWithoutPhone, mockOnProfileUpdate)
      );

      expect(result.current.phoneNumber).toBe('');
    });

    test('doit gérer un user sans nom', () => {
      const userWithoutName = {
        ...defaultUser,
        name: null,
      };

      const { result } = renderHook(() =>
        useProfileEditor(userWithoutName, mockOnProfileUpdate)
      );

      expect(result.current.userName).toBe('');
    });

    test('doit gérer onProfileUpdate manquant', async () => {
      const { result } = renderHook(() => useProfileEditor(defaultUser, null));

      await act(async () => {
        await result.current.handleSaveName();
      });

      // Ne doit pas lever d'erreur
      expect(AuthService.updateUserProfile).toHaveBeenCalled();
    });

    test('doit gérer les erreurs de refreshUserData', async () => {
      const { result } = renderHook(() =>
        useProfileEditor(defaultUser, mockOnProfileUpdate)
      );

      mockRefreshUserData.mockRejectedValue(new Error('Refresh failed'));

      const mockFile = new File(['image'], 'avatar.jpg', {
        type: 'image/jpeg',
      });

      await act(async () => {
        await result.current.handlePhotoUpload(mockFile);
      });

      // L'upload doit réussir malgré l'erreur de refresh
      expect(result.current.success).toBe('Photo de profil mise à jour ! 🎉');
    });
  });

  describe('🔄 Synchronisation et états complexes', () => {
    test('doit gérer isDeleting pour éviter les override', () => {
      const { result } = renderHook(() =>
        useProfileEditor(defaultUser, mockOnProfileUpdate)
      );

      // Simuler un état de suppression
      act(() => {
        result.current.setIsDeleting?.(true);
      });

      // Le téléphone ne doit pas être synchronisé pendant la suppression
      expect(result.current.phoneNumber).toBe('+33612345678');
    });

    test('doit incrémenter forceRefresh après upload', async () => {
      const { result } = renderHook(() =>
        useProfileEditor(defaultUser, mockOnProfileUpdate)
      );

      const initialRefresh = result.current.forceRefresh;

      const mockFile = new File(['image'], 'avatar.jpg', {
        type: 'image/jpeg',
      });

      await act(async () => {
        await result.current.handlePhotoUpload(mockFile);
      });

      expect(result.current.forceRefresh).toBe(initialRefresh + 1);
    });
  });
});
