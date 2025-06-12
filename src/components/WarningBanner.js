import { motion } from 'framer-motion';
import React from 'react';

const WarningBanner = ({
  icon: Icon,
  title,
  message,
  darkMode = false,
  className = '',
  onInviteClick,
  variant = 'blue',
  clickableWord = 'rejoindre',
}) => {
  const colors = {
    blue: {
      bg: darkMode
        ? 'bg-blue-900/20 border-blue-700/30'
        : 'bg-blue-50 border-blue-200/50',
      icon: darkMode ? 'text-blue-300' : 'text-blue-600',
      text: darkMode ? 'text-blue-100' : 'text-blue-800',
      button: darkMode
        ? 'text-blue-300 hover:text-blue-200'
        : 'text-blue-600 hover:text-blue-700',
    },
    purple: {
      bg: darkMode
        ? 'bg-purple-900/20 border-purple-700/30'
        : 'bg-purple-50 border-purple-200/50',
      icon: darkMode ? 'text-purple-300' : 'text-purple-600',
      text: darkMode ? 'text-purple-100' : 'text-purple-800',
      button: darkMode
        ? 'text-purple-300 hover:text-purple-200'
        : 'text-purple-600 hover:text-purple-700',
    },
  };

  const currentColors = colors[variant];

  const renderMessage = () => {
    if (message.includes(clickableWord)) {
      const parts = message.split(clickableWord);
      return (
        <>
          {parts[0]}
          <button
            onClick={onInviteClick}
            className={`underline font-medium hover:no-underline transition-all duration-200 ${currentColors.button}`}
          >
            {clickableWord}
          </button>
          {parts[1]}
        </>
      );
    }
    return message;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full ${currentColors.bg} border-b backdrop-blur-sm ${className}`}
    >
      <div className="px-4 py-2.5">
        <div className="flex items-center justify-center space-x-2 max-w-6xl mx-auto">
          {Icon && (
            <Icon size={16} className={`flex-shrink-0 ${currentColors.icon}`} />
          )}
          <p className={`text-sm text-center ${currentColors.text}`}>
            {title && <span className="font-medium mr-1">{title}</span>}
            {renderMessage()}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default WarningBanner;
