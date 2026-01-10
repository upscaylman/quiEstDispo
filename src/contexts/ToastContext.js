import { AnimatePresence, motion } from 'framer-motion';
import { createContext, useCallback, useContext, useState } from 'react';

// Contexte pour les toasts
const ToastContext = createContext(null);

// Types de toast disponibles
const TOAST_VARIANTS = {
  default: `
    bg-[var(--md-sys-color-inverse-surface)]
    text-[var(--md-sys-color-inverse-on-surface)]
  `,
  success: `
    bg-emerald-600
    text-white
  `,
  error: `
    bg-[var(--md-sys-color-error)]
    text-[var(--md-sys-color-on-error)]
  `,
  warning: `
    bg-amber-500
    text-white
  `,
  info: `
    bg-[var(--md-sys-color-primary)]
    text-[var(--md-sys-color-on-primary)]
  `,
};

// Icônes par défaut pour chaque type
const TOAST_ICONS = {
  default: '💬',
  success: '✓',
  error: '✕',
  warning: '⚠️',
  info: 'ℹ️',
};

/**
 * Provider pour le système de Toast global
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // Ajouter un toast
  const showToast = useCallback(options => {
    const {
      message,
      variant = 'default',
      duration = 4000,
      icon = null,
      action = null,
      onAction = null,
    } = options;

    const id = Date.now() + Math.random();

    setToasts(prev => [
      ...prev,
      {
        id,
        message,
        variant,
        duration,
        icon: icon || TOAST_ICONS[variant] || TOAST_ICONS.default,
        action,
        onAction,
      },
    ]);

    // Auto-dismiss après la durée
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  // Supprimer un toast
  const removeToast = useCallback(id => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Raccourcis pour les différents types
  const toast = {
    show: showToast,
    success: (message, options = {}) =>
      showToast({ message, variant: 'success', ...options }),
    error: (message, options = {}) =>
      showToast({ message, variant: 'error', duration: 5000, ...options }),
    warning: (message, options = {}) =>
      showToast({ message, variant: 'warning', ...options }),
    info: (message, options = {}) =>
      showToast({ message, variant: 'info', ...options }),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* Conteneur des toasts */}
      <div className="fixed bottom-20 left-0 right-0 z-[100] flex flex-col items-center gap-2 pointer-events-none px-4">
        <AnimatePresence mode="popLayout">
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              className={`
                pointer-events-auto
                flex items-center gap-3
                min-w-[280px] max-w-[90vw]
                px-4 py-3
                ${TOAST_VARIANTS[toast.variant] || TOAST_VARIANTS.default}
                rounded-2xl
                shadow-lg
              `}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 25,
              }}
              layout
            >
              {/* Icône */}
              {toast.icon && (
                <span className="text-lg shrink-0">{toast.icon}</span>
              )}

              {/* Message */}
              <p className="flex-1 text-sm font-medium">{toast.message}</p>

              {/* Action */}
              {toast.action && (
                <motion.button
                  className="px-3 py-1 text-sm font-semibold rounded-full hover:bg-white/20 transition-colors"
                  onClick={() => {
                    toast.onAction?.();
                    removeToast(toast.id);
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  {toast.action}
                </motion.button>
              )}

              {/* Bouton fermer */}
              {!toast.action && (
                <motion.button
                  className="p-1 rounded-full hover:bg-white/20 transition-colors opacity-70 hover:opacity-100"
                  onClick={() => removeToast(toast.id)}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Fermer"
                >
                  <span className="text-sm">✕</span>
                </motion.button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

/**
 * Hook pour utiliser les toasts
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast doit être utilisé dans un ToastProvider');
  }
  return context;
};

export default ToastContext;
