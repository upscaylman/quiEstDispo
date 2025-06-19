// @ts-nocheck
// Tests ProfileForm.js - PHASE 3 - Composants Profil (Priorité MOYENNE)

import { fireEvent, render, screen } from '@testing-library/react';
import ProfileForm from '../components/profile/ProfileForm';

// === MOCKS COMPLETS ===

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    button: ({ children, className, whileHover, whileTap, ...props }) => {
      const React = require('react');
      return React.createElement('button', { className, ...props }, children);
    },
    div: ({ children, className, initial, animate, ...props }) => {
      const React = require('react');
      return React.createElement('div', { className, ...props }, children);
    },
  },
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Check: ({ size, className }) => (
    <div
      className={className}
      data-testid="check-icon"
      style={{ width: size, height: size }}
    >
      ✓
    </div>
  ),
  Edit2: ({ size, className }) => (
    <div
      className={className}
      data-testid="edit-icon"
      style={{ width: size, height: size }}
    >
      ✏️
    </div>
  ),
  Phone: ({ size, className }) => (
    <div
      className={className}
      data-testid="phone-icon"
      style={{ width: size, height: size }}
    >
      📞
    </div>
  ),
  Save: ({ size, className }) => (
    <div
      className={className}
      data-testid="save-icon"
      style={{ width: size, height: size }}
    >
      💾
    </div>
  ),
  X: ({ size, className }) => (
    <div
      className={className}
      data-testid="x-icon"
      style={{ width: size, height: size }}
    >
      ❌
    </div>
  ),
}));

// Mock AuthService
jest.mock('../services/firebaseService', () => ({
  AuthService: {
    validateAndFormatPhoneNumber: jest.fn(phone => phone),
  },
}));

describe('ProfileForm - PHASE 3 - Composants Profil', () => {
  // Props par défaut pour les tests
  const defaultProps = {
    user: {
      uid: 'user1',
      name: 'Test User',
      email: 'test@example.com',
      phone: '+33612345678',
    },
    isEditing: false,
    setIsEditing: jest.fn(),
    isEditingName: false,
    setIsEditingName: jest.fn(),
    phoneNumber: '+33612345678',
    setPhoneNumber: jest.fn(),
    userName: 'Test User',
    setUserName: jest.fn(),
    isLoading: false,
    onSavePhone: jest.fn(),
    onRemovePhone: jest.fn(),
    onCancel: jest.fn(),
    onSaveName: jest.fn(),
    onCancelName: jest.fn(),
    onDebug: jest.fn(),
    darkMode: false,
    showOnlyNameSection: false,
    showOnlyNameEdit: false,
    showOnlyPhoneSection: false,
    error: '',
    success: '',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  describe('📱 Mode showOnlyNameSection', () => {
    test('doit afficher seulement la section nom avec bouton édition', () => {
      const nameProps = {
        ...defaultProps,
        showOnlyNameSection: true,
      };
      render(<ProfileForm {...nameProps} />);

      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByTestId('edit-icon')).toBeInTheDocument();
      expect(screen.getByTitle('Modifier le nom')).toBeInTheDocument();
    });

    test('doit masquer le bouton édition quand isEditingName=true', () => {
      const editingProps = {
        ...defaultProps,
        showOnlyNameSection: true,
        isEditingName: true,
      };
      render(<ProfileForm {...editingProps} />);

      expect(screen.queryByTitle('Modifier le nom')).not.toBeInTheDocument();
    });

    test("doit permettre de démarrer l'édition du nom", () => {
      const nameProps = {
        ...defaultProps,
        showOnlyNameSection: true,
      };
      render(<ProfileForm {...nameProps} />);

      const editButton = screen.getByTitle('Modifier le nom');
      fireEvent.click(editButton);

      expect(defaultProps.setIsEditingName).toHaveBeenCalledWith(true);
    });
  });

  describe('✏️ Mode showOnlyNameEdit', () => {
    test("doit afficher le formulaire d'édition du nom", () => {
      const editProps = {
        ...defaultProps,
        showOnlyNameEdit: true,
      };
      render(<ProfileForm {...editProps} />);

      expect(screen.getByPlaceholderText('Votre nom')).toBeInTheDocument();
      expect(screen.getByText('Enregistrer')).toBeInTheDocument();
      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
    });

    test('doit permettre de modifier le nom', () => {
      const editProps = {
        ...defaultProps,
        showOnlyNameEdit: true,
      };
      render(<ProfileForm {...editProps} />);

      const nameInput = screen.getByPlaceholderText('Votre nom');
      fireEvent.change(nameInput, { target: { value: 'Nouveau Nom' } });

      expect(defaultProps.setUserName).toHaveBeenCalledWith('Nouveau Nom');
    });

    test("doit permettre d'enregistrer le nom", () => {
      const editProps = {
        ...defaultProps,
        showOnlyNameEdit: true,
      };
      render(<ProfileForm {...editProps} />);

      const saveButton = screen.getByText('Enregistrer');
      fireEvent.click(saveButton);

      expect(defaultProps.onSaveName).toHaveBeenCalled();
    });

    test("doit permettre d'annuler l'édition", () => {
      const editProps = {
        ...defaultProps,
        showOnlyNameEdit: true,
      };
      render(<ProfileForm {...editProps} />);

      const cancelButton = screen.getByTestId('x-icon').closest('button');
      fireEvent.click(cancelButton);

      expect(defaultProps.onCancelName).toHaveBeenCalled();
    });

    test('doit afficher un spinner pendant le chargement', () => {
      const loadingProps = {
        ...defaultProps,
        showOnlyNameEdit: true,
        isLoading: true,
      };
      render(<ProfileForm {...loadingProps} />);

      const spinnerElements = document.querySelectorAll('.animate-spin');
      expect(spinnerElements.length).toBeGreaterThan(0);
    });

    test.skip('doit afficher les boutons pendant le chargement', () => {
      const loadingProps = {
        ...defaultProps,
        showOnlyNameEdit: true,
        isLoading: true,
      };
      render(<ProfileForm {...loadingProps} />);

      // Vérifier que le bouton Enregistrer existe pendant le chargement
      expect(screen.getByText('Enregistrer')).toBeInTheDocument();

      // Le spinner devrait être visible pendant le chargement
      const spinnerElements = document.querySelectorAll('.animate-spin');
      expect(spinnerElements.length).toBeGreaterThan(0);

      // Vérifier que le mode showOnlyNameEdit est bien actif
      expect(screen.getByPlaceholderText('Votre nom')).toBeInTheDocument();
    });
  });

  describe('📞 Mode showOnlyPhoneSection', () => {
    test('doit afficher la section téléphone', () => {
      const phoneProps = {
        ...defaultProps,
        showOnlyPhoneSection: true,
      };
      render(<ProfileForm {...phoneProps} />);

      expect(screen.getByText('Numéro de téléphone')).toBeInTheDocument();
      expect(screen.getByTestId('phone-icon')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Nécessaire pour que vos amis puissent vous trouver et vous ajouter.'
        )
      ).toBeInTheDocument();
    });

    test('doit afficher les boutons éditer/supprimer quand pas en édition', () => {
      const phoneProps = {
        ...defaultProps,
        showOnlyPhoneSection: true,
      };
      render(<ProfileForm {...phoneProps} />);

      expect(screen.getByTitle('Modifier le numéro')).toBeInTheDocument();
      expect(screen.getByTitle('Supprimer le numéro')).toBeInTheDocument();
    });

    test('doit masquer les boutons quand en édition', () => {
      const editingProps = {
        ...defaultProps,
        showOnlyPhoneSection: true,
        isEditing: true,
      };
      render(<ProfileForm {...editingProps} />);

      expect(screen.queryByTitle('Modifier le numéro')).not.toBeInTheDocument();
      expect(
        screen.queryByTitle('Supprimer le numéro')
      ).not.toBeInTheDocument();
    });

    test("doit permettre de démarrer l'édition du téléphone", () => {
      const phoneProps = {
        ...defaultProps,
        showOnlyPhoneSection: true,
      };
      render(<ProfileForm {...phoneProps} />);

      const editButton = screen.getByTitle('Modifier le numéro');
      fireEvent.click(editButton);

      expect(defaultProps.setIsEditing).toHaveBeenCalledWith(true);
    });

    test('doit permettre de supprimer le téléphone', () => {
      const phoneProps = {
        ...defaultProps,
        showOnlyPhoneSection: true,
      };
      render(<ProfileForm {...phoneProps} />);

      const removeButton = screen.getByTitle('Supprimer le numéro');
      fireEvent.click(removeButton);

      expect(defaultProps.onRemovePhone).toHaveBeenCalled();
    });

    test('doit afficher "Ajouter un numéro" si pas de téléphone', () => {
      const noPhoneProps = {
        ...defaultProps,
        showOnlyPhoneSection: true,
        phoneNumber: '',
        user: { ...defaultProps.user, phone: null },
      };
      render(<ProfileForm {...noPhoneProps} />);

      expect(screen.getByTitle('Ajouter un numéro')).toBeInTheDocument();
      expect(
        screen.queryByTitle('Supprimer le numéro')
      ).not.toBeInTheDocument();
    });
  });

  describe('🎨 Mode sombre', () => {
    test("doit s'adapter au mode sombre", () => {
      const darkProps = {
        ...defaultProps,
        showOnlyNameSection: true,
        darkMode: true,
      };
      render(<ProfileForm {...darkProps} />);

      // Vérifier que les classes pour le mode sombre sont appliquées
      const userName = screen.getByText('Test User');
      expect(userName).toHaveClass('text-white');
    });

    test("doit adapter les champs d'entrée au mode sombre", () => {
      const darkEditProps = {
        ...defaultProps,
        showOnlyNameEdit: true,
        darkMode: true,
      };
      render(<ProfileForm {...darkEditProps} />);

      const nameInput = screen.getByPlaceholderText('Votre nom');
      expect(nameInput).toHaveClass('bg-gray-700');
    });
  });

  describe("⚠️ Messages d'erreur et de succès", () => {
    test("doit afficher un message d'erreur", () => {
      const errorProps = {
        ...defaultProps,
        showOnlyNameEdit: true,
        error: 'Erreur de validation',
      };
      render(<ProfileForm {...errorProps} />);

      expect(screen.getByText('Erreur de validation')).toBeInTheDocument();
    });

    test('doit afficher un message de succès', () => {
      const successProps = {
        ...defaultProps,
        showOnlyNameEdit: true,
        success: 'Modification réussie !',
      };
      render(<ProfileForm {...successProps} />);

      expect(screen.getByText('Modification réussie !')).toBeInTheDocument();
    });
  });

  describe('🔧 Cas limite et robustesse', () => {
    test('doit gérer un user sans nom', () => {
      const noNameProps = {
        ...defaultProps,
        showOnlyNameSection: true,
        userName: '',
        user: { ...defaultProps.user, name: null },
      };
      render(<ProfileForm {...noNameProps} />);

      expect(screen.getByText('Utilisateur')).toBeInTheDocument();
    });

    test('doit gérer les callbacks manquants', () => {
      const minimalProps = {
        ...defaultProps,
        showOnlyNameEdit: true,
        onSaveName: undefined,
        onCancelName: undefined,
      };

      expect(() => {
        render(<ProfileForm {...minimalProps} />);
      }).not.toThrow();
    });

    test('doit tronquer les emails longs', () => {
      const longEmailProps = {
        ...defaultProps,
        showOnlyNameSection: true,
        user: {
          ...defaultProps.user,
          email: 'very.long.email.address@very-long-domain.example.com',
        },
      };
      render(<ProfileForm {...longEmailProps} />);

      const emailElement = screen.getByText(
        'very.long.email.address@very-long-domain.example.com'
      );
      expect(emailElement).toHaveClass('truncate');
    });
  });

  describe('♿ Accessibilité', () => {
    test('doit avoir des boutons accessibles', () => {
      const phoneProps = {
        ...defaultProps,
        showOnlyPhoneSection: true,
      };
      render(<ProfileForm {...phoneProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      // Vérifier les title attributes
      expect(screen.getByTitle('Modifier le numéro')).toBeInTheDocument();
      expect(screen.getByTitle('Supprimer le numéro')).toBeInTheDocument();
    });

    test('doit avoir des inputs avec placeholder appropriés', () => {
      const editProps = {
        ...defaultProps,
        showOnlyNameEdit: true,
      };
      render(<ProfileForm {...editProps} />);

      expect(screen.getByPlaceholderText('Votre nom')).toBeInTheDocument();
    });

    test('doit avoir des inputs avec type approprié', () => {
      const phoneEditProps = {
        ...defaultProps,
        showOnlyPhoneSection: true,
        isEditing: true,
      };
      render(<ProfileForm {...phoneEditProps} />);

      const phoneInput = screen.getByPlaceholderText('06 12 34 56 78');
      expect(phoneInput).toHaveAttribute('type', 'tel');
    });
  });
});
