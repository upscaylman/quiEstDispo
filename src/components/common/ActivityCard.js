import { motion } from 'framer-motion';

/**
 * ActivityCard (MD3 Choice Chip / Custom Card)
 * Used for selecting an activity.
 *
 * Specs:
 * - Container: Surface Container Highest (light) / Surface Container High (dark)
 * - Shape: Large (16px) or XL (28px)
 * - State: Hover/Focus/Pressed layers handled by interaction
 * - Icon: 24px
 * - Background: Activity-specific images
 */

// Images d'activités (Unsplash - libres de droits)
const ACTIVITY_IMAGES = {
  coffee:
    'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400&h=400&fit=crop&auto=format',
  lunch:
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop&auto=format',
  drinks:
    'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&h=400&fit=crop&auto=format',
  chill:
    'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=400&h=400&fit=crop&auto=format',
  clubbing:
    'https://images.unsplash.com/photo-1545128485-c400e7702796?w=400&h=400&fit=crop&auto=format',
  cinema:
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=400&fit=crop&auto=format',
};

// Couleurs d'overlay par activité pour meilleure lisibilité
const ACTIVITY_OVERLAYS = {
  coffee: 'from-amber-900/70 via-amber-800/50 to-amber-700/30',
  lunch: 'from-green-900/70 via-green-800/50 to-green-700/30',
  drinks: 'from-purple-900/70 via-purple-800/50 to-purple-700/30',
  chill: 'from-blue-900/70 via-blue-800/50 to-blue-700/30',
  clubbing: 'from-pink-900/70 via-pink-800/50 to-pink-700/30',
  cinema: 'from-indigo-900/70 via-indigo-800/50 to-indigo-700/30',
};

const ActivityCard = ({
  id,
  label,
  icon: Icon,
  onClick,
  index = 0,
  darkMode,
}) => {
  const backgroundImage = ACTIVITY_IMAGES[id] || ACTIVITY_IMAGES.chill;
  const overlayGradient = ACTIVITY_OVERLAYS[id] || ACTIVITY_OVERLAYS.chill;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="relative overflow-hidden aspect-square rounded-[24px] cursor-pointer transition-all duration-200"
      style={{
        boxShadow: 'var(--md-sys-elevation-2)',
      }}
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
        style={{
          backgroundImage: `url(${backgroundImage})`,
        }}
      />

      {/* Gradient Overlay for text readability */}
      <div className={`absolute inset-0 bg-gradient-to-t ${overlayGradient}`} />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center gap-2 p-4">
        {/* Icon Container */}
        <div
          className="p-3 rounded-full backdrop-blur-sm"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
          }}
        >
          <Icon
            size={28}
            strokeWidth={2}
            className="text-white drop-shadow-lg"
          />
        </div>

        {/* Label */}
        <span
          className="text-sm font-semibold tracking-wide text-white drop-shadow-lg"
          style={{
            fontFamily: 'Roboto, sans-serif',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          {label}
        </span>
      </div>

      {/* Hover effect */}
      <div className="absolute inset-0 bg-white opacity-0 hover:opacity-10 transition-opacity duration-200" />
    </motion.button>
  );
};

export default ActivityCard;
