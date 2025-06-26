// Composant pour afficher les badges de statut des amis - Phase 4 TASK 1.5
import { UserEventStatus } from '../types/eventTypes';

/**
 * Badge de statut coloré pour les amis - TASK 1.5: Interface états temps réel
 * @param {Object} props
 * @param {string} props.status - Statut de l'ami (LIBRE, INVITATION_ENVOYEE, etc.)
 * @param {string} props.message - Message descriptif
 * @param {string} props.color - Classes CSS de couleur (optionnel)
 * @param {string} props.size - Taille du badge ('xs', 'sm', 'md', 'lg')
 * @param {boolean} props.showIcon - Afficher une icône (défaut: true)
 * @param {boolean} props.animate - Animation pulse pour états actifs
 * @param {boolean} props.darkMode - Mode sombre
 */
const StatusBadge = ({
  status,
  message,
  color,
  size = 'xs',
  showIcon = true,
  animate = false,
  darkMode = false,
}) => {
  // 🎨 COULEURS EXACTES selon flow complet mémorisé
  const statusColors = {
    [UserEventStatus.LIBRE]: 'bg-green-100 text-green-800 border-green-200',
    [UserEventStatus.INVITATION_ENVOYEE]:
      'bg-orange-100 text-orange-800 border-orange-200',
    [UserEventStatus.INVITATION_RECUE]:
      'bg-purple-100 text-purple-800 border-purple-200', // ⚪ -> violet pour visibilité
    [UserEventStatus.EN_PARTAGE]: 'bg-blue-100 text-blue-800 border-blue-200', // 🔵 Partage
    default: 'bg-gray-100 text-gray-600 border-gray-200',
  };

  // 🌙 COULEURS MODE SOMBRE
  const statusColorsDark = {
    [UserEventStatus.LIBRE]: 'bg-green-900/30 text-green-300 border-green-700',
    [UserEventStatus.INVITATION_ENVOYEE]:
      'bg-orange-900/30 text-orange-300 border-orange-700',
    [UserEventStatus.INVITATION_RECUE]:
      'bg-purple-900/30 text-purple-300 border-purple-700',
    [UserEventStatus.EN_PARTAGE]:
      'bg-blue-900/30 text-blue-300 border-blue-700',
    default: 'bg-gray-800 text-gray-400 border-gray-600',
  };

  // 🎯 ICÔNES SELON FLOW COMPLET
  const statusIcons = {
    [UserEventStatus.LIBRE]: '🟢', // Libre
    [UserEventStatus.INVITATION_ENVOYEE]: '🟠', // Invitation envoyée
    [UserEventStatus.INVITATION_RECUE]: '⚪', // Invitation reçue
    [UserEventStatus.EN_PARTAGE]: '🔵', // Partage actif
    default: '⚫',
  };

  // 📏 CLASSES DE TAILLE
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  // 🎨 SÉLECTION COULEURS
  const colorMap = darkMode ? statusColorsDark : statusColors;
  const colorClass = color || colorMap[status] || colorMap.default;
  const sizeClass = sizeClasses[size] || sizeClasses.xs;
  const icon = statusIcons[status] || statusIcons.default;

  // ✨ ANIMATION pour états actifs
  const animationClass = animate ? 'animate-pulse' : '';

  // 🎯 ÉTATS ACTIFS (invitations/partage)
  const isActiveState = [
    UserEventStatus.INVITATION_ENVOYEE,
    UserEventStatus.INVITATION_RECUE,
    UserEventStatus.EN_PARTAGE,
  ].includes(status);

  return (
    <div
      className={`
        inline-flex items-center gap-1 rounded-full font-medium border
        ${colorClass} ${sizeClass}
        ${isActiveState && animate ? animationClass : ''}
        transition-all duration-200 ease-in-out
        shadow-sm
      `}
      title={`État: ${status} - ${message}`}
    >
      {showIcon && <span className="text-xs leading-none">{icon}</span>}
      <span className="truncate leading-none font-medium">{message}</span>
    </div>
  );
};

export default StatusBadge;
