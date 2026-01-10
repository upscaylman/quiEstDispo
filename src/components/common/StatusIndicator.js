import { motion } from 'framer-motion';

/**
 * StatusIndicator - Pastille de statut uniforme MD3
 *
 * Statuts supportés:
 * - online: Vert - En ligne et disponible
 * - offline: Gris - Hors ligne
 * - busy: Rouge - Occupé / En activité
 * - away: Orange/Jaune - Absent / Invitation en cours
 * - sharing: Bleu - En partage d'activité
 */

// Configuration des statuts avec couleurs MD3
// On sépare : connexion (online/offline) et disponibilité (available/busy)
const STATUS_CONFIG = {
  // === Statuts de connexion + disponibilité ===
  online_available: {
    color: 'var(--md-sys-color-success, #22c55e)',
    label: 'Disponible',
    connectionColor: 'var(--md-sys-color-success, #22c55e)',
    pulse: false,
  },
  online_busy: {
    color: 'var(--md-sys-color-error, #ef4444)',
    label: 'Occupé',
    connectionColor: 'var(--md-sys-color-success, #22c55e)',
    pulse: false,
  },
  offline_available: {
    color: 'var(--md-sys-color-outline, #6b7280)',
    label: 'Disponible',
    connectionColor: 'var(--md-sys-color-outline, #6b7280)',
    pulse: false,
  },
  offline_busy: {
    color: 'var(--md-sys-color-outline, #6b7280)',
    label: 'Occupé',
    connectionColor: 'var(--md-sys-color-outline, #6b7280)',
    pulse: false,
  },
  // === Statuts simples (rétrocompatibilité) ===
  online: {
    color: 'var(--md-sys-color-success, #22c55e)',
    label: 'En ligne',
    connectionColor: 'var(--md-sys-color-success, #22c55e)',
    pulse: false,
  },
  offline: {
    color: 'var(--md-sys-color-outline, #6b7280)',
    label: 'Hors ligne',
    connectionColor: 'var(--md-sys-color-outline, #6b7280)',
    pulse: false,
  },
  busy: {
    color: 'var(--md-sys-color-error, #ef4444)',
    label: 'Occupé',
    connectionColor: 'var(--md-sys-color-error, #ef4444)',
    pulse: false,
  },
  away: {
    color: 'var(--md-sys-color-warning, #f59e0b)',
    label: 'Absent',
    connectionColor: 'var(--md-sys-color-warning, #f59e0b)',
    pulse: true,
  },
  // === Statuts d'événement ===
  sharing: {
    color: 'var(--md-sys-color-primary, #3b82f6)',
    label: 'En partage',
    connectionColor: 'var(--md-sys-color-success, #22c55e)',
    pulse: true,
  },
  invitation_sent: {
    color: 'var(--md-sys-color-tertiary, #f97316)',
    label: 'Invitation envoyée',
    connectionColor: 'var(--md-sys-color-success, #22c55e)',
    pulse: true,
  },
  invitation_received: {
    color: 'var(--md-sys-color-secondary, #8b5cf6)',
    label: 'Invitation reçue',
    connectionColor: 'var(--md-sys-color-success, #22c55e)',
    pulse: true,
  },
};

// Tailles disponibles
const SIZES = {
  xs: { dot: 'w-2 h-2', ring: 'w-3 h-3' },
  sm: { dot: 'w-2.5 h-2.5', ring: 'w-4 h-4' },
  md: { dot: 'w-3 h-3', ring: 'w-5 h-5' },
  lg: { dot: 'w-4 h-4', ring: 'w-6 h-6' },
};

const StatusIndicator = ({
  status = 'offline',
  size = 'sm',
  showLabel = false,
  showRing = true,
  className = '',
  animate = true,
}) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.offline;
  const sizeConfig = SIZES[size] || SIZES.sm;
  const shouldPulse = animate && config.pulse;

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      {/* Pastille avec anneau optionnel */}
      <div className="relative flex items-center justify-center">
        {/* Anneau de fond (pour contraste sur avatar) */}
        {showRing && (
          <div
            className={`absolute ${sizeConfig.ring} rounded-full`}
            style={{
              backgroundColor: 'var(--md-sys-color-surface, white)',
            }}
          />
        )}

        {/* Pastille principale */}
        <motion.div
          className={`relative ${sizeConfig.dot} rounded-full`}
          style={{ backgroundColor: config.color }}
          animate={
            shouldPulse
              ? {
                  scale: [1, 1.2, 1],
                  opacity: [1, 0.8, 1],
                }
              : {}
          }
          transition={
            shouldPulse
              ? {
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }
              : {}
          }
        />
      </div>

      {/* Label optionnel */}
      {showLabel && (
        <span
          className="text-xs font-medium"
          style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
        >
          {config.label}
        </span>
      )}
    </div>
  );
};

/**
 * Convertit un statut d'événement en statut d'indicateur
 */
export const mapEventStatusToIndicator = eventStatus => {
  const mapping = {
    LIBRE: 'online',
    INVITATION_ENVOYEE: 'invitation_sent',
    INVITATION_RECUE: 'invitation_received',
    EN_PARTAGE: 'sharing',
  };
  return mapping[eventStatus] || 'offline';
};

/**
 * Détermine le statut d'affichage d'un ami
 * Combine le statut de connexion (online/offline) avec la disponibilité (available/busy)
 */
export const getFriendDisplayStatus = (friend, friendStatus) => {
  const isOnline = friend?.isOnline ?? false;

  // Gestion des événements spéciaux (invitation, partage)
  if (friendStatus?.status) {
    const eventStatus = mapEventStatusToIndicator(friendStatus.status);
    if (
      ['sharing', 'invitation_sent', 'invitation_received'].includes(
        eventStatus
      )
    ) {
      return eventStatus;
    }
  }

  // Déterminer la disponibilité
  // On regarde d'abord le statut d'événement, puis les flags du friend
  let isAvailable = true; // Par défaut dispo

  if (friendStatus?.status === 'BUSY' || friendStatus?.isBusy) {
    isAvailable = false;
  } else if (
    friend?.isBusy ||
    friend?.status === 'busy' ||
    friend?.availability === 'busy'
  ) {
    isAvailable = false;
  } else if (
    friendStatus?.status === 'LIBRE' ||
    friend?.status === 'available' ||
    friend?.availability === 'available'
  ) {
    isAvailable = true;
  }

  // Combiner connexion + disponibilité
  if (isOnline) {
    return isAvailable ? 'online_available' : 'online_busy';
  } else {
    return isAvailable ? 'offline_available' : 'offline_busy';
  }
};

export { STATUS_CONFIG };
export default StatusIndicator;
