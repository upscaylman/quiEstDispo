import { motion } from 'framer-motion';
import { Mail, Phone, QrCode, Share2, UserPlus, X } from 'lucide-react';
import React, { useState } from 'react';
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

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2
            className={`text-xl font-bold flex items-center ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            <UserPlus className="mr-2" size={24} />
            Ajouter un ami
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <X
              size={20}
              className={darkMode ? 'text-gray-300' : 'text-gray-600'}
            />
          </button>
        </div>

        {/* Method Selection */}
        <div
          className={`grid grid-cols-4 mb-6 rounded-lg p-1 gap-1 ${
            darkMode ? 'bg-gray-700' : 'bg-gray-100'
          }`}
        >
          <button
            onClick={() => handleMethodChange('phone')}
            className={`py-2 px-2 rounded-md flex flex-col items-center justify-center transition-colors text-xs ${
              method === 'phone'
                ? darkMode
                  ? 'bg-gray-600 shadow text-blue-400'
                  : 'bg-white shadow text-blue-600'
                : darkMode
                  ? 'text-gray-300'
                  : 'text-gray-600'
            }`}
          >
            <Phone size={16} className="mb-1" />
            Téléphone
          </button>
          <button
            onClick={() => handleMethodChange('mail')}
            className={`py-2 px-2 rounded-md flex flex-col items-center justify-center transition-colors text-xs ${
              method === 'mail'
                ? darkMode
                  ? 'bg-gray-600 shadow text-blue-400'
                  : 'bg-white shadow text-blue-600'
                : darkMode
                  ? 'text-gray-300'
                  : 'text-gray-600'
            }`}
          >
            <Mail size={16} className="mb-1" />
            Email
          </button>
          <button
            onClick={() => handleMethodChange('qr')}
            className={`py-2 px-2 rounded-md flex flex-col items-center justify-center transition-colors text-xs ${
              method === 'qr'
                ? darkMode
                  ? 'bg-gray-600 shadow text-blue-400'
                  : 'bg-white shadow text-blue-600'
                : darkMode
                  ? 'text-gray-300'
                  : 'text-gray-600'
            }`}
          >
            <QrCode size={16} className="mb-1" />
            QR Code
          </button>
          <button
            onClick={() => handleMethodChange('share')}
            className={`py-2 px-2 rounded-md flex flex-col items-center justify-center transition-colors text-xs ${
              method === 'share'
                ? darkMode
                  ? 'bg-gray-600 shadow text-blue-400'
                  : 'bg-white shadow text-blue-600'
                : darkMode
                  ? 'text-gray-300'
                  : 'text-gray-600'
            }`}
          >
            <Share2 size={16} className="mb-1" />
            Partager
          </button>
        </div>

        {/* Content */}
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

        {/* Messages */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-4 p-3 border rounded-lg ${
              darkMode
                ? 'bg-red-900/20 border-red-800 text-red-300'
                : 'bg-red-100 border-red-200 text-red-700'
            }`}
          >
            <p className="text-sm">{error}</p>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-4 p-3 border rounded-lg ${
              darkMode
                ? 'bg-green-900/20 border-green-800 text-green-300'
                : 'bg-green-100 border-green-200 text-green-700'
            }`}
          >
            <p className="text-sm">{success}</p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default AddFriendModal;
