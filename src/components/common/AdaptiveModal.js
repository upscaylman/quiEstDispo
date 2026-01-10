import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import { X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

/**
 * AdaptiveModal - Composant modal adaptatif MD3
 *
 * Affiche un bottom sheet sur mobile/tablette et un popup centré sur desktop.
 * Supporte le drag-to-dismiss sur mobile.
 *
 * Props:
 * - isOpen: boolean - État d'ouverture
 * - onClose: () => void - Callback de fermeture
 * - title: string - Titre du modal
 * - subtitle?: string - Sous-titre optionnel
 * - icon?: ReactNode - Icône à côté du titre
 * - children: ReactNode - Contenu du modal
 * - footer?: ReactNode - Pied de page optionnel avec boutons
 * - showCloseButton?: boolean - Afficher le bouton X (default: true)
 * - maxWidth?: string - Largeur max pour desktop (default: 'max-w-lg')
 * - mobileFullHeight?: boolean - Pleine hauteur sur mobile (default: false)
 * - disableDragToClose?: boolean - Désactiver le drag-to-dismiss (default: false)
 */

// Breakpoint pour mobile/tablette (correspond à md: de Tailwind)
const MOBILE_BREAKPOINT = 768;

// Hook pour détecter si on est sur mobile
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth < MOBILE_BREAKPOINT;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
};

// Export du hook pour réutilisation
export { useIsMobile };

const AdaptiveModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  showCloseButton = true,
  maxWidth = 'max-w-lg',
  mobileFullHeight = false,
  disableDragToClose = false,
}) => {
  const isMobile = useIsMobile();
  const dragControls = useDragControls();
  const [dragY, setDragY] = useState(0);

  // Fermer avec Escape
  useEffect(() => {
    const handleEscape = e => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Bloquer le scroll du body quand ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleBackdropClick = useCallback(
    e => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  const handleDragEnd = useCallback(
    (_, info) => {
      // Si on a tiré vers le bas de plus de 100px, fermer
      if (info.offset.y > 100) {
        onClose();
      }
      setDragY(0);
    },
    [onClose]
  );

  // Animations pour le bottom sheet (mobile)
  const bottomSheetVariants = {
    hidden: {
      y: '100%',
      opacity: 0,
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        damping: 30,
        stiffness: 300,
      },
    },
    exit: {
      y: '100%',
      opacity: 0,
      transition: {
        duration: 0.2,
        ease: 'easeIn',
      },
    },
  };

  // Animations pour le popup centré (desktop)
  const popupVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: 10,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 300,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 10,
      transition: {
        duration: 0.15,
      },
    },
  };

  // Animation du backdrop
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={handleBackdropClick}
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
          }}
        >
          {/* Version Mobile: Bottom Sheet */}
          {isMobile ? (
            <motion.div
              className={`
                w-full bg-[var(--md-sys-color-surface-container-high)]
                rounded-t-[28px] shadow-2xl
                flex flex-col
                ${mobileFullHeight ? 'h-[90vh]' : 'max-h-[90vh]'}
              `}
              variants={bottomSheetVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              drag={disableDragToClose ? false : 'y'}
              dragControls={dragControls}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={handleDragEnd}
              onClick={e => e.stopPropagation()}
              style={{ y: dragY }}
            >
              {/* Handle de drag */}
              {!disableDragToClose && (
                <div
                  className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
                  onPointerDown={e => dragControls.start(e)}
                >
                  <div className="w-10 h-1 bg-[var(--md-sys-color-on-surface-variant)] opacity-40 rounded-full" />
                </div>
              )}

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--md-sys-color-outline-variant)]/30">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {icon && <div className="flex-shrink-0">{icon}</div>}
                  <div className="min-w-0">
                    <h2 className="text-xl font-semibold text-[var(--md-sys-color-on-surface)] truncate">
                      {title}
                    </h2>
                    {subtitle && (
                      <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] truncate">
                        {subtitle}
                      </p>
                    )}
                  </div>
                </div>
                {showCloseButton && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-highest)] transition-colors flex-shrink-0 ml-2"
                  >
                    <X
                      size={20}
                      className="text-[var(--md-sys-color-on-surface-variant)]"
                    />
                  </motion.button>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <div className="flex-shrink-0 border-t border-[var(--md-sys-color-outline-variant)]/30 safe-area-bottom">
                  {footer}
                </div>
              )}
            </motion.div>
          ) : (
            /* Version Desktop: Popup centré */
            <motion.div
              className={`
                w-full ${maxWidth} mx-4
                bg-[var(--md-sys-color-surface-container-high)]
                rounded-[28px] shadow-2xl
                flex flex-col
                max-h-[85vh]
              `}
              variants={popupVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--md-sys-color-outline-variant)]/30">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {icon && <div className="flex-shrink-0">{icon}</div>}
                  <div className="min-w-0">
                    <h2 className="text-xl font-semibold text-[var(--md-sys-color-on-surface)]">
                      {title}
                    </h2>
                    {subtitle && (
                      <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
                        {subtitle}
                      </p>
                    )}
                  </div>
                </div>
                {showCloseButton && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-highest)] transition-colors flex-shrink-0 ml-2"
                  >
                    <X
                      size={20}
                      className="text-[var(--md-sys-color-on-surface-variant)]"
                    />
                  </motion.button>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">{children}</div>

              {/* Footer */}
              {footer && (
                <div className="flex-shrink-0 border-t border-[var(--md-sys-color-outline-variant)]/30">
                  {footer}
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AdaptiveModal;
