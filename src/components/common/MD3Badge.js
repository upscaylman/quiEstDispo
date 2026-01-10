import { motion } from 'framer-motion';

/**
 * MD3 Badge Component - Material Design 3 Expressive
 *
 * Types:
 * - small: Dot badge
 * - large: Number/text badge
 */
const MD3Badge = ({
  content,
  type = 'large',
  variant = 'error',
  max = 99,
  showZero = false,
  children,
  position = 'top-right',
  className = '',
  ...props
}) => {
  const variants = {
    error: 'bg-[var(--md-sys-color-error)] text-[var(--md-sys-color-on-error)]',
    primary:
      'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]',
    secondary:
      'bg-[var(--md-sys-color-secondary)] text-[var(--md-sys-color-on-secondary)]',
    success:
      'bg-[var(--md-sys-color-success)] text-[var(--md-sys-color-on-success)]',
  };

  const positions = {
    'top-right': '-top-1 -right-1',
    'top-left': '-top-1 -left-1',
    'bottom-right': '-bottom-1 -right-1',
    'bottom-left': '-bottom-1 -left-1',
  };

  // Calculate display content
  const displayContent = () => {
    if (type === 'small') return null;
    if (typeof content === 'number') {
      if (content === 0 && !showZero) return null;
      return content > max ? `${max}+` : content;
    }
    return content;
  };

  const badgeContent = displayContent();
  const shouldShow = type === 'small' || badgeContent !== null;

  if (!shouldShow) {
    return children || null;
  }

  // Standalone badge (no children)
  if (!children) {
    return (
      <motion.span
        className={`
          inline-flex items-center justify-center
          ${type === 'small' ? 'w-2 h-2' : 'min-w-[18px] h-[18px] px-1'}
          ${variants[variant]}
          rounded-full
          text-[11px] font-bold
          ${className}
        `}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        {...props}
      >
        {badgeContent}
      </motion.span>
    );
  }

  // Badge with children (overlay)
  return (
    <div className={`relative inline-flex ${className}`} {...props}>
      {children}
      <motion.span
        className={`
          absolute ${positions[position]}
          flex items-center justify-center
          ${type === 'small' ? 'w-2.5 h-2.5' : 'min-w-[18px] h-[18px] px-1'}
          ${variants[variant]}
          rounded-full
          text-[11px] font-bold
          border-2 border-[var(--md-sys-color-surface)]
        `}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      >
        {badgeContent}
      </motion.span>
    </div>
  );
};

export default MD3Badge;
