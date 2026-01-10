import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';

/**
 * MD3 Snackbar Component - Material Design 3 Expressive
 *
 * Position: Bottom center by default
 * Duration: Auto-dismiss after duration (default 4s)
 */
const MD3Snackbar = ({
  open,
  onClose,
  message,
  action,
  onAction,
  duration = 4000,
  icon,
  variant = 'default',
  position = 'bottom-center',
  ...props
}) => {
  useEffect(() => {
    if (open && duration > 0) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [open, duration, onClose]);

  const positions = {
    'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2',
    'bottom-left': 'bottom-6 left-6',
    'bottom-right': 'bottom-6 right-6',
    'top-center': 'top-6 left-1/2 -translate-x-1/2',
  };

  const variants = {
    default: `
      bg-[var(--md-sys-color-inverse-surface)]
      text-[var(--md-sys-color-inverse-on-surface)]
    `,
    success: `
      bg-[var(--md-sys-color-success)]
      text-[var(--md-sys-color-on-success)]
    `,
    error: `
      bg-[var(--md-sys-color-error)]
      text-[var(--md-sys-color-on-error)]
    `,
    warning: `
      bg-[var(--md-sys-color-warning)]
      text-[var(--md-sys-color-on-warning)]
    `,
  };

  const snackbarVariants = {
    hidden: {
      opacity: 0,
      y: position.includes('top') ? -20 : 20,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 25,
      },
    },
    exit: {
      opacity: 0,
      y: position.includes('top') ? -20 : 20,
      scale: 0.95,
      transition: {
        duration: 0.2,
        ease: [0.3, 0, 1, 1],
      },
    },
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={`
            fixed z-[60] ${positions[position]}
            flex items-center gap-3
            min-w-[300px] max-w-[500px]
            px-4 py-3
            ${variants[variant]}
            rounded-xl
            shadow-[var(--md-sys-elevation-level3)]
          `}
          variants={snackbarVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          role="alert"
          {...props}
        >
          {/* Icon */}
          {icon && <span className="text-xl shrink-0">{icon}</span>}

          {/* Message */}
          <p className="flex-1 text-sm font-medium">{message}</p>

          {/* Action */}
          {action && (
            <motion.button
              className={`
                px-3 py-1.5 -mr-1
                text-sm font-semibold
                ${
                  variant === 'default'
                    ? 'text-[var(--md-sys-color-inverse-primary)]'
                    : 'text-inherit opacity-90 hover:opacity-100'
                }
                rounded-full
                hover:bg-white/10
                transition-colors
              `}
              onClick={() => {
                onAction?.();
                onClose?.();
              }}
              whileTap={{ scale: 0.95 }}
            >
              {action}
            </motion.button>
          )}

          {/* Close button (if no action and dismissible) */}
          {!action && (
            <motion.button
              className="p-1 -mr-1 rounded-full hover:bg-white/10 transition-colors"
              onClick={onClose}
              whileTap={{ scale: 0.9 }}
              aria-label="Fermer"
            >
              <span className="text-lg opacity-70">✕</span>
            </motion.button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MD3Snackbar;
