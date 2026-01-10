import { motion } from 'framer-motion';

/**
 * MD3 Avatar Component - Material Design 3 Expressive
 *
 * Displays user profile pictures or initials
 */
const MD3Avatar = ({
  src,
  alt,
  name,
  size = 'medium',
  variant = 'circular',
  status,
  statusColor,
  badge,
  className = '',
  onClick,
  ...props
}) => {
  const sizes = {
    small: 'w-8 h-8 text-xs',
    medium: 'w-10 h-10 text-sm',
    large: 'w-12 h-12 text-base',
    xlarge: 'w-16 h-16 text-lg',
    xxlarge: 'w-24 h-24 text-2xl',
  };

  const statusSizes = {
    small: 'w-2 h-2 -right-0 -bottom-0',
    medium: 'w-2.5 h-2.5 -right-0.5 -bottom-0.5',
    large: 'w-3 h-3 -right-0.5 -bottom-0.5',
    xlarge: 'w-4 h-4 -right-1 -bottom-1',
    xxlarge: 'w-5 h-5 -right-1 -bottom-1',
  };

  const statusColors = {
    online: 'bg-[var(--md-sys-color-success)]',
    offline: 'bg-[var(--md-sys-color-outline)]',
    busy: 'bg-[var(--md-sys-color-error)]',
    away: 'bg-[var(--md-sys-color-warning)]',
    custom: statusColor || 'bg-[var(--md-sys-color-primary)]',
  };

  const variants = {
    circular: 'rounded-full',
    rounded: 'rounded-2xl',
    square: 'rounded-lg',
  };

  // Generate initials from name
  const getInitials = name => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Generate consistent color from name
  const getColorFromName = name => {
    if (!name) return 'var(--md-sys-color-primary)';
    const colors = [
      'var(--md-sys-color-primary)',
      'var(--md-sys-color-secondary)',
      'var(--md-sys-color-tertiary)',
      '#7C4DFF', // Deep Purple
      '#00BFA5', // Teal
      '#FF6D00', // Orange
      '#00B8D4', // Cyan
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const Component = onClick ? motion.button : motion.div;
  const interactionProps = onClick
    ? {
        whileHover: { scale: 1.05 },
        whileTap: { scale: 0.95 },
        onClick,
      }
    : {};

  return (
    <Component
      className={`
        relative inline-flex items-center justify-center
        ${sizes[size]}
        ${variants[variant]}
        ${onClick ? 'cursor-pointer' : ''}
        overflow-hidden
        shrink-0
        ${className}
      `}
      style={!src ? { backgroundColor: getColorFromName(name) } : {}}
      {...interactionProps}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className={`w-full h-full object-cover ${variants[variant]}`}
          onError={e => {
            const target = /** @type {HTMLImageElement} */ (e.target);
            target.style.display = 'none';
            if (target.parentElement) {
              target.parentElement.dataset.showInitials = 'true';
            }
          }}
        />
      ) : (
        <span className="font-semibold text-white">{getInitials(name)}</span>
      )}

      {/* Status indicator */}
      {status && (
        <motion.span
          className={`
            absolute
            ${statusSizes[size]}
            ${statusColors[status]}
            rounded-full
            border-2 border-[var(--md-sys-color-surface)]
          `}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        />
      )}

      {/* Badge */}
      {badge !== undefined && (
        <motion.span
          className={`
            absolute -top-1 -right-1
            min-w-[18px] h-[18px]
            flex items-center justify-center
            px-1
            bg-[var(--md-sys-color-error)]
            text-[var(--md-sys-color-on-error)]
            text-[10px] font-bold
            rounded-full
          `}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        >
          {badge}
        </motion.span>
      )}
    </Component>
  );
};

// Avatar Group component
MD3Avatar.Group = ({ children, max = 4, size = 'medium', className = '' }) => {
  const childArray = Array.isArray(children) ? children : [children];
  const visibleChildren = childArray.slice(0, max);
  const remainingCount = childArray.length - max;

  const overlaps = {
    small: '-ml-2',
    medium: '-ml-3',
    large: '-ml-4',
    xlarge: '-ml-5',
    xxlarge: '-ml-6',
  };

  return (
    <div className={`flex items-center ${className}`}>
      {visibleChildren.map((child, index) => (
        <div
          key={index}
          className={`${index > 0 ? overlaps[size] : ''} ring-2 ring-[var(--md-sys-color-surface)] rounded-full`}
          style={{ zIndex: visibleChildren.length - index }}
        >
          {child}
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className={`
            ${overlaps[size]}
            flex items-center justify-center
            ${
              size === 'small'
                ? 'w-8 h-8 text-xs'
                : size === 'large'
                  ? 'w-12 h-12 text-sm'
                  : 'w-10 h-10 text-xs'
            }
            rounded-full
            bg-[var(--md-sys-color-surface-container-highest)]
            text-[var(--md-sys-color-on-surface-variant)]
            font-semibold
            ring-2 ring-[var(--md-sys-color-surface)]
          `}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

export default MD3Avatar;
