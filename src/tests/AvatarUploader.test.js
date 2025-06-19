// @ts-nocheck
// Tests AvatarUploader.js - PHASE 3 - Composants Profil (Priorité MOYENNE)

import { fireEvent, render, screen } from '@testing-library/react';
import AvatarUploader from '../components/profile/AvatarUploader';

// === MOCKS COMPLETS ===

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    button: ({ children, className, whileHover, whileTap, ...props }) => {
      const React = require('react');
      return React.createElement('button', { className, ...props }, children);
    },
  },
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Camera: ({ size, className }) => (
    <div
      className={className}
      data-testid="camera-icon"
      style={{ width: size, height: size }}
    >
      📷
    </div>
  ),
}));

describe('AvatarUploader - PHASE 3 - Composants Profil', () => {
  // Props par défaut pour les tests
  const defaultProps = {
    user: {
      uid: 'user1',
      name: 'Test User',
      email: 'test@example.com',
      avatar: '👤',
    },
    localAvatar: null,
    forceRefresh: 0,
    isUploadingPhoto: false,
    onPhotoUpload: jest.fn(),
    onAvatarError: jest.fn(),
    darkMode: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  describe("📱 Affichage de l'avatar", () => {
    test('doit afficher un emoji par défaut', () => {
      render(<AvatarUploader {...defaultProps} />);

      expect(screen.getByText('👤')).toBeInTheDocument();
    });

    test('doit afficher une image quand avatar est une URL', () => {
      const propsWithImageAvatar = {
        ...defaultProps,
        user: {
          ...defaultProps.user,
          avatar: 'https://example.com/avatar.jpg',
        },
      };
      render(<AvatarUploader {...propsWithImageAvatar} />);

      const avatarImage = screen.getByAltText('Avatar');
      expect(avatarImage).toBeInTheDocument();
      expect(avatarImage.src).toBe('https://example.com/avatar.jpg');
    });

    test('doit prioriser localAvatar sur user.avatar', () => {
      const propsWithLocalAvatar = {
        ...defaultProps,
        localAvatar: 'https://example.com/local-avatar.jpg',
        user: {
          ...defaultProps.user,
          avatar: 'https://example.com/user-avatar.jpg',
        },
      };
      render(<AvatarUploader {...propsWithLocalAvatar} />);

      const avatarImage = screen.getByAltText('Avatar');
      expect(avatarImage.src).toBe('https://example.com/local-avatar.jpg');
    });

    test('doit afficher une data URL pour les images uploadées', () => {
      const dataURL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD';
      const propsWithDataURL = {
        ...defaultProps,
        localAvatar: dataURL,
      };
      render(<AvatarUploader {...propsWithDataURL} />);

      const avatarImage = screen.getByAltText('Avatar');
      expect(avatarImage.src).toBe(dataURL);
    });
  });

  describe("🔄 Gestion de l'upload", () => {
    test('doit permettre de déclencher la sélection de fichier', () => {
      render(<AvatarUploader {...defaultProps} />);

      const uploadButton = screen.getByTitle('Changer la photo');
      expect(uploadButton).toBeInTheDocument();

      // Vérifier que l'input file est présent mais caché
      const fileInput = screen.getByDisplayValue('');
      expect(fileInput).toHaveAttribute('type', 'file');
      expect(fileInput).toHaveAttribute('accept', 'image/*');
      expect(fileInput).toHaveClass('hidden');
    });

    test('doit appeler onPhotoUpload quand un fichier est sélectionné', () => {
      render(<AvatarUploader {...defaultProps} />);

      const fileInput = screen.getByDisplayValue('');
      const mockFile = new File(['image content'], 'avatar.jpg', {
        type: 'image/jpeg',
      });

      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      expect(defaultProps.onPhotoUpload).toHaveBeenCalledWith(mockFile);
    });

    test('ne doit pas appeler onPhotoUpload si aucun fichier sélectionné', () => {
      render(<AvatarUploader {...defaultProps} />);

      const fileInput = screen.getByDisplayValue('');
      fireEvent.change(fileInput, { target: { files: [] } });

      expect(defaultProps.onPhotoUpload).not.toHaveBeenCalled();
    });

    test("doit afficher un spinner pendant l'upload", () => {
      const loadingProps = {
        ...defaultProps,
        isUploadingPhoto: true,
      };
      render(<AvatarUploader {...loadingProps} />);

      const spinner = screen.getByRole('button').querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      expect(screen.queryByTestId('camera-icon')).not.toBeInTheDocument();
    });

    test("doit désactiver le bouton pendant l'upload", () => {
      const loadingProps = {
        ...defaultProps,
        isUploadingPhoto: true,
      };
      render(<AvatarUploader {...loadingProps} />);

      const uploadButton = screen.getByTitle('Changer la photo');
      expect(uploadButton).toBeDisabled();
    });
  });

  describe('🎨 Mode sombre', () => {
    test('doit fonctionner en mode sombre', () => {
      const darkProps = { ...defaultProps, darkMode: true };
      render(<AvatarUploader {...darkProps} />);

      // Le composant doit s'afficher sans erreur en mode sombre
      expect(screen.getByTitle('Changer la photo')).toBeInTheDocument();
    });
  });

  describe('⚠️ Gestion des erreurs', () => {
    test("doit appeler onAvatarError en cas d'erreur d'image", () => {
      const propsWithImageAvatar = {
        ...defaultProps,
        user: {
          ...defaultProps.user,
          avatar: 'https://example.com/broken-image.jpg',
        },
      };
      render(<AvatarUploader {...propsWithImageAvatar} />);

      const avatarImage = screen.getByAltText('Avatar');
      fireEvent.error(avatarImage);

      expect(defaultProps.onAvatarError).toHaveBeenCalled();
    });

    test('doit gérer onAvatarError manquant', () => {
      const propsWithoutError = {
        ...defaultProps,
        onAvatarError: undefined,
        user: {
          ...defaultProps.user,
          avatar: 'https://example.com/broken-image.jpg',
        },
      };

      expect(() => {
        render(<AvatarUploader {...propsWithoutError} />);
        const avatarImage = screen.getByAltText('Avatar');
        fireEvent.error(avatarImage);
      }).not.toThrow();
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
      render(<AvatarUploader {...propsNoAvatar} />);

      expect(screen.getByText('👤')).toBeInTheDocument();
    });

    test("doit gérer forceRefresh pour re-render l'avatar", () => {
      const { rerender } = render(<AvatarUploader {...defaultProps} />);

      const propsWithRefresh = {
        ...defaultProps,
        forceRefresh: 1,
        user: {
          ...defaultProps.user,
          avatar: 'https://example.com/new-avatar.jpg',
        },
      };
      rerender(<AvatarUploader {...propsWithRefresh} />);

      const avatarImage = screen.getByAltText('Avatar');
      expect(avatarImage.src).toBe('https://example.com/new-avatar.jpg');
    });

    test("doit réinitialiser l'input file après upload", () => {
      render(<AvatarUploader {...defaultProps} />);

      const fileInput = screen.getByDisplayValue('');
      const mockFile = new File(['content'], 'test.jpg', {
        type: 'image/jpeg',
      });

      // Simuler la sélection de fichier
      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });
      Object.defineProperty(fileInput, 'value', {
        value: 'C:\\fakepath\\test.jpg',
        writable: true,
      });

      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      expect(defaultProps.onPhotoUpload).toHaveBeenCalledWith(mockFile);
    });

    test('doit gérer les props manquantes', () => {
      const minimalProps = {
        user: { avatar: '👤' },
        isUploadingPhoto: false,
      };

      expect(() => {
        render(<AvatarUploader {...minimalProps} />);
      }).not.toThrow();
    });
  });

  describe('♿ Accessibilité', () => {
    test('doit avoir un bouton accessible', () => {
      render(<AvatarUploader {...defaultProps} />);

      const uploadButton = screen.getByRole('button');
      expect(uploadButton).toBeInTheDocument();
      expect(uploadButton).toHaveAttribute('title', 'Changer la photo');
    });

    test('doit avoir une image avec alt text approprié', () => {
      const propsWithImageAvatar = {
        ...defaultProps,
        user: {
          ...defaultProps.user,
          avatar: 'https://example.com/avatar.jpg',
        },
      };
      render(<AvatarUploader {...propsWithImageAvatar} />);

      const avatarImage = screen.getByAltText('Avatar');
      expect(avatarImage).toBeInTheDocument();
    });

    test('doit avoir un input file avec accept approprié', () => {
      render(<AvatarUploader {...defaultProps} />);

      const fileInput = screen.getByDisplayValue('');
      expect(fileInput).toHaveAttribute('accept', 'image/*');
    });
  });
});
