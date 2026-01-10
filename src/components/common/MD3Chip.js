import { motion } from 'framer-motion';

/**
 * MD3 Chip Component - Material Design 3 Expressive
 *
 * Types:
 * - assist: Contextual actions (default)
 * - filter: Multi-select filtering
 * - input: User input representation
 * - suggestion: Quick action suggestions
 */
const MD3Chip = ({
  label,
  icon,
  trailingIcon,
  selected = false,
  disabled = false,
  onClick,
  onTrailingClick,
  type = 'assist',
  elevated = false,
  className = '',
  ...props
}) => {
  const baseStyles = `
    inline-flex items-center gap-2
    h-8 px-3 rounded-full
    text-sm font-medium
    transition-all duration-200
    focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)]
    disabled:opacity-38 disabled:cursor-not-allowed
  `;

  const getVariantStyles = () => {
    if (type === 'filter') {
      return selected
        ? `
            bg-[var(--md-sys-color-secondary-container)]
            text-[var(--md-sys-color-on-secondary-container)]
            ${elevated ? 'shadow-[var(--md-sys-elevation-level1)]' : ''}
          `
        : `
            bg-transparent border border-[var(--md-sys-color-outline)]
            text-[var(--md-sys-color-on-surface-variant)]
            hover:bg-[var(--md-sys-color-on-surface)]/8
          `;
    }

    if (type === 'suggestion') {
      return `
        bg-[var(--md-sys-color-surface-container-low)]
        text-[var(--md-sys-color-on-surface-variant)]
        border border-[var(--md-sys-color-outline-variant)]
        hover:bg-[var(--md-sys-color-surface-container)]
        ${elevated ? 'shadow-[var(--md-sys-elevation-level1)]' : ''}
      `;
    }

    if (type === 'input') {
      return `
        bg-[var(--md-sys-color-surface-container-high)]
        text-[var(--md-sys-color-on-surface-variant)]
        hover:bg-[var(--md-sys-color-surface-container-highest)]
      `;
    }

    // Assist chip (default)
    return `
      bg-[var(--md-sys-color-surface-container-low)]
      text-[var(--md-sys-color-on-surface)]
      border border-[var(--md-sys-color-outline)]
      hover:bg-[var(--md-sys-color-on-surface)]/8
      ${elevated ? 'shadow-[var(--md-sys-elevation-level1)] border-none' : ''}
    `;
  };

  return (
    <motion.button
      className={`${baseStyles} ${getVariantStyles()} ${className}`}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      {...props}
    >
      {/* Leading icon or checkmark for filter chips */}
      {type === 'filter' && selected ? (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          className="text-base"
        >
          ✓
        </motion.span>
      ) : icon ? (
        <span className="text-lg -ml-1">{icon}</span>
      ) : null}

      {/* Label */}
      <span className="whitespace-nowrap">{label}</span>

      {/* Trailing icon */}
      {trailingIcon && (
        <motion.span
          className="text-base -mr-1 cursor-pointer hover:text-[var(--md-sys-color-on-surface)]"
          onClick={e => {
            e.stopPropagation();
            onTrailingClick?.(e);
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {trailingIcon}
        </motion.span>
      )}
    </motion.button>
  );
};

export default MD3Chip;
