import { motion } from 'framer-motion';

/**
 * MD3 Button - Material Design 3 Expressive
 *
 * Variants:
 * - filled: High emphasis (Primary action)
 * - tonal: Medium emphasis (Secondary action)
 * - outlined: Low emphasis (Tertiary action)
 * - text: Lowest emphasis (Text only)
 * - error: Destructive action
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {React.MouseEventHandler<HTMLButtonElement>} [props.onClick]
 * @param {'filled'|'tonal'|'outlined'|'text'|'error'} [props.variant='filled']
 * @param {React.ReactNode} [props.icon]
 * @param {boolean} [props.disabled=false]
 * @param {string} [props.className='']
 * @param {boolean} [props.loading=false]
 * @param {'button'|'submit'|'reset'} [props.type='button']
 * @param {boolean} [props.fullWidth=false]
 * @param {'small'|'medium'|'large'} [props.size='medium']
 */
const MD3Button = ({
  children,
  onClick,
  variant = 'filled',
  icon = null,
  disabled = false,
  className = '',
  loading = false,
  type = /** @type {'button'|'submit'|'reset'} */ ('button'),
  fullWidth = false,
  size = 'medium',
}) => {
  const sizes = {
    small: 'h-9 px-4 text-sm gap-1.5',
    medium: 'h-11 px-6 text-sm gap-2',
    large: 'h-14 px-8 text-base gap-2',
  };

  const baseStyles = `
    relative overflow-hidden 
    ${sizes[size] || sizes.medium}
    ${fullWidth ? 'w-full' : ''}
    rounded-full flex items-center justify-center 
    font-semibold
    transition-all duration-200 
    disabled:opacity-50 disabled:cursor-not-allowed 
    active:scale-[0.98]
    focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)] focus-visible:ring-offset-2
  `;

  const variants = {
    filled: `
      bg-[var(--md-sys-color-primary)] 
      text-[var(--md-sys-color-on-primary)] 
      hover:shadow-[var(--md-sys-elevation-level1)]
      active:shadow-none
    `,
    tonal: `
      bg-[var(--md-sys-color-secondary-container)] 
      text-[var(--md-sys-color-on-secondary-container)] 
      hover:bg-[var(--md-sys-color-secondary-container)]/80
    `,
    outlined: `
      border-2 border-[var(--md-sys-color-outline)] 
      text-[var(--md-sys-color-primary)] 
      hover:bg-[var(--md-sys-color-primary)]/8
    `,
    text: `
      text-[var(--md-sys-color-primary)] 
      hover:bg-[var(--md-sys-color-primary)]/8 
      px-3
    `,
    error: `
      bg-[var(--md-sys-color-error)] 
      text-[var(--md-sys-color-on-error)] 
      hover:bg-[var(--md-sys-color-error)]/90
    `,
  };

  const variantStyles = variants[variant] || variants.filled;

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variantStyles} ${className}`}
    >
      {loading ? (
        <motion.div
          className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
        />
      ) : (
        <>
          {icon && <span className="shrink-0">{icon}</span>}
          {children}
        </>
      )}

      {/* Ripple effect overlay */}
      <div className="absolute inset-0 bg-current opacity-0 hover:opacity-[0.08] transition-opacity pointer-events-none rounded-full" />
    </motion.button>
  );
};

export default MD3Button;
