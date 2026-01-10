import { motion } from 'framer-motion';
import { UserMinus } from 'lucide-react';
import StatusIndicator, { getFriendDisplayStatus } from './StatusIndicator';

/**
 * FriendListItem (MD3 List Item)
 * Used for displaying friends in a list.
 *
 * Specs:
 * - Container: Surface
 * - Min Height: 56px (One line), 72px (Two and three lines)
 * - Leading: Avatar (40px)
 * - Headline: Body Large (16px) or Medium
 * - Supporting Text: Body Medium (14px)
 * - Trailing: Icon Button (24px/48px target)
 */
const FriendListItem = ({ friend, status, onRemove, darkMode }) => {
  // Déterminer le statut d'affichage unifié
  const displayStatus = getFriendDisplayStatus(friend, status);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.01 }}
      className={`
        relative flex items-center justify-between
        py-3 px-4 mb-2 rounded-xl
        transition-colors duration-200
        ${darkMode ? 'bg-surface-container-low hover:bg-surface-container' : 'bg-surface hover:bg-surface-container'}
        shadow-sm hover:shadow-md
      `}
      style={{
        backgroundColor: darkMode
          ? 'var(--md-sys-color-surface)'
          : 'var(--md-sys-color-surface)',
        borderColor: darkMode
          ? 'var(--md-sys-color-outline-variant)'
          : 'var(--md-sys-color-outline-variant)',
        borderWidth: friendsListBorderWidth(darkMode), // Optional border depending on card vs list style
      }}
    >
      {/* Leading: Avatar */}
      <div className="relative mr-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden"
          style={{
            backgroundColor: 'var(--md-sys-color-primary-container)',
            color: 'var(--md-sys-color-on-primary-container)',
          }}
        >
          {friend.avatar &&
          (friend.avatar.startsWith('http') ||
            friend.avatar.startsWith('data:')) ? (
            <img
              src={friend.avatar}
              alt={friend.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xl font-medium">
              {friend.avatar || friend.name?.charAt(0) || '?'}
            </span>
          )}
        </div>

        {/* Indicateur de statut unifié sur l'avatar */}
        <div className="absolute -bottom-0.5 -right-0.5">
          <StatusIndicator
            status={displayStatus}
            size="sm"
            showRing={true}
            animate={[
              'invitation_sent',
              'invitation_received',
              'sharing',
            ].includes(displayStatus)}
          />
        </div>
      </div>

      {/* Content: Headline & Supporting Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3
            className="text-base font-medium truncate"
            style={{ color: 'var(--md-sys-color-on-surface)' }}
          >
            {friend.name}
          </h3>
        </div>

        <div className="flex items-center gap-2 mt-0.5">
          {/* Statut de disponibilité (texte seulement) */}
          <span
            className="text-xs font-medium"
            style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
          >
            {displayStatus.includes('busy') ? 'Occupé' : 'Disponible'}
          </span>
        </div>
      </div>

      {/* Trailing: Actions */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onRemove(friend.id, friend.name)}
        className="ml-2 p-3 rounded-full hover:bg-opacity-10 transition-colors"
        style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
        aria-label={`Supprimer ${friend.name}`}
      >
        <UserMinus size={20} />
      </motion.button>
    </motion.div>
  );
};

// Helper for border (optional, removing for clean card look usually)
const friendsListBorderWidth = dark => '0px';

export default FriendListItem;
