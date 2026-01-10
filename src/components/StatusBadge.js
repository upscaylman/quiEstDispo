// Composant pour afficher les badges de statut des amis - Phase 4 TASK 1.5
// Version uniformisée sans emojis - utilise des pastilles colorées
import { motion } from 'framer-motion';
import { UserEventStatus } from '../types/eventTypes';

/**
 * Badge de statut coloré pour les amis - TASK 1.5: Interface états temps réel
 * Version uniformisée avec pastilles colorées au lieu d'emojis
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
  // 🎨 COULEURS PASTILLES (sans emojis)
  const statusDotColors = {
    [UserEventStatus.LIBRE]: '#22c55e', // Vert
    [UserEventStatus.INVITATION_ENVOYEE]: '#f97316', // Orange
    [UserEventStatus.INVITATION_RECUE]: '#8b5cf6', // Violet
    [UserEventStatus.EN_PARTAGE]: '#3b82f6', // Bleu
    default: '#6b7280', // Gris
  };

  // 🎨 COULEURS BADGE selon le mode
  const statusColors = {
    [UserEventStatus.LIBRE]: darkMode
      ? 'bg-green-900/30 text-green-300 border-green-700'
      : 'bg-green-100 text-green-800 border-green-200',
    [UserEventStatus.INVITATION_ENVOYEE]: darkMode
      ? 'bg-orange-900/30 text-orange-300 border-orange-700'
      : 'bg-orange-100 text-orange-800 border-orange-200',
    [UserEventStatus.INVITATION_RECUE]: darkMode
      ? 'bg-purple-900/30 text-purple-300 border-purple-700'
      : 'bg-purple-100 text-purple-800 border-purple-200',
    [UserEventStatus.EN_PARTAGE]: darkMode
      ? 'bg-blue-900/30 text-blue-300 border-blue-700'
      : 'bg-blue-100 text-blue-800 border-blue-200',
    default: darkMode
      ? 'bg-gray-800 text-gray-400 border-gray-600'
      : 'bg-gray-100 text-gray-600 border-gray-200',
  };

  // 📏 CLASSES DE TAILLE
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  // Tailles des pastilles
  const dotSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };

  // 🎨 SÉLECTION COULEURS
  const colorClass = color || statusColors[status] || statusColors.default;
  const sizeClass = sizeClasses[size] || sizeClasses.xs;
  const dotColor = statusDotColors[status] || statusDotColors.default;
  const dotSize = dotSizes[size] || dotSizes.xs;

  // 🎯 ÉTATS ACTIFS (invitations/partage)
  const isActiveState = [
    UserEventStatus.INVITATION_ENVOYEE,
    UserEventStatus.INVITATION_RECUE,
    UserEventStatus.EN_PARTAGE,
  ].includes(status);

  const shouldAnimate = animate && isActiveState;

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium border
        ${colorClass} ${sizeClass}
        transition-all duration-200 ease-in-out
        shadow-sm
      `}
      title={`État: ${status} - ${message}`}
    >
      {/* Pastille colorée au lieu d'emoji */}
      {showIcon && (
        <motion.span
          className={`${dotSize} rounded-full inline-block flex-shrink-0`}
          style={{ backgroundColor: dotColor }}
          animate={
            shouldAnimate
              ? {
                  scale: [1, 1.3, 1],
                  opacity: [1, 0.7, 1],
                }
              : {}
          }
          transition={
            shouldAnimate
              ? {
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }
              : {}
          }
        />
      )}
      <span className="truncate leading-none font-medium">{message}</span>
    </div>
  );
};

export default StatusBadge;
