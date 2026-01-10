import { AnimatePresence, motion } from 'framer-motion';
import { Mail, Phone, QrCode, Share2, UserPlus, X } from 'lucide-react';
import { useState } from 'react';
import { MD3IconButton } from './common';
import FriendInviteForm from './friends/FriendInviteForm';
import PhoneSearch from './friends/PhoneSearch';
import QRCodeScanner from './friends/QRCodeScanner';

const AddFriendModal = ({
  isOpen,
  onClose,
  onAddFriend,
  currentUser,
  darkMode = false,
}) => {
  const [method, setMethod] = useState('phone'); // 'phone', 'qr', 'mail', ou 'share'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const resetState = () => {
    setError('');
    setSuccess('');
  };

  const handleMethodChange = newMethod => {
    setMethod(newMethod);
    resetState();
  };

  const methods = [
    { id: 'phone', icon: <Phone size={20} />, label: 'Téléphone' },
    { id: 'mail', icon: <Mail size={20} />, label: 'Email' },
    { id: 'qr', icon: <QrCode size={20} />, label: 'QR Code' },
    { id: 'share', icon: <Share2 size={20} />, label: 'Partager' },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="rounded-[var(--md-sys-shape-corner-extra-large)] p-6 w-full max-w-md max-h-[90vh] overflow-y-auto bg-[var(--md-sys-color-surface-container-high)] shadow-[var(--md-sys-elevation-level3)]"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <motion.div
                className="w-12 h-12 rounded-[var(--md-sys-shape-corner-large)] bg-[var(--md-sys-color-primary-container)] flex items-center justify-center"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 400, delay: 0.1 }}
              >
                <UserPlus
                  size={24}
                  className="text-[var(--md-sys-color-on-primary-container)]"
                />
              </motion.div>
              <div>
                <h2 className="text-title-large font-semibold text-[var(--md-sys-color-on-surface)]">
                  Ajouter un ami
                </h2>
                <p className="text-body-small text-[var(--md-sys-color-on-surface-variant)]">
                  Choisissez une méthode
                </p>
              </div>
            </div>
            <MD3IconButton
              icon={<X size={20} />}
              onClick={onClose}
              variant="standard"
              className="text-[var(--md-sys-color-on-surface-variant)]"
            />
          </div>

          {/* Method Selection - MD3 Chip-like tabs */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            {methods.map(({ id, icon, label }, index) => (
              <motion.button
                key={id}
                onClick={() => handleMethodChange(id)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`
                  flex flex-col items-center justify-center gap-1.5 py-3 px-2
                  rounded-[var(--md-sys-shape-corner-large)] 
                  transition-all duration-200
                  ${
                    method === id
                      ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-md'
                      : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)]'
                  }
                `}
              >
                {icon}
                <span className="text-label-small font-medium text-center leading-tight">
                  {label}
                </span>
              </motion.button>
            ))}
          </div>

          {/* Content with AnimatePresence for smooth transitions */}
          <AnimatePresence mode="wait">
            <motion.div
              key={method}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {method === 'phone' && (
                <PhoneSearch
                  onAddFriend={onAddFriend}
                  loading={loading}
                  setLoading={setLoading}
                  setError={setError}
                  setSuccess={setSuccess}
                  onClose={onClose}
                  darkMode={darkMode}
                />
              )}

              {method === 'qr' && (
                <QRCodeScanner
                  currentUser={currentUser}
                  onAddFriend={onAddFriend}
                  loading={loading}
                  setLoading={setLoading}
                  setError={setError}
                  setSuccess={setSuccess}
                  onClose={onClose}
                  darkMode={darkMode}
                />
              )}

              {(method === 'mail' || method === 'share') && (
                <FriendInviteForm
                  method={method}
                  currentUser={currentUser}
                  loading={loading}
                  setLoading={setLoading}
                  setError={setError}
                  setSuccess={setSuccess}
                  onClose={onClose}
                  darkMode={darkMode}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Messages - Using MD3Snackbar style inline */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="mt-4 p-4 rounded-[var(--md-sys-shape-corner-medium)] bg-[var(--md-sys-color-error-container)] border border-[var(--md-sys-color-error)]/20"
              >
                <p className="text-body-medium text-[var(--md-sys-color-on-error-container)]">
                  {error}
                </p>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="mt-4 p-4 rounded-[var(--md-sys-shape-corner-medium)] bg-[var(--md-sys-color-success)]/10 border border-[var(--md-sys-color-success)]/20"
              >
                <p className="text-body-medium text-[var(--md-sys-color-success)]">
                  {success}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddFriendModal;
