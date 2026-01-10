import { motion } from 'framer-motion';

/**
 * MD3 Card Component - Material Design 3 Expressive
 *
 * Variants:
 * - elevated: Surface with elevation (default)
 * - filled: Surface container color
 * - outlined: Surface with outline border
 */
const MD3Card = ({
  children,
  variant = 'elevated',
  className = '',
  onClick,
  padding = 'default',
  animate = true,
  ...props
}) => {
  const baseStyles = `
    rounded-[24px] overflow-hidden
    transition-all duration-200
  `;

  const variants = {
    elevated: `
      bg-[var(--md-sys-color-surface-container-low)]
      shadow-[var(--md-sys-elevation-level1)]
      hover:shadow-[var(--md-sys-elevation-level2)]
    `,
    filled: `
      bg-[var(--md-sys-color-surface-container-highest)]
    `,
    outlined: `
      bg-[var(--md-sys-color-surface)]
      border border-[var(--md-sys-color-outline-variant)]
    `,
  };

  const paddings = {
    none: '',
    small: 'p-3',
    default: 'p-5',
    large: 'p-6',
  };

  const Component = animate ? motion.div : 'div';
  const animationProps = animate
    ? {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3, ease: [0.05, 0.7, 0.1, 1] },
        whileHover: onClick ? { scale: 1.01 } : {},
        whileTap: onClick ? { scale: 0.99 } : {},
      }
    : {};

  return (
    <Component
      className={`${baseStyles} ${variants[variant]} ${paddings[padding]} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      {...animationProps}
      {...props}
    >
      {children}
    </Component>
  );
};

export default MD3Card;
