import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';
import MD3Button from './common/MD3Button';

const DeleteAccountModal = ({ isOpen, onClose, onConfirm, darkMode }) => {
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleConfirm = () => {
    if (deleteConfirmText !== 'DELETE') {
      alert('Veuillez taper exactement "DELETE" pour confirmer');
      return;
    }
    onConfirm();
    setDeleteConfirmText('');
  };

  const handleClose = () => {
    setDeleteConfirmText('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          onClick={e => e.stopPropagation()}
          className="bg-[var(--md-sys-color-surface-container-high)] rounded-[var(--md-sys-shape-corner-extra-large)] p-6 w-full max-w-md shadow-[var(--md-sys-elevation-level3)]"
        >
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 400, delay: 0.1 }}
              className="mx-auto w-20 h-20 bg-[var(--md-sys-color-error-container)] rounded-[var(--md-sys-shape-corner-extra-large)] flex items-center justify-center mb-4"
            >
              <AlertTriangle
                size={40}
                className="text-[var(--md-sys-color-error)]"
              />
            </motion.div>
            <h3 className="text-headline-small font-semibold text-[var(--md-sys-color-on-surface)] mb-2">
              Supprimer votre compte
            </h3>
            <p className="text-body-medium text-[var(--md-sys-color-on-surface-variant)] mb-4">
              Cette action est{' '}
              <strong className="text-[var(--md-sys-color-error)]">
                irréversible
              </strong>
              . Toutes vos données, amis, disponibilités et notifications seront
              définitivement supprimées.
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-label-large font-medium mb-3 text-[var(--md-sys-color-on-surface)]">
              Pour confirmer, tapez{' '}
              <span className="font-mono px-2 py-0.5 rounded-[var(--md-sys-shape-corner-small)] bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-error)]">
                DELETE
              </span>
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              placeholder="Tapez DELETE ici..."
              className="w-full px-4 py-3 border-2 rounded-[var(--md-sys-shape-corner-medium)] 
                bg-[var(--md-sys-color-surface)] 
                border-[var(--md-sys-color-outline)] 
                text-[var(--md-sys-color-on-surface)] 
                placeholder-[var(--md-sys-color-on-surface-variant)]/50
                focus:border-[var(--md-sys-color-error)] focus:ring-2 focus:ring-[var(--md-sys-color-error)]/20 focus:outline-none
                transition-all duration-200"
            />
          </div>

          <div className="flex gap-3">
            <MD3Button variant="tonal" onClick={handleClose} fullWidth>
              Annuler
            </MD3Button>
            <MD3Button
              variant="error"
              onClick={handleConfirm}
              disabled={deleteConfirmText !== 'DELETE'}
              fullWidth
              icon={<X size={18} />}
            >
              Supprimer
            </MD3Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DeleteAccountModal;
