import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect } from 'react';
import MD3Button from './MD3Button';

/**
 * MD3 Dialog Component - Material Design 3 Expressive
 *
 * Types:
 * - basic: Simple dialog with title and content
 * - fullscreen: Full-screen dialog
 * - alert: Alert dialog for critical actions
 */
const MD3Dialog = ({
  open,
  onClose,
  title,
  children,
  actions,
  type = 'basic',
  icon,
  dividers = false,
  dismissible = true,
  className = '',
  ...props
}) => {
  // Handle escape key
  const handleEscape = useCallback(
    e => {
      if (e.key === 'Escape' && dismissible) {
        onClose?.();
      }
    },
    [dismissible, onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [open, handleEscape]);

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const dialogVariants = {
    hidden: {
      opacity: 0,
      scale: 0.9,
      y: 20,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 30,
        mass: 0.8,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 10,
      transition: {
        duration: 0.2,
        ease: [0.3, 0, 1, 1],
      },
    },
  };

  const fullscreenVariants = {
    hidden: {
      opacity: 0,
      y: '100%',
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      },
    },
    exit: {
      opacity: 0,
      y: '100%',
      transition: {
        duration: 0.25,
        ease: [0.3, 0, 1, 1],
      },
    },
  };

  if (type === 'fullscreen') {
    return (
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 bg-[var(--md-sys-color-surface)]"
            variants={fullscreenVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            {...props}
          >
            {/* Header */}
            <div className="flex items-center h-16 px-4 border-b border-[var(--md-sys-color-outline-variant)]">
              <motion.button
                className="w-12 h-12 -ml-2 rounded-full flex items-center justify-center text-[var(--md-sys-color-on-surface)]"
                onClick={onClose}
                whileTap={{ scale: 0.9 }}
              >
                <span className="text-2xl">✕</span>
              </motion.button>
              <h2 className="ml-2 text-lg font-medium text-[var(--md-sys-color-on-surface)]">
                {title}
              </h2>
              {actions && <div className="ml-auto">{actions}</div>}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={dismissible ? onClose : undefined}
            transition={{ duration: 0.2 }}
          />

          {/* Dialog */}
          <motion.div
            className={`
              relative w-full max-w-md
              bg-[var(--md-sys-color-surface-container-high)]
              rounded-[28px]
              shadow-[var(--md-sys-elevation-level3)]
              ${className}
            `}
            variants={dialogVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            {...props}
          >
            {/* Icon (for alert dialogs) */}
            {icon && (
              <div className="flex justify-center pt-6 pb-2">
                <span className="text-3xl text-[var(--md-sys-color-secondary)]">
                  {icon}
                </span>
              </div>
            )}

            {/* Title */}
            {title && (
              <h2
                id="dialog-title"
                className={`
                  px-6 pt-6 pb-4
                  text-xl font-semibold
                  text-[var(--md-sys-color-on-surface)]
                  ${icon ? 'text-center' : ''}
                `}
              >
                {title}
              </h2>
            )}

            {/* Content */}
            <div
              className={`
                px-6 pb-6
                text-[var(--md-sys-color-on-surface-variant)]
                ${dividers ? 'border-t border-b border-[var(--md-sys-color-outline-variant)] py-4' : ''}
                ${icon ? 'text-center' : ''}
              `}
            >
              {children}
            </div>

            {/* Actions */}
            {actions && (
              <div className="flex justify-end gap-2 px-6 pb-6">{actions}</div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Preset for confirmation dialogs
MD3Dialog.Confirm = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  destructive = false,
  ...props
}) => (
  <MD3Dialog
    open={open}
    onClose={onClose}
    title={title}
    type="alert"
    icon={null}
    actions={
      <>
        <MD3Button variant="text" onClick={onClose} icon={null}>
          {cancelLabel}
        </MD3Button>
        <MD3Button
          variant="filled"
          onClick={() => {
            onConfirm?.();
            onClose?.();
          }}
          icon={null}
          className={
            destructive
              ? 'bg-[var(--md-sys-color-error)] text-[var(--md-sys-color-on-error)]'
              : ''
          }
        >
          {confirmLabel}
        </MD3Button>
      </>
    }
    {...props}
  >
    {message}
  </MD3Dialog>
);

export default MD3Dialog;
