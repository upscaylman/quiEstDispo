/**
 * Utilitaire pour la gestion des droits admin
 * Les admins ont accès aux fonctionnalités de développement même en production
 */

// Liste des emails admin
const ADMIN_EMAILS = ['bouvier.jul@gmail.com'];

/**
 * Vérifie si un utilisateur est admin
 * @param {Object|null} user - L'utilisateur Firebase (avec email)
 * @returns {boolean}
 */
export const isAdmin = user => {
  if (!user?.email) return false;
  return ADMIN_EMAILS.includes(user.email.toLowerCase());
};

/**
 * Vérifie si on doit afficher les outils de développement
 * Affiche si:
 * - Mode développement OU
 * - Utilisateur est admin
 * @param {Object|null} user - L'utilisateur Firebase
 * @returns {boolean}
 */
export const showDevTools = user => {
  const isDev =
    process.env.NODE_ENV === 'development' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  return isDev || isAdmin(user);
};

/**
 * Vérifie si l'utilisateur a les droits pour une action admin
 * @param {Object|null} user - L'utilisateur Firebase
 * @param {string} action - L'action à vérifier (pour logging)
 * @returns {boolean}
 */
export const canPerformAdminAction = (user, action = '') => {
  const allowed = showDevTools(user);

  if (allowed && action) {
    console.log(
      `🔐 [ADMIN] Action autorisée: ${action} pour ${user?.email || 'dev'}`
    );
  }

  return allowed;
};

export default {
  isAdmin,
  showDevTools,
  canPerformAdminAction,
  ADMIN_EMAILS,
};
