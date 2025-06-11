import { motion } from 'framer-motion';
import { Mail, Phone, QrCode, Share2, UserPlus, X } from 'lucide-react';
import React, { useState } from 'react';
import FriendInviteForm from './FriendInviteForm';
import PhoneSearch from './PhoneSearch';
import QRCodeScanner from './QRCodeScanner';

const AddFriendModal = ({ isOpen, onClose, onAddFriend, currentUser }) => {
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
        className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center">
            <UserPlus className="mr-2" size={24} />
            Ajouter un ami
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {/* Method Selection */}
        <div className="grid grid-cols-4 mb-6 bg-gray-100 rounded-lg p-1 gap-1">
          <button
            onClick={() => handleMethodChange('phone')}
            className={`py-2 px-2 rounded-md flex flex-col items-center justify-center transition-colors text-xs ${
              method === 'phone'
                ? 'bg-white shadow text-blue-600'
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
                ? 'bg-white shadow text-blue-600'
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
                ? 'bg-white shadow text-blue-600'
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
                ? 'bg-white shadow text-blue-600'
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
          />
        )}

        {/* Messages */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-red-100 border border-red-200 rounded-lg"
          >
            <p className="text-red-700 text-sm">{error}</p>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-green-100 border border-green-200 rounded-lg"
          >
            <p className="text-green-700 text-sm">{success}</p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default AddFriendModal;
