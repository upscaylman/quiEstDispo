import { motion } from 'framer-motion';
import { isValidElement } from 'react';

/**
 * MD3 IconButton Component - Material Design 3 Expressive
 *
 * Variants:
 * - standard: No container (default)
 * - filled: Primary color background
 * - filled-tonal: Secondary container background
 * - outlined: Outline border
 */
const MD3IconButton = ({
  icon,
  onClick,
  variant = 'standard',
  size = 'medium',
  disabled = false,
  selected = false,
  badge,
  className = '',
  ariaLabel,
  ...props
}) => {
  const baseStyles = `
    relative inline-flex items-center justify-center
    rounded-full transition-all duration-200
    focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)]
    disabled:opacity-38 disabled:cursor-not-allowed
  `;

  const sizes = {
    small: 'w-10 h-10 text-lg',
    medium: 'w-12 h-12 text-xl',
    large: 'w-14 h-14 text-2xl',
  };

  const variants = {
    standard: `
      text-[var(--md-sys-color-on-surface-variant)]
      hover:bg-[var(--md-sys-color-on-surface-variant)]/8
      active:bg-[var(--md-sys-color-on-surface-variant)]/12
      ${selected ? 'text-[var(--md-sys-color-primary)]' : ''}
    `,
    filled: `
      bg-[var(--md-sys-color-primary)]
      text-[var(--md-sys-color-on-primary)]
      hover:shadow-[var(--md-sys-elevation-level1)]
      active:shadow-none
      ${selected ? 'bg-[var(--md-sys-color-primary)]' : ''}
    `,
    'filled-tonal': `
      bg-[var(--md-sys-color-secondary-container)]
      text-[var(--md-sys-color-on-secondary-container)]
      hover:shadow-[var(--md-sys-elevation-level1)]
      active:shadow-none
      ${selected ? 'bg-[var(--md-sys-color-secondary-container)]' : ''}
    `,
    outlined: `
      border border-[var(--md-sys-color-outline)]
      text-[var(--md-sys-color-on-surface-variant)]
      hover:bg-[var(--md-sys-color-on-surface)]/8
      active:bg-[var(--md-sys-color-on-surface)]/12
      ${selected ? 'border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-primary)]' : ''}
    `,
  };

  return (
    <motion.button
      className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      {...props}
    >
      {/* Render icon: support React elements, components, and forwardRef components */}
      {isValidElement(icon)
        ? icon
        : typeof icon === 'function' || (icon && icon.$$typeof)
          ? (() => {
              const Icon = icon;
              return <Icon size={24} />;
            })()
          : icon}

      {/* Badge */}
      {badge !== undefined && (
        <motion.span
          className={`
            absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px]
            flex items-center justify-center
            ${badge === true ? 'w-3 h-3' : 'px-1'}
            bg-[var(--md-sys-color-error)]
            text-[var(--md-sys-color-on-error)]
            text-[11px] font-medium
            rounded-full
          `}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        >
          {badge !== true && badge}
        </motion.span>
      )}
    </motion.button>
  );
};

export default MD3IconButton;
