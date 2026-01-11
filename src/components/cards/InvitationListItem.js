/**
 * InvitationListItem.js
 * Composant liste compacte simple pour les invitations
 * Ligne unique avec icônes et actions rapides
 */

import { motion } from 'framer-motion';
import {
  AlertCircle,
  Beer,
  Check,
  Clock as ClockIcon,
  Coffee,
  Film,
  MapPin,
  PartyPopper,
  RotateCcw,
  Send,
  Sofa,
  UserPlus,
  Users,
  UtensilsCrossed,
  X,
} from 'lucide-react';

// Configuration des types d'invitation
const TYPE_CONFIG = {
  invitation_received: {
    color: 'bg-green-500',
    textColor: 'text-green-600',
    borderColor: 'border-l-green-500',
    icon: Check,
    label: 'Reçue',
  },
  invitation_sent: {
    color: 'bg-blue-500',
    textColor: 'text-blue-600',
    borderColor: 'border-l-blue-500',
    icon: Send,
    label: 'Envoyée',
    animate: true, // Animation de pulse sur le badge
  },
  in_progress: {
    color: 'bg-purple-500',
    textColor: 'text-purple-600',
    borderColor: 'border-l-purple-500',
    icon: Users,
    label: 'En cours',
  },
  ending_soon: {
    color: 'bg-red-500',
    textColor: 'text-red-600',
    borderColor: 'border-l-red-500',
    icon: AlertCircle,
    label: 'Bientôt fini',
    animate: true,
  },
  friend_request: {
    color: 'bg-cyan-500',
    textColor: 'text-cyan-600',
    borderColor: 'border-l-cyan-500',
    icon: UserPlus,
    label: 'Ami',
  },
  group_invitation: {
    color: 'bg-violet-500',
    textColor: 'text-violet-600',
    borderColor: 'border-l-violet-500',
    icon: Users,
    label: 'Groupe',
  },
  declined: {
    color: 'bg-gray-400',
    textColor: 'text-gray-500',
    borderColor: 'border-l-gray-400',
    icon: X,
    label: 'Déclinée',
    opacity: 'opacity-60',
  },
  expired: {
    color: 'bg-orange-400',
    textColor: 'text-orange-500',
    borderColor: 'border-l-orange-400',
    icon: ClockIcon,
    label: 'Expirée',
    opacity: 'opacity-60',
  },
  invitation_expired: {
    color: 'bg-orange-400',
    textColor: 'text-orange-500',
    borderColor: 'border-l-orange-400',
    icon: ClockIcon,
    label: 'Expirée',
    opacity: 'opacity-60',
  },
};

// Icônes par activité
const ACTIVITY_ICONS = {
  coffee: Coffee,
  lunch: UtensilsCrossed,
  drinks: Beer,
  chill: Sofa,
  clubbing: PartyPopper,
  cinema: Film,
};

const InvitationListItem = ({
  id,
  type,
  user,
  users,
  activity,
  distance,
  expiresIn,
  timeRemaining,
  createdAt,
  groupSize,
  // Callbacks
  onAccept,
  onDecline,
  onCancel,
  onViewOnMap,
  onExtend,
  onTerminate,
  onJoinGroup,
  onInviteOther,
  onReinvite,
  onReinviteOther,
}) => {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.invitation_received;
  const ActivityIcon = ACTIVITY_ICONS[activity] || Coffee;
  const TypeIcon = config.icon;

  // Nom à afficher
  const displayName = users
    ? users.map(u => u.name || u.displayName).join(', ')
    : user?.name || user?.displayName || 'Inconnu';

  // Info secondaire (distance, temps, etc.)
  const getSecondaryInfo = () => {
    if (type === 'ending_soon' || type === 'in_progress') {
      return timeRemaining || expiresIn;
    }
    if (type === 'invitation_received' || type === 'invitation_sent') {
      return expiresIn;
    }
    if (type === 'group_invitation') {
      return `${groupSize || users?.length || 0} pers.`;
    }
    return createdAt;
  };

  // Actions rapides (icônes)
  const renderQuickActions = () => {
    switch (type) {
      case 'invitation_received':
      case 'friend_request':
        return (
          <div className="flex gap-1">
            <button
              onClick={e => {
                e.stopPropagation();
                onAccept?.();
              }}
              className="p-1.5 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors"
              title="Accepter"
            >
              <Check size={14} />
            </button>
            <button
              onClick={e => {
                e.stopPropagation();
                onDecline?.();
              }}
              className="p-1.5 rounded-full bg-gray-300 text-gray-600 hover:bg-gray-400 transition-colors"
              title="Décliner"
            >
              <X size={14} />
            </button>
          </div>
        );
      case 'invitation_sent':
        return (
          <button
            onClick={e => {
              e.stopPropagation();
              onCancel?.();
            }}
            className="p-1.5 rounded-full bg-gray-300 text-gray-600 hover:bg-red-400 hover:text-white transition-colors"
            title="Annuler"
          >
            <X size={14} />
          </button>
        );
      case 'in_progress':
        return (
          <button
            onClick={e => {
              e.stopPropagation();
              onViewOnMap?.();
            }}
            className="p-1.5 rounded-full bg-purple-500 text-white hover:bg-purple-600 transition-colors"
            title="Voir sur la carte"
          >
            <MapPin size={14} />
          </button>
        );
      case 'ending_soon':
        return (
          <div className="flex gap-1">
            <button
              onClick={e => {
                e.stopPropagation();
                onExtend?.();
              }}
              className="p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
              title="Prolonger"
            >
              <ClockIcon size={14} />
            </button>
            <button
              onClick={e => {
                e.stopPropagation();
                onTerminate?.();
              }}
              className="p-1.5 rounded-full bg-gray-300 text-gray-600 hover:bg-gray-400 transition-colors"
              title="Terminer"
            >
              <X size={14} />
            </button>
          </div>
        );
      case 'group_invitation':
        return (
          <button
            onClick={e => {
              e.stopPropagation();
              onJoinGroup?.();
            }}
            className="p-1.5 rounded-full bg-violet-500 text-white hover:bg-violet-600 transition-colors"
            title="Rejoindre"
          >
            <Users size={14} />
          </button>
        );
      case 'declined':
        return (
          <button
            onClick={e => {
              e.stopPropagation();
              onInviteOther?.();
            }}
            className="p-1.5 rounded-full bg-gray-300 text-gray-600 hover:bg-gray-400 transition-colors"
            title="Inviter quelqu'un d'autre"
          >
            <UserPlus size={14} />
          </button>
        );
      case 'expired':
      case 'invitation_expired':
        return (
          <div className="flex gap-1">
            <button
              onClick={e => {
                e.stopPropagation();
                onReinvite?.();
              }}
              className="p-1.5 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition-colors"
              title="Réinviter"
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={e => {
                e.stopPropagation();
                onReinviteOther?.();
              }}
              className="p-1.5 rounded-full bg-gray-300 text-gray-600 hover:bg-gray-400 transition-colors"
              title="Inviter quelqu'un d'autre"
            >
              <UserPlus size={14} />
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`
        flex items-center gap-3 p-3
        bg-[var(--md-sys-color-surface-container-low)] 
        rounded-xl border-l-4 ${config.borderColor}
        ${config.opacity || ''}
        transition-shadow hover:shadow-md
      `}
    >
      {/* Icône type avec animation décompte pour invitation_sent */}
      <div className="relative flex-shrink-0">
        {type === 'invitation_sent' && (
          <motion.div
            className="absolute inset-0 w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
        )}
        <div
          className={`
            w-8 h-8 rounded-full ${config.color} 
            flex items-center justify-center text-white
          `}
        >
          <TypeIcon size={16} />
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {/* Badge type */}
          {config.animate ? (
            <motion.span
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${config.color} text-white font-medium`}
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              {config.label}
            </motion.span>
          ) : (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${config.color} text-white font-medium`}
            >
              {config.label}
            </span>
          )}
          {/* Nom */}
          <span className="font-semibold text-sm text-[var(--md-sys-color-on-surface)] truncate">
            {displayName}
          </span>
        </div>
        {/* Info secondaire */}
        <div className="flex items-center gap-2 text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
          <span className="flex items-center gap-1">
            <ActivityIcon size={12} />
            {activity}
          </span>
          {distance && (
            <span className="flex items-center gap-1">
              <MapPin size={10} />
              {distance}
            </span>
          )}
          {config.animate ? (
            <motion.span
              className={`flex items-center gap-1 font-semibold ${type === 'invitation_sent' ? 'text-blue-500' : 'text-red-500'}`}
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ClockIcon size={10} />
              {getSecondaryInfo()}
            </motion.span>
          ) : (
            <span className="flex items-center gap-1">
              <ClockIcon size={10} />
              {getSecondaryInfo()}
            </span>
          )}
        </div>
      </div>

      {/* Actions rapides */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {renderQuickActions()}
      </div>
    </div>
  );
};

export default InvitationListItem;
