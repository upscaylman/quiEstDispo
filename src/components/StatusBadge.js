// Composant pour afficher les badges de statut des amis - Phase 4
import { UserEventStatus } from '../types/eventTypes';

/**
 * Badge de statut coloré pour les amis
 * @param {Object} props
 * @param {string} props.status - Statut de l'ami (LIBRE, INVITATION_ENVOYEE, etc.)
 * @param {string} props.message - Message descriptif
 * @param {string} props.color - Classes CSS de couleur (optionnel)
 * @param {string} props.size - Taille du badge ('sm', 'md', 'lg')
 * @param {boolean} props.showIcon - Afficher une icône
 */
const StatusBadge = ({
  status,
  message,
  color,
  size = 'sm',
  showIcon = false,
}) => {
  // Couleurs par défaut selon le statut
  const statusColors = {
    [UserEventStatus.LIBRE]: 'bg-green-500 text-white',
    [UserEventStatus.INVITATION_ENVOYEE]: 'bg-orange-500 text-white',
    [UserEventStatus.INVITATION_RECUE]: 'bg-blue-500 text-white',
    [UserEventStatus.EN_PARTAGE]: 'bg-red-500 text-white',
    default: 'bg-gray-400 text-white',
  };

  // Icônes selon le statut
  const statusIcons = {
    [UserEventStatus.LIBRE]: '🟢',
    [UserEventStatus.INVITATION_ENVOYEE]: '🟠',
    [UserEventStatus.INVITATION_RECUE]: '🔵',
    [UserEventStatus.EN_PARTAGE]: '🔴',
    default: '⚪',
  };

  // Classes de taille
  const sizeClasses = {
    xs: 'px-1 py-0.5 text-xs',
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const colorClass = color || statusColors[status] || statusColors.default;
  const sizeClass = sizeClasses[size] || sizeClasses.sm;
  const icon = statusIcons[status] || statusIcons.default;

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full font-medium ${colorClass} ${sizeClass}`}
    >
      {showIcon && <span className="text-xs">{icon}</span>}
      <span className="truncate">{message}</span>
    </div>
  );
};

export default StatusBadge;
