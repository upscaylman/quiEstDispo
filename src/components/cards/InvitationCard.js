/**
 * Composant de carte d'invitation réutilisable
 * Gère tous les types d'invitations/événements de l'app
 *
 * Types supportés:
 * - invitation_received: Invitation d'activité reçue
 * - invitation_sent: Invitation envoyée, en attente de réponse
 * - in_progress: Rendez-vous en cours
 * - ending_soon: Rendez-vous bientôt terminé (< 5 min)
 * - friend_request: Demande d'ami
 * - group_invitation: Invitation à rejoindre un groupe
 * - declined: Invitation déclinée
 * - expired: Invitation expirée
 */

import { motion } from 'framer-motion';
import {
  Check,
  CheckCheck,
  Clock,
  Coffee,
  Film,
  MapPin,
  Music,
  Sofa,
  Users,
  Utensils,
  Wine,
  X,
} from 'lucide-react';
import MD3Button from '../common/MD3Button';
import MD3Card from '../common/MD3Card';

// Icônes par type d'activité
const ACTIVITY_ICONS = {
  coffee: Coffee,
  lunch: Utensils,
  drinks: Wine,
  chill: Sofa,
  clubbing: Music,
  cinema: Film,
};

// Configuration des styles par type d'invitation
const TYPE_CONFIG = {
  invitation_received: {
    borderColor: 'border-l-green-500',
    badgeColor: 'bg-green-500',
    badgeText: 'INVITATION REÇUE',
    variant: 'elevated',
  },
  invitation_sent: {
    borderColor: 'border-l-blue-500',
    badgeColor: 'bg-blue-500',
    badgeText: 'INVITATION ENVOYÉE',
    variant: 'outlined',
  },
  in_progress: {
    borderColor: 'border-l-[var(--md-sys-color-tertiary)]',
    badgeColor: 'bg-[var(--md-sys-color-tertiary)]',
    badgeText: 'EN COURS',
    variant: 'filled',
    containerClass: 'bg-[var(--md-sys-color-tertiary-container)]/30',
  },
  ending_soon: {
    borderColor: 'border-l-[var(--md-sys-color-error)]',
    badgeColor: 'bg-[var(--md-sys-color-error)]',
    badgeText: 'BIENTÔT TERMINÉ',
    variant: 'filled',
    containerClass: 'bg-[var(--md-sys-color-error-container)]/20',
    animate: true,
  },
  friend_request: {
    borderColor: 'border-l-cyan-500',
    badgeColor: 'bg-cyan-500',
    badgeText: "DEMANDE D'AMI",
    variant: 'elevated',
  },
  group_invitation: {
    borderColor: 'border-l-[var(--md-sys-color-primary)]',
    badgeColor: 'bg-[var(--md-sys-color-primary)]',
    badgeText: 'GROUPE',
    variant: 'elevated',
    containerClass:
      'bg-gradient-to-r from-[var(--md-sys-color-primary-container)]/20 to-transparent',
  },
  declined: {
    borderColor: 'border-l-gray-400',
    badgeColor: 'bg-gray-400',
    badgeText: 'DÉCLINÉE',
    variant: 'outlined',
    opacity: 'opacity-70',
  },
  expired: {
    borderColor: 'border-l-orange-400',
    badgeColor: 'bg-orange-400',
    badgeText: 'EXPIRÉE',
    variant: 'outlined',
    opacity: 'opacity-60',
  },
};

// Couleurs pour les avatars (basées sur la première lettre du nom)
const AVATAR_COLORS = [
  'from-green-400 to-green-600',
  'from-blue-400 to-blue-600',
  'from-purple-400 to-purple-600',
  'from-pink-400 to-pink-600',
  'from-orange-400 to-orange-600',
  'from-cyan-400 to-cyan-600',
  'from-red-400 to-red-600',
  'from-indigo-400 to-indigo-600',
];

const getAvatarColor = name => {
  const index = name?.charCodeAt(0) % AVATAR_COLORS.length || 0;
  return AVATAR_COLORS[index];
};

const InvitationCard = ({
  // Données de base
  type, // Type d'invitation (voir TYPE_CONFIG)

  // Infos utilisateur(s)
  user, // { displayName, photoURL, uid }
  users, // Pour les groupes: [{ displayName, photoURL }]

  // Infos activité
  activity, // 'coffee', 'lunch', 'drinks', etc.

  // Infos temporelles
  createdAt, // Date de création
  expiresIn, // Temps avant expiration (string ou minutes)
  timeRemaining, // Temps restant pour activité en cours (string "38:42")

  // Infos localisation
  distance, // Distance en mètres ou string "350m"
  locationName, // Nom du lieu "Bar Le Central"

  // Infos groupe
  groupSize, // Nombre de personnes dans le groupe

  // Callbacks (seront les vraies fonctions)
  onAccept,
  onDecline,
  onCancel,
  onViewOnMap,
  onExtend,
  onTerminate,
  onJoinGroup,
  onViewDetails,
  onInviteOther,
}) => {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.invitation_received;
  const ActivityIcon = ACTIVITY_ICONS[activity] || Coffee;

  // Formater le temps écoulé
  const formatTimeAgo = date => {
    if (!date) return '';
    if (typeof date === 'string') return date; // Déjà formaté (mock)

    const now = new Date();
    const diff = Math.floor(
      (now.getTime() - new Date(date).getTime()) / 1000 / 60
    );
    if (diff < 1) return "À l'instant";
    if (diff < 60) return `Il y a ${diff} min`;
    return `Il y a ${Math.floor(diff / 60)}h`;
  };

  // Formater la distance
  const formatDistance = dist => {
    if (!dist) return null;
    if (typeof dist === 'string') return dist;
    if (dist < 1000) return `${dist}m`;
    return `${(dist / 1000).toFixed(1)}km`;
  };

  // Obtenir l'initiale pour l'avatar
  const getInitial = name => name?.charAt(0)?.toUpperCase() || '?';

  // Rendu de l'avatar
  const renderAvatar = () => {
    const name = user?.displayName || 'Utilisateur';
    const photoURL = user?.photoURL;

    if (type === 'group_invitation' && users?.length > 0) {
      // Avatars empilés pour les groupes
      return (
        <div className="flex -space-x-3">
          {users.slice(0, 2).map((u, i) => (
            <div
              key={i}
              className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(u.displayName)} border-2 border-white flex items-center justify-center text-white font-bold text-sm`}
              style={{ zIndex: 30 - i * 10 }}
            >
              {u.photoURL ? (
                <img
                  src={u.photoURL}
                  alt={u.displayName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                getInitial(u.displayName)
              )}
            </div>
          ))}
          {groupSize > 2 && (
            <div className="w-10 h-10 rounded-full bg-[var(--md-sys-color-primary-container)] border-2 border-white z-10 flex items-center justify-center">
              <span className="text-xs font-bold text-[var(--md-sys-color-on-primary-container)]">
                +{groupSize - 2}
              </span>
            </div>
          )}
        </div>
      );
    }

    // Avatar simple
    const isGrayed = type === 'declined' || type === 'expired';

    return (
      <div className="relative">
        <div
          className={`w-14 h-14 rounded-full ${isGrayed ? 'bg-gray-300' : `bg-gradient-to-br ${getAvatarColor(name)}`} flex items-center justify-center text-${isGrayed ? 'gray-500' : 'white'} text-xl font-bold ${type === 'invitation_sent' ? 'opacity-70' : ''}`}
        >
          {photoURL ? (
            <img
              src={photoURL}
              alt={name}
              className={`w-full h-full rounded-full object-cover ${isGrayed ? 'grayscale' : ''}`}
            />
          ) : (
            getInitial(name)
          )}
        </div>

        {/* Indicateur d'activité */}
        {activity && !isGrayed && type !== 'invitation_sent' && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center">
            <ActivityIcon size={10} className="text-white" />
          </div>
        )}

        {/* Indicateur de succès pour in_progress */}
        {type === 'in_progress' && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
            <Check size={10} className="text-white" />
          </div>
        )}

        {/* Animation de chargement pour invitation_sent */}
        {type === 'invitation_sent' && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
        )}
      </div>
    );
  };

  // Rendu du contenu principal
  const renderContent = () => {
    const name = user?.displayName || 'Utilisateur';

    switch (type) {
      case 'invitation_received':
        return (
          <>
            <h4 className="font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
              {name} t'invite pour un{' '}
              {activity
                ? activity.charAt(0).toUpperCase() + activity.slice(1)
                : 'moment'}{' '}
              <ActivityIcon
                size={18}
                className="text-[var(--md-sys-color-primary)]"
              />
            </h4>
            {distance && (
              <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mt-1 flex items-center gap-1">
                <MapPin size={14} /> À {formatDistance(distance)} de toi
              </p>
            )}
            {expiresIn && (
              <div className="flex items-center gap-2 mt-2 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                <Clock size={14} />
                <span>Expire dans {expiresIn}</span>
              </div>
            )}
          </>
        );

      case 'invitation_sent':
        return (
          <>
            <h4 className="font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
              Tu as invité {name} pour{' '}
              {activity
                ? activity.charAt(0).toUpperCase() + activity.slice(1)
                : 'un moment'}{' '}
              <ActivityIcon
                size={18}
                className="text-[var(--md-sys-color-primary)]"
              />
            </h4>
            <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mt-1">
              En attente de sa réponse...
            </p>
            <div className="flex items-center gap-2 mt-2">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-blue-500"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
              {expiresIn && (
                <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] ml-2">
                  Expire dans {expiresIn}
                </span>
              )}
            </div>
          </>
        );

      case 'in_progress':
        return (
          <>
            <h4 className="font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
              {activity
                ? activity.charAt(0).toUpperCase() + activity.slice(1)
                : 'Moment'}{' '}
              avec {name}{' '}
              <ActivityIcon
                size={18}
                className="text-[var(--md-sys-color-tertiary)]"
              />
            </h4>
            {(distance || locationName) && (
              <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mt-1 flex items-center gap-1">
                <MapPin size={14} />{' '}
                {distance ? `À ${formatDistance(distance)}` : ''}
                {distance && locationName ? ' • ' : ''}
                {locationName || ''}
              </p>
            )}
            {timeRemaining && (
              <div className="flex items-center gap-2 mt-3 p-2 rounded-xl bg-[var(--md-sys-color-surface-container)]">
                <Clock
                  size={16}
                  className="text-[var(--md-sys-color-tertiary)]"
                />
                <span className="font-mono text-lg font-bold text-[var(--md-sys-color-tertiary)]">
                  {timeRemaining}
                </span>
                <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                  restantes
                </span>
              </div>
            )}
          </>
        );

      case 'ending_soon':
        return (
          <>
            <h4 className="font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
              {activity
                ? activity.charAt(0).toUpperCase() + activity.slice(1)
                : 'Moment'}{' '}
              avec {name}{' '}
              <ActivityIcon
                size={18}
                className="text-[var(--md-sys-color-error)]"
              />
            </h4>
            {timeRemaining && (
              <div className="flex items-center gap-2 mt-3 p-2 rounded-xl bg-[var(--md-sys-color-error-container)]">
                <Clock size={16} className="text-[var(--md-sys-color-error)]" />
                <motion.span
                  className="font-mono text-lg font-bold text-[var(--md-sys-color-error)]"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  {timeRemaining}
                </motion.span>
                <span className="text-xs text-[var(--md-sys-color-on-error-container)]">
                  restantes
                </span>
              </div>
            )}
          </>
        );

      case 'friend_request':
        return (
          <>
            <h4 className="font-bold text-[var(--md-sys-color-on-surface)]">
              {name} veut devenir ton ami
            </h4>
            <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mt-1">
              Vous pourrez voir vos disponibilités mutuelles
            </p>
          </>
        );

      case 'group_invitation':
        const userNames = users?.map(u => u.displayName).join(', ') || '';
        return (
          <>
            <h4 className="font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
              Rejoins {userNames}
              {groupSize > 2
                ? ` et ${groupSize - 2} autre${groupSize > 3 ? 's' : ''}`
                : ''}{' '}
              pour{' '}
              {activity
                ? activity.charAt(0).toUpperCase() + activity.slice(1)
                : 'un moment'}{' '}
              <ActivityIcon
                size={18}
                className="text-[var(--md-sys-color-primary)]"
              />
            </h4>
            {locationName && (
              <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mt-1 flex items-center gap-1">
                <MapPin size={14} /> {locationName} • Activité en cours
              </p>
            )}
            {timeRemaining && (
              <div className="flex items-center gap-2 mt-2 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                <Clock size={14} />
                <span>{timeRemaining} restantes</span>
              </div>
            )}
          </>
        );

      case 'declined':
        return (
          <>
            <h4 className="font-bold text-[var(--md-sys-color-on-surface-variant)]">
              {name} a décliné ton invitation
            </h4>
            <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mt-1">
              Tu peux réessayer plus tard ou inviter quelqu'un d'autre
            </p>
          </>
        );

      case 'expired':
        return (
          <>
            <h4 className="font-bold text-[var(--md-sys-color-on-surface-variant)]">
              Invitation à {name} expirée
            </h4>
            <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mt-1">
              L'invitation n'a pas reçu de réponse dans les 10 min
            </p>
          </>
        );

      default:
        return null;
    }
  };

  // Rendu des boutons d'action
  const renderActions = () => {
    switch (type) {
      case 'invitation_received':
        return (
          <div className="flex gap-3 mt-4">
            <MD3Button
              variant="filled"
              className="flex-1"
              icon={<Check size={18} />}
              onClick={onAccept}
            >
              Accepter
            </MD3Button>
            <MD3Button
              variant="tonal"
              className="flex-1"
              icon={<X size={18} />}
              onClick={onDecline}
            >
              Décliner
            </MD3Button>
          </div>
        );

      case 'invitation_sent':
        return (
          <div className="flex gap-3 mt-4">
            <MD3Button variant="outlined" className="flex-1" onClick={onCancel}>
              Annuler l'invitation
            </MD3Button>
          </div>
        );

      case 'in_progress':
        return (
          <div className="flex gap-3 mt-4">
            <MD3Button
              variant="filled"
              className="flex-1"
              icon={<MapPin size={18} />}
              onClick={onViewOnMap}
            >
              Voir sur carte
            </MD3Button>
            <MD3Button variant="outlined" size="small" onClick={onTerminate}>
              Terminer
            </MD3Button>
          </div>
        );

      case 'ending_soon':
        return (
          <div className="flex gap-3 mt-4">
            <MD3Button
              variant="filled"
              className="flex-1 bg-[var(--md-sys-color-error)]"
              onClick={onExtend}
            >
              Prolonger +15min
            </MD3Button>
            <MD3Button
              variant="outlined"
              className="flex-1"
              onClick={onTerminate}
            >
              Terminer
            </MD3Button>
          </div>
        );

      case 'friend_request':
        return (
          <div className="flex gap-3 mt-4">
            <MD3Button
              variant="filled"
              className="flex-1"
              icon={<Check size={18} />}
              onClick={onAccept}
            >
              Accepter
            </MD3Button>
            <MD3Button
              variant="tonal"
              className="flex-1"
              icon={<X size={18} />}
              onClick={onDecline}
            >
              Ignorer
            </MD3Button>
          </div>
        );

      case 'group_invitation':
        return (
          <div className="flex gap-3 mt-4">
            <MD3Button
              variant="filled"
              className="flex-1"
              icon={<Users size={18} />}
              onClick={onJoinGroup}
            >
              Rejoindre le groupe
            </MD3Button>
            <MD3Button
              variant="tonal"
              className="flex-1"
              onClick={onViewDetails}
            >
              Voir détails
            </MD3Button>
          </div>
        );

      case 'declined':
        return (
          <div className="flex gap-3 mt-4">
            <MD3Button
              variant="tonal"
              className="flex-1"
              size="small"
              onClick={onInviteOther}
            >
              Inviter quelqu'un d'autre
            </MD3Button>
          </div>
        );

      case 'expired':
        return null; // Pas d'actions pour les invitations expirées

      default:
        return null;
    }
  };

  return (
    <MD3Card
      variant={config.variant}
      padding="default"
      className={`border-l-4 ${config.borderColor} ${config.containerClass || ''} ${config.opacity || ''}`}
      onClick={() => {}}
    >
      {/* Badge et timestamp */}
      <div className="flex items-center gap-2 mb-2">
        {config.animate ? (
          <motion.span
            className={`text-xs px-2 py-0.5 rounded-full ${config.badgeColor} text-white font-medium`}
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            {config.badgeText}
          </motion.span>
        ) : (
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${config.badgeColor} text-white font-medium`}
          >
            {config.badgeText}
            {type === 'group_invitation' && groupSize
              ? ` • ${groupSize} PERSONNES`
              : ''}
          </span>
        )}

        {type === 'in_progress' && (
          <CheckCheck
            size={16}
            className="text-[var(--md-sys-color-tertiary)]"
          />
        )}
        {type === 'friend_request' && (
          <Users size={16} className="text-cyan-500" />
        )}
        {type === 'expired' && <Clock size={14} className="text-orange-400" />}

        {createdAt && type !== 'in_progress' && type !== 'ending_soon' && (
          <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
            {formatTimeAgo(createdAt)}
          </span>
        )}
      </div>

      {/* Contenu principal */}
      <div className="flex items-start gap-4">
        {renderAvatar()}
        <div className="flex-1">{renderContent()}</div>
      </div>

      {/* Actions */}
      {renderActions()}
    </MD3Card>
  );
};

export default InvitationCard;
