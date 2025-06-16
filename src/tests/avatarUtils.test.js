import {
  generateAvatarHTML,
  getAvatarUrl,
  getDisplayName,
  getInitials,
  isValidAvatarUrl,
} from '../utils/avatarUtils';

describe('Avatar Utils - PRIORITÉ #2', () => {
  describe('isValidAvatarUrl', () => {
    test('doit valider les URLs HTTP/HTTPS', () => {
      expect(isValidAvatarUrl('http://example.com/avatar.jpg')).toBe(true);
      expect(isValidAvatarUrl('https://example.com/avatar.png')).toBe(true);
    });

    test('doit valider les URLs data', () => {
      expect(isValidAvatarUrl('data:image/png;base64,iVBORw0KGgoAAAA')).toBe(
        true
      );
    });

    test('doit rejeter les URLs invalides', () => {
      expect(isValidAvatarUrl('ftp://example.com/avatar.jpg')).toBeFalsy();
      expect(isValidAvatarUrl('')).toBeFalsy();
      expect(isValidAvatarUrl(null)).toBeFalsy();
      expect(isValidAvatarUrl(undefined)).toBeFalsy();
    });
  });

  describe('getAvatarUrl', () => {
    test('doit récupérer avatar depuis user.avatar', () => {
      const user = { avatar: 'http://example.com/avatar.jpg' };
      expect(getAvatarUrl(user)).toBe('http://example.com/avatar.jpg');
    });

    test('doit récupérer avatar depuis user.profilePicture', () => {
      const user = { profilePicture: 'http://example.com/profile.jpg' };
      expect(getAvatarUrl(user)).toBe('http://example.com/profile.jpg');
    });

    test('doit récupérer avatar depuis user.photoURL', () => {
      const user = { photoURL: 'http://example.com/photo.jpg' };
      expect(getAvatarUrl(user)).toBe('http://example.com/photo.jpg');
    });

    test('doit récupérer avatar depuis user.friend.avatar', () => {
      const user = { friend: { avatar: 'http://example.com/friend.jpg' } };
      expect(getAvatarUrl(user)).toBe('http://example.com/friend.jpg');
    });

    test('doit prioriser avatar > profilePicture > photoURL', () => {
      const user = {
        avatar: 'http://example.com/avatar.jpg',
        profilePicture: 'http://example.com/profile.jpg',
        photoURL: 'http://example.com/photo.jpg',
      };
      expect(getAvatarUrl(user)).toBe('http://example.com/avatar.jpg');
    });

    test('doit retourner null si aucun avatar trouvé', () => {
      expect(getAvatarUrl({})).toBe(null);
      expect(getAvatarUrl(null)).toBe(null);
      expect(getAvatarUrl(undefined)).toBe(null);
    });
  });

  describe('getDisplayName', () => {
    test('doit récupérer le nom depuis user.name', () => {
      const user = { name: 'Alice Dupont' };
      expect(getDisplayName(user)).toBe('Alice Dupont');
    });

    test('doit récupérer le nom depuis user.displayName', () => {
      const user = { displayName: 'Bob Martin' };
      expect(getDisplayName(user)).toBe('Bob Martin');
    });

    test('doit récupérer le nom depuis user.friend.name', () => {
      const user = { friend: { name: 'Charlie Brown' } };
      expect(getDisplayName(user)).toBe('Charlie Brown');
    });

    test('doit prioriser name > displayName', () => {
      const user = {
        name: 'Alice Dupont',
        displayName: 'Alice D.',
      };
      expect(getDisplayName(user)).toBe('Alice Dupont');
    });

    test('doit utiliser le nom par défaut si aucun nom', () => {
      expect(getDisplayName({})).toBe('Utilisateur');
      expect(getDisplayName(null)).toBe('Utilisateur');
    });

    test('doit utiliser un nom par défaut personnalisé', () => {
      expect(getDisplayName({}, 'Invité')).toBe('Invité');
      expect(getDisplayName(null, 'Anonyme')).toBe('Anonyme');
    });
  });

  describe('getInitials', () => {
    test('doit générer les initiales', () => {
      expect(getInitials('Alice Dupont')).toBe('AL');
      expect(getInitials('Bob')).toBe('BO');
    });

    test('doit retourner ?? pour noms invalides', () => {
      expect(getInitials('')).toBe('??');
      expect(getInitials(null)).toBe('??');
    });

    test('doit gérer les noms courts', () => {
      expect(getInitials('A')).toBe('A');
      expect(getInitials('AB')).toBe('AB');
    });

    test('doit mettre en majuscules', () => {
      expect(getInitials('alice dupont')).toBe('AL');
      expect(getInitials('bob martin')).toBe('BO');
    });

    test('doit gérer les caractères spéciaux', () => {
      expect(getInitials('Élise François')).toBe('ÉL');
      expect(getInitials('José María')).toBe('JO');
    });
  });

  describe('generateAvatarHTML', () => {
    test('doit générer HTML avec image pour URL valide', () => {
      const user = {
        avatar: 'http://example.com/avatar.jpg',
        name: 'Alice Dupont',
      };
      const html = generateAvatarHTML(user);

      expect(html).toContain('<img src="http://example.com/avatar.jpg"');
      expect(html).toContain('object-fit: cover');
    });

    test('doit générer HTML avec initiales pour URL invalide', () => {
      const user = { name: 'Alice Dupont' };
      const html = generateAvatarHTML(user);

      expect(html).toContain('AL');
      expect(html).not.toContain('<img');
      expect(html).toContain('background: #6b7280');
    });

    test('doit appliquer le style de conteneur personnalisé', () => {
      const user = { name: 'Bob' };
      const customStyle = 'width: 50px; height: 50px; border-radius: 50%;';
      const html = generateAvatarHTML(user, customStyle);

      expect(html).toContain(`style="${customStyle}"`);
    });

    test('doit gérer les utilisateurs sans nom', () => {
      const user = {};
      const html = generateAvatarHTML(user);

      expect(html).toContain('UT'); // Initiales de "Utilisateur"
    });
  });

  describe("Cas d'usage réels", () => {
    test('doit gérer un objet utilisateur Firebase complet', () => {
      const user = {
        name: 'Alice Dupont',
        avatar: 'https://example.com/avatar.jpg',
        photoURL: 'https://firebase.com/photo.jpg',
        displayName: 'Alice D.',
      };

      expect(getAvatarUrl(user)).toBe('https://example.com/avatar.jpg');
      expect(getDisplayName(user)).toBe('Alice Dupont');
      expect(getInitials(getDisplayName(user))).toBe('AL');
      expect(isValidAvatarUrl(getAvatarUrl(user))).toBe(true);
    });

    test('doit gérer un objet ami incomplet', () => {
      const user = {
        friend: {
          name: 'Bob',
        },
      };

      expect(getAvatarUrl(user)).toBe(null);
      expect(getDisplayName(user)).toBe('Bob');
      expect(getInitials(getDisplayName(user))).toBe('BO');
      expect(isValidAvatarUrl(getAvatarUrl(user))).toBeFalsy();
    });

    test('doit gérer les données corrompues gracieusement', () => {
      const corruptedUsers = [
        { avatar: '', name: '' },
        { avatar: 'invalid-url', name: null },
        { profilePicture: 123, displayName: undefined },
        null,
        undefined,
        {},
      ];

      corruptedUsers.forEach(user => {
        expect(() => {
          getAvatarUrl(user);
          getDisplayName(user);
          getInitials(getDisplayName(user));
          generateAvatarHTML(user);
        }).not.toThrow();
      });
    });
  });
});
