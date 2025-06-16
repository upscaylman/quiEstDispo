// Utilitaires pour l'affichage des avatars
// Centralise la logique d'affichage des avatars dans toute l'application

/**
 * Vérifie si une URL d'avatar est valide pour être affichée comme image
 * @param {string} avatarUrl - L'URL de l'avatar
 * @returns {boolean} - true si l'URL peut être utilisée comme src d'image
 */
export const isValidAvatarUrl = avatarUrl => {
  return (
    avatarUrl && (avatarUrl.startsWith('http') || avatarUrl.startsWith('data:'))
  );
};

/**
 * Obtient l'URL d'avatar à partir de différentes sources possibles
 * @param {object} user - L'objet utilisateur/ami
 * @returns {string|null} - L'URL de l'avatar ou null
 */
export const getAvatarUrl = user => {
  return (
    user?.avatar ||
    user?.profilePicture ||
    user?.photoURL ||
    user?.friend?.avatar ||
    user?.friend?.profilePicture ||
    user?.friend?.photoURL ||
    null
  );
};

/**
 * Obtient le nom d'affichage à partir de différentes sources possibles
 * @param {object} user - L'objet utilisateur/ami
 * @param {string} defaultName - Nom par défaut si aucun nom trouvé
 * @returns {string} - Le nom d'affichage
 */
export const getDisplayName = (user, defaultName = 'Utilisateur') => {
  return (
    user?.name ||
    user?.displayName ||
    user?.friend?.name ||
    user?.friend?.displayName ||
    defaultName
  );
};

/**
 * Génère les initiales à partir d'un nom
 * @param {string} name - Le nom complet
 * @returns {string} - Les initiales (max 2 caractères)
 */
export const getInitials = name => {
  if (!name) return '??';
  return name.substring(0, 2).toUpperCase();
};

/**
 * Composant d'affichage d'avatar uniforme pour React
 * @param {object} props - Les propriétés du composant
 * @returns {JSX.Element} - L'élément avatar
 */
export const AvatarDisplay = ({
  user,
  size = 'w-12 h-12',
  textSize = 'text-2xl',
  className = '',
  fallbackIcon = '👤',
  showFallbackIcon = true,
}) => {
  const avatarUrl = getAvatarUrl(user);
  const displayName = getDisplayName(user);
  const isValidUrl = isValidAvatarUrl(avatarUrl);

  const baseClasses = `${size} bg-gray-200 rounded-full flex items-center justify-center ${className}`;

  if (isValidUrl) {
    return (
      <div className={baseClasses}>
        <img
          src={avatarUrl}
          alt="Avatar"
          className={`${size} rounded-full object-cover`}
          onError={e => {
            // En cas d'erreur de chargement, afficher les initiales
            e.target.style.display = 'none';
            const parent = e.target.parentNode;
            parent.innerHTML = `<span class="${textSize}">${getInitials(displayName)}</span>`;
          }}
        />
      </div>
    );
  }

  // Fallback : afficher l'icône ou les initiales
  return (
    <div className={baseClasses}>
      <span className={textSize}>
        {showFallbackIcon && (avatarUrl === fallbackIcon || !avatarUrl)
          ? fallbackIcon
          : getInitials(displayName)}
      </span>
    </div>
  );
};

/**
 * Génère du HTML pour l'affichage d'avatar dans les marqueurs de carte
 * @param {object} user - L'objet utilisateur/ami
 * @param {string} containerStyle - Le style CSS du conteneur
 * @returns {string} - Le HTML de l'avatar
 */
export const generateAvatarHTML = (user, containerStyle = '') => {
  const avatarUrl = getAvatarUrl(user);
  const displayName = getDisplayName(user);
  const isValidUrl = isValidAvatarUrl(avatarUrl);

  if (isValidUrl) {
    return `
      <div style="${containerStyle}">
        <img src="${avatarUrl}" style="
          width: 100%; 
          height: 100%; 
          object-fit: cover;
          position: absolute;
          top: 0;
          left: 0;
        " alt="Avatar" />
      </div>
    `;
  }

  return `
    <div style="${containerStyle}">
      <div style="
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        font-weight: bold;
        color: white;
        background: #6b7280;
      ">
        ${getInitials(displayName)}
      </div>
    </div>
  `;
};

const AvatarUtils = {
  isValidAvatarUrl,
  getAvatarUrl,
  getDisplayName,
  getInitials,
  AvatarDisplay,
  generateAvatarHTML,
};

export default AvatarUtils;
