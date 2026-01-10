import { AnimatePresence, motion } from 'framer-motion';
import { Phone, Settings, X } from 'lucide-react';

const PhoneRequiredModal = ({ isOpen, onClose, onGoToSettings, darkMode }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className="bg-[var(--md-sys-color-surface-container)] rounded-xl p-6 max-w-md w-full shadow-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-[var(--md-sys-color-primary-container)] rounded-full flex items-center justify-center mr-3">
                <Phone
                  size={20}
                  className="text-[var(--md-sys-color-on-primary-container)]"
                />
              </div>
              <h3 className="text-lg font-semibold text-[var(--md-sys-color-on-surface)]">
                Numéro requis
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg transition-colors text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)]"
            >
              <X size={20} />
            </button>
          </div>

          {/* Contenu */}
          <div className="mb-6">
            <p className="text-[var(--md-sys-color-on-surface-variant)] mb-4 leading-relaxed">
              Pour inviter des amis, vous devez d'abord ajouter votre numéro de
              téléphone.
            </p>

            <div className="bg-[var(--md-sys-color-surface-container-highest)] rounded-lg p-4 mb-4">
              <h4 className="font-medium mb-2 text-[var(--md-sys-color-on-surface)]">
                Pourquoi un numéro de téléphone ?
              </h4>
              <ul className="text-sm space-y-1 text-[var(--md-sys-color-on-surface-variant)]">
                <li>• Vos amis pourront vous retrouver facilement</li>
                <li>• Vous pourrez rechercher des amis par leur numéro</li>
                <li>• Améliore la sécurité de votre compte</li>
              </ul>
            </div>

            <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
              Votre numéro ne sera partagé qu'avec vos amis confirmés.
            </p>
          </div>

          {/* Boutons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-lg font-medium transition-colors bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface)] hover:opacity-80"
            >
              Plus tard
            </button>
            <button
              onClick={onGoToSettings}
              className="flex-1 bg-[var(--md-sys-color-primary)] hover:opacity-90 text-[var(--md-sys-color-on-primary)] py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <Settings size={18} />
              <span>Ajouter mon numéro</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PhoneRequiredModal;
