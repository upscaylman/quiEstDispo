import { motion } from 'framer-motion';

/**
 * MD3 FAB (Floating Action Button) Component - Material Design 3 Expressive
 *
 * Types:
 * - fab: Standard FAB (default)
 * - small-fab: Small FAB
 * - large-fab: Large FAB
 * - extended: Extended FAB with label
 */
const MD3FAB = ({
  icon,
  label,
  onClick,
  type = 'fab',
  variant = 'primary',
  position = 'bottom-right',
  disabled = false,
  lowered = false,
  className = '',
  ...props
}) => {
  const sizes = {
    'small-fab': 'w-10 h-10 rounded-xl text-lg',
    fab: 'w-14 h-14 rounded-2xl text-2xl',
    'large-fab': 'w-24 h-24 rounded-[28px] text-4xl',
    extended: 'h-14 px-5 rounded-2xl text-xl',
  };

  const variants = {
    primary: `
      bg-[var(--md-sys-color-primary-container)]
      text-[var(--md-sys-color-on-primary-container)]
      hover:shadow-[var(--md-sys-elevation-level3)]
    `,
    secondary: `
      bg-[var(--md-sys-color-secondary-container)]
      text-[var(--md-sys-color-on-secondary-container)]
      hover:shadow-[var(--md-sys-elevation-level3)]
    `,
    tertiary: `
      bg-[var(--md-sys-color-tertiary-container)]
      text-[var(--md-sys-color-on-tertiary-container)]
      hover:shadow-[var(--md-sys-elevation-level3)]
    `,
    surface: `
      bg-[var(--md-sys-color-surface-container-high)]
      text-[var(--md-sys-color-primary)]
      hover:shadow-[var(--md-sys-elevation-level3)]
    `,
  };

  const positions = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'bottom-center': 'fixed bottom-6 left-1/2 -translate-x-1/2',
    'top-right': 'fixed top-6 right-6',
    relative: 'relative',
  };

  return (
    <motion.button
      className={`
        inline-flex items-center justify-center gap-3
        ${sizes[type]}
        ${variants[variant]}
        ${position !== 'relative' ? positions[position] : ''}
        ${lowered ? 'shadow-[var(--md-sys-elevation-level1)]' : 'shadow-[var(--md-sys-elevation-level3)]'}
        transition-all duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)]
        disabled:opacity-38 disabled:cursor-not-allowed
        z-40
        ${className}
      `}
      onClick={onClick}
      disabled={disabled}
      whileHover={{
        scale: disabled ? 1 : 1.05,
        y: disabled ? 0 : -2,
      }}
      whileTap={{
        scale: disabled ? 1 : 0.95,
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: 1,
        transition: {
          type: 'spring',
          stiffness: 400,
          damping: 20,
          delay: 0.1,
        },
      }}
      exit={{
        scale: 0,
        opacity: 0,
        transition: { duration: 0.2 },
      }}
      {...props}
    >
      {icon}
      {type === 'extended' && label && (
        <span className="text-base font-semibold whitespace-nowrap">
          {label}
        </span>
      )}
    </motion.button>
  );
};

export default MD3FAB;
