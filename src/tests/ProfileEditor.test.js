// @ts-nocheck
// Tests ProfileEditor.js - PHASE 3 - Composants Profil (Priorité MOYENNE)

import { fireEvent, render, screen } from '@testing-library/react';
import ProfileEditor from '../components/profile/ProfileEditor';

// === MOCKS COMPLETS ===

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, initial, animate, ...props }) => {
      const React = require('react');
      return React.createElement('div', { className, ...props }, children);
    },
  },
}));

// Mock des composants enfants
jest.mock('../components/profile/AvatarUploader', () => {
  return function MockAvatarUploader({
    user,
    localAvatar,
    forceRefresh,
    isUploadingPhoto,
    onPhotoUpload,
    darkMode,
  }) {
    return (
      <div data-testid="avatar-uploader">
        <div data-testid="current-avatar">{localAvatar || user?.avatar}</div>
        <button
          onClick={() =>
            onPhotoUpload && onPhotoUpload(new File([''], 'test.jpg'))
          }
          disabled={isUploadingPhoto}
          data-testid="upload-button"
        >
          {isUploadingPhoto ? 'Uploading...' : 'Upload Avatar'}
        </button>
      </div>
    );
  };
});

jest.mock('../components/profile/ProfileForm', () => {
  return function MockProfileForm({
    user,
    isEditing,
    setIsEditing,
    isEditingName,
    setIsEditingName,
    phoneNumber,
    setPhoneNumber,
    userName,
    setUserName,
    onSavePhone,
    onRemovePhone,
    onCancel,
    onSaveName,
    onCancelName,
    showOnlyNameSection,
  }) {
    if (showOnlyNameSection) {
      return (
        <div data-testid="profile-form-name">
          <div data-testid="user-name">{userName || user?.name}</div>
          <div data-testid="user-email">{user?.email}</div>
          <button
            onClick={() => setIsEditingName && setIsEditingName(true)}
            data-testid="edit-name-button"
          >
            Edit Name
          </button>
        </div>
      );
    }
    return <div data-testid="profile-form">Profile Form</div>;
  };
});

// Mock du hook useProfileEditor
const mockHookReturn = {
  // États
  isEditing: false,
  setIsEditing: jest.fn(),
  isEditingName: false,
  setIsEditingName: jest.fn(),
  phoneNumber: '+33612345678',
  setPhoneNumber: jest.fn(),
  userName: 'Test User',
  setUserName: jest.fn(),
  isLoading: false,
  isUploadingPhoto: false,
  error: '',
  setError: jest.fn(),
  success: '',
  localAvatar: null,
  forceRefresh: 0,

  // Actions
  handleSavePhone: jest.fn(),
  handleRemovePhone: jest.fn(),
  handleCancel: jest.fn(),
  handleSaveName: jest.fn(),
  handleCancelName: jest.fn(),
  handlePhotoUpload: jest.fn(),
  handleDebug: jest.fn(),
};

jest.mock('../components/profile/useProfileEditor', () => ({
  default: jest.fn(() => mockHookReturn),
}));

describe('ProfileEditor - PHASE 3 - Composants Profil', () => {
  // Props par défaut pour les tests
  const defaultProps = {
    user: {
      uid: 'user1',
      name: 'Test User',
      email: 'test@example.com',
      phone: '+33612345678',
      avatar: '👤',
    },
    onProfileUpdate: jest.fn(),
    darkMode: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();

    // Réinitialiser le mock du hook
    Object.keys(mockHookReturn).forEach(key => {
      if (typeof mockHookReturn[key] === 'function') {
        mockHookReturn[key].mockClear();
      }
    });
  });

  describe('🏗️ Structure et affichage de base', () => {
    test('doit afficher le titre et la structure de base', () => {
      render(<ProfileEditor {...defaultProps} />);

      expect(screen.getByText('Mon Profil')).toBeInTheDocument();
      expect(screen.getByTestId('avatar-uploader')).toBeInTheDocument();
      expect(screen.getByTestId('profile-form-name')).toBeInTheDocument();
    });

    test('doit passer les bonnes props au composant AvatarUploader', () => {
      render(<ProfileEditor {...defaultProps} />);

      const avatarUploader = screen.getByTestId('avatar-uploader');
      expect(avatarUploader).toBeInTheDocument();
      expect(screen.getByTestId('current-avatar')).toHaveTextContent('👤');
    });

    test('doit passer les bonnes props au composant ProfileForm', () => {
      render(<ProfileEditor {...defaultProps} />);

      expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
      expect(screen.getByTestId('user-email')).toHaveTextContent(
        'test@example.com'
      );
    });

    test('doit afficher showOnlyNameSection=true pour ProfileForm', () => {
      render(<ProfileEditor {...defaultProps} />);

      // Vérifier que ProfileForm reçoit showOnlyNameSection=true
      expect(screen.getByTestId('profile-form-name')).toBeInTheDocument();
      expect(screen.queryByTestId('profile-form')).not.toBeInTheDocument();
    });
  });

  describe('🎨 Mode sombre', () => {
    test("doit s'adapter au mode sombre", () => {
      const darkProps = { ...defaultProps, darkMode: true };
      render(<ProfileEditor {...darkProps} />);

      const container = screen.getByText('Mon Profil').closest('div');
      expect(container).toHaveClass('bg-gray-800');

      const title = screen.getByText('Mon Profil');
      expect(title).toHaveClass('text-white');
    });

    test('doit utiliser les classes claires en mode normal', () => {
      render(<ProfileEditor {...defaultProps} />);

      const container = screen.getByText('Mon Profil').closest('div');
      expect(container).toHaveClass('bg-white');

      const title = screen.getByText('Mon Profil');
      expect(title).toHaveClass('text-gray-900');
    });
  });

  describe('🔄 Intégration avec useProfileEditor', () => {
    test('doit appeler useProfileEditor avec les bonnes props', () => {
      const {
        default: useProfileEditor,
      } = require('../components/profile/useProfileEditor');

      render(<ProfileEditor {...defaultProps} />);

      expect(useProfileEditor).toHaveBeenCalledWith(
        defaultProps.user,
        defaultProps.onProfileUpdate
      );
    });

    test('doit transmettre les callbacks du hook aux composants enfants', () => {
      render(<ProfileEditor {...defaultProps} />);

      // Vérifier que les callbacks sont transmis
      const editButton = screen.getByTestId('edit-name-button');
      fireEvent.click(editButton);

      expect(mockHookReturn.setIsEditingName).toHaveBeenCalledWith(true);
    });

    test('doit transmettre handlePhotoUpload à AvatarUploader', () => {
      render(<ProfileEditor {...defaultProps} />);

      const uploadButton = screen.getByTestId('upload-button');
      fireEvent.click(uploadButton);

      expect(mockHookReturn.handlePhotoUpload).toHaveBeenCalled();
    });
  });

  describe("📱 Affichage d'édition du nom", () => {
    test("doit afficher la section d'édition quand isEditingName=true", () => {
      // Mock pour simuler le mode édition
      const editingMockReturn = {
        ...mockHookReturn,
        isEditingName: true,
      };

      const {
        default: useProfileEditor,
      } = require('../components/profile/useProfileEditor');
      useProfileEditor.mockReturnValue(editingMockReturn);

      render(<ProfileEditor {...defaultProps} />);

      // L'état d'édition devrait être visible quelque part dans l'interface
      expect(screen.getByTestId('profile-form-name')).toBeInTheDocument();
    });

    test("doit masquer le bouton édition pendant l'édition", () => {
      const editingMockReturn = {
        ...mockHookReturn,
        isEditingName: true,
      };

      const {
        default: useProfileEditor,
      } = require('../components/profile/useProfileEditor');
      useProfileEditor.mockReturnValue(editingMockReturn);

      // Mock ProfileForm pour le mode édition
      const MockProfileForm = require('../components/profile/ProfileForm');
      MockProfileForm.mockImplementation(
        ({ isEditingName, showOnlyNameSection }) => {
          if (showOnlyNameSection && !isEditingName) {
            return (
              <div data-testid="profile-form-name">
                <button data-testid="edit-name-button">Edit Name</button>
              </div>
            );
          }
          return <div data-testid="profile-form-editing">Editing mode</div>;
        }
      );

      render(<ProfileEditor {...defaultProps} />);

      expect(screen.queryByTestId('edit-name-button')).not.toBeInTheDocument();
    });
  });

  describe("⚠️ Messages d'erreur et de succès", () => {
    test("doit afficher un message d'erreur", () => {
      const errorMockReturn = {
        ...mockHookReturn,
        error: 'Erreur de validation',
      };

      const {
        default: useProfileEditor,
      } = require('../components/profile/useProfileEditor');
      useProfileEditor.mockReturnValue(errorMockReturn);

      render(<ProfileEditor {...defaultProps} />);

      expect(screen.getByText('Erreur de validation')).toBeInTheDocument();
    });

    test('doit afficher un message de succès', () => {
      const successMockReturn = {
        ...mockHookReturn,
        success: 'Profil mis à jour !',
      };

      const {
        default: useProfileEditor,
      } = require('../components/profile/useProfileEditor');
      useProfileEditor.mockReturnValue(successMockReturn);

      render(<ProfileEditor {...defaultProps} />);

      expect(screen.getByText('Profil mis à jour !')).toBeInTheDocument();
    });

    test("doit appliquer les bonnes classes pour les messages d'erreur", () => {
      const errorMockReturn = {
        ...mockHookReturn,
        error: 'Erreur test',
      };

      const {
        default: useProfileEditor,
      } = require('../components/profile/useProfileEditor');
      useProfileEditor.mockReturnValue(errorMockReturn);

      render(<ProfileEditor {...defaultProps} />);

      const errorMessage = screen.getByText('Erreur test');
      expect(errorMessage).toHaveClass('text-red-700');
    });

    test('doit appliquer les bonnes classes pour les messages de succès', () => {
      const successMockReturn = {
        ...mockHookReturn,
        success: 'Succès test',
      };

      const {
        default: useProfileEditor,
      } = require('../components/profile/useProfileEditor');
      useProfileEditor.mockReturnValue(successMockReturn);

      render(<ProfileEditor {...defaultProps} />);

      const successMessage = screen.getByText('Succès test');
      expect(successMessage).toHaveClass('text-green-700');
    });
  });

  describe('🔄 État de chargement', () => {
    test('doit transmettre isUploadingPhoto à AvatarUploader', () => {
      const loadingMockReturn = {
        ...mockHookReturn,
        isUploadingPhoto: true,
      };

      const {
        default: useProfileEditor,
      } = require('../components/profile/useProfileEditor');
      useProfileEditor.mockReturnValue(loadingMockReturn);

      render(<ProfileEditor {...defaultProps} />);

      const uploadButton = screen.getByTestId('upload-button');
      expect(uploadButton).toHaveTextContent('Uploading...');
      expect(uploadButton).toBeDisabled();
    });

    test('doit transmettre localAvatar à AvatarUploader', () => {
      const avatarMockReturn = {
        ...mockHookReturn,
        localAvatar: 'https://example.com/local-avatar.jpg',
      };

      const {
        default: useProfileEditor,
      } = require('../components/profile/useProfileEditor');
      useProfileEditor.mockReturnValue(avatarMockReturn);

      render(<ProfileEditor {...defaultProps} />);

      expect(screen.getByTestId('current-avatar')).toHaveTextContent(
        'https://example.com/local-avatar.jpg'
      );
    });
  });

  describe('🔧 Cas limite et robustesse', () => {
    test('doit gérer un user sans avatar', () => {
      const propsNoAvatar = {
        ...defaultProps,
        user: {
          ...defaultProps.user,
          avatar: null,
        },
      };

      render(<ProfileEditor {...propsNoAvatar} />);

      expect(screen.getByTestId('avatar-uploader')).toBeInTheDocument();
    });

    test('doit gérer un user sans nom', () => {
      const propsNoName = {
        ...defaultProps,
        user: {
          ...defaultProps.user,
          name: null,
        },
      };

      const noNameMockReturn = {
        ...mockHookReturn,
        userName: '',
      };

      const {
        default: useProfileEditor,
      } = require('../components/profile/useProfileEditor');
      useProfileEditor.mockReturnValue(noNameMockReturn);

      render(<ProfileEditor {...propsNoName} />);

      expect(screen.getByTestId('user-name')).toHaveTextContent('');
    });

    test('doit gérer onProfileUpdate manquant', () => {
      const propsNoCallback = {
        ...defaultProps,
        onProfileUpdate: undefined,
      };

      expect(() => {
        render(<ProfileEditor {...propsNoCallback} />);
      }).not.toThrow();
    });

    test('doit avoir des valeurs par défaut pour darkMode', () => {
      const propsNoDarkMode = {
        user: defaultProps.user,
        onProfileUpdate: defaultProps.onProfileUpdate,
        // darkMode absent
      };

      render(<ProfileEditor {...propsNoDarkMode} />);

      const container = screen.getByText('Mon Profil').closest('div');
      expect(container).toHaveClass('bg-white'); // Mode clair par défaut
    });
  });

  describe('📐 Layout et responsivité', () => {
    test('doit avoir les classes de layout appropriées', () => {
      render(<ProfileEditor {...defaultProps} />);

      const container = screen.getByText('Mon Profil').closest('div');
      expect(container).toHaveClass(
        'p-6',
        'rounded-xl',
        'shadow-lg',
        'w-full',
        'max-w-md',
        'mx-auto'
      );
    });

    test('doit organiser AvatarUploader et ProfileForm horizontalement', () => {
      render(<ProfileEditor {...defaultProps} />);

      // Vérifier la structure flex
      const avatarContainer = screen
        .getByTestId('avatar-uploader')
        .closest('.flex');
      expect(avatarContainer).toHaveClass('items-center', 'mb-4');
    });
  });

  describe('♿ Accessibilité', () => {
    test('doit avoir un titre accessible', () => {
      render(<ProfileEditor {...defaultProps} />);

      const title = screen.getByText('Mon Profil');
      expect(title).toHaveClass('text-lg', 'font-semibold');
    });

    test("doit transmettre les props d'accessibilité aux composants enfants", () => {
      render(<ProfileEditor {...defaultProps} />);

      // Les composants enfants doivent recevoir les bonnes props
      expect(screen.getByTestId('avatar-uploader')).toBeInTheDocument();
      expect(screen.getByTestId('profile-form-name')).toBeInTheDocument();
    });
  });
});
